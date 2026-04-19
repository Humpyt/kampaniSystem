import express from 'express';
import db from '../database';
import { authenticateToken } from './auth';

const router = express.Router();

// Helper to get date boundaries
const getDateBoundaries = () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { now, startOfToday, endOfToday, startOfWeek, startOfMonth, endOfMonth };
};

// GET /api/analytics/discounts - Returns discount analytics (from both operations and sales)
router.get('/discounts', async (req, res) => {
  try {
    const { startOfMonth, endOfMonth } = getDateBoundaries();

    // Get summary statistics from operations (source of truth for discounts)
    const summaryResult = await db.get(`
      SELECT
        COUNT(*) as totalOperations,
        COALESCE(SUM(discount), 0) as totalDiscounts,
        COALESCE(AVG(CASE WHEN discount > 0 THEN (discount / NULLIF(total_amount + discount, 0)) * 100 ELSE 0 END), 0) as averageDiscountPercent,
        COUNT(CASE WHEN discount > 0 THEN 1 END) as operationsWithDiscount
      FROM operations
      WHERE discount > 0
    `) as any;

    // Also get discount counts from sales table (for product sales)
    const salesDiscountResult = await db.get(`
      SELECT
        COUNT(*) as totalSalesWithDiscount,
        COALESCE(SUM(discount), 0) as totalSalesDiscounts
      FROM sales
      WHERE discount > 0
    `) as any;

    const totalOperationsWithDiscount = Number(summaryResult?.operationswithdiscount) || 0;
    const totalSalesWithDiscount = Number(salesDiscountResult?.totalsaleswithdiscount) || 0;
    const totalDiscounts = Number(summaryResult?.totaldiscounts || 0) + Number(salesDiscountResult?.totalsalesdiscounts || 0);
    const averageDiscountPercent = Number(summaryResult?.averagediscountpercent) || 0;

    // Get discounts by period (last 30 days) from operations
    const byPeriodResult = await db.all(`
      SELECT
        DATE(created_at) as date,
        SUM(discount) as total,
        COUNT(*) as count
      FROM operations
      WHERE discount > 0
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `) as any[];

    // Also get sales discounts by period (for sales that may have discounts not tied to operations)
    const salesPeriodResult = await db.all(`
      SELECT
        DATE(created_at) as date,
        SUM(discount) as total,
        COUNT(*) as count
      FROM sales
      WHERE discount > 0
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `) as any[];

    // Merge period data (union of operations and sales discounts by date)
    const periodMap = new Map<string, { total: number; count: number }>();
    for (const row of byPeriodResult) {
      periodMap.set(row.date.toISOString().split('T')[0], { total: Number(row.total), count: Number(row.count) });
    }
    for (const row of salesPeriodResult) {
      const dateKey = row.date.toISOString().split('T')[0];
      const existing = periodMap.get(dateKey);
      if (existing) {
        existing.total += Number(row.total);
        existing.count += Number(row.count);
      } else {
        periodMap.set(dateKey, { total: Number(row.total), count: Number(row.count) });
      }
    }
    const byPeriod = Array.from(periodMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, total: values.total, count: values.count }));

    // Get top discounted operations with services/products
    const topDiscountedResult = await db.all(`
      SELECT
        o.id,
        COALESCE(c.name, 'Unknown') as customerName,
        o.total_amount,
        o.discount,
        o.created_at as date,
        CASE WHEN o.total_amount + o.discount > 0
          THEN LEAST((o.discount / (o.total_amount + o.discount)) * 100, 100)
          ELSE 0
        END as discount_percent
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.discount > 0
      ORDER BY o.discount DESC
      LIMIT 10
    `) as any[];

    // Also get top discounted sales (for standalone product sales with discounts)
    // Join through reference_id (operation) to get the customer name, since sales.customer_id may be NULL
    const topSalesDiscountedResult = await db.all(`
      SELECT
        s.id,
        s.reference_id as operationId,
        COALESCE(cust.name, op_cust.name, 'Unknown') as customerName,
        s.total_amount,
        s.discount,
        s.created_at as date,
        CASE WHEN s.total_amount + s.discount > 0
          THEN LEAST((s.discount / (s.total_amount + s.discount)) * 100, 100)
          ELSE 0
        END as discount_percent
      FROM sales s
      LEFT JOIN customers cust ON s.customer_id = cust.id
      LEFT JOIN operations op ON s.reference_id = op.id
      LEFT JOIN customers op_cust ON op.customer_id = op_cust.id
      WHERE s.discount > 0
      ORDER BY s.discount DESC
      LIMIT 10
    `) as any[];

    // Merge top discounted (operations and sales), sort by discount descending, take top 10
    const allTopDiscounted = [
      ...topDiscountedResult.map(row => ({
        id: row.id,
        sourceType: 'operation' as const,
        operationId: row.id,
        customerName: row.customername || 'Unknown',
        totalAmount: Number(row.total_amount) || 0,
        discount: Number(row.discount) || 0,
        discountPercent: Number(row.discount_percent) || 0,
        date: row.date,
      })),
      ...topSalesDiscountedResult.map(row => ({
        id: row.id,
        sourceType: 'sale' as const,
        operationId: row.operationid,
        customerName: row.customername || 'Unknown',
        totalAmount: Number(row.total_amount) || 0,
        discount: Number(row.discount) || 0,
        discountPercent: Number(row.discount_percent) || 0,
        date: row.date,
      }))
    ]
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 10);

    // Get services and products for each discounted operation
    const topDiscounted = await Promise.all(allTopDiscounted.map(async (row) => {
      // Get services for this operation
      const servicesResult = await db.all(`
        SELECT DISTINCT s.name
        FROM operation_services os
        JOIN services s ON os.service_id = s.id
        WHERE os.operation_shoe_id IN (
          SELECT id FROM operation_shoes WHERE operation_id = $1
        )
        LIMIT 5
      `, [row.operationId]) as any[];

      // Get retail products for this operation
      const productsResult = await db.all(`
        SELECT product_name as name
        FROM operation_retail_items
        WHERE operation_id = $1
        LIMIT 5
      `, [row.operationId]) as any[];

      const items = [
        ...servicesResult.map(s => ({ name: s.name, type: 'service' as const, price: 0 })),
        ...productsResult.map(p => ({ name: p.name, type: 'product' as const, price: 0 }))
      ];

      return {
        id: row.id,
        customerName: row.customerName || 'Unknown',
        totalAmount: row.totalAmount,
        discount: row.discount,
        discountPercent: row.discountPercent || 0,
        date: row.date,
        items
      };
    }));

    res.json({
      summary: {
        totalDiscounts,
        averageDiscountPercent: Math.round(averageDiscountPercent * 100) / 100,
        operationsWithDiscount: totalOperationsWithDiscount + totalSalesWithDiscount
      },
      byPeriod,
      topDiscounted
    });
  } catch (error) {
    console.error('Error fetching discount analytics:', error);
    res.status(500).json({ error: 'Failed to fetch discount analytics' });
  }
});

// GET /api/analytics/new-customers - Returns new customer analytics
router.get('/new-customers', async (req, res) => {
  try {
    const { startOfToday, endOfToday, startOfWeek, startOfMonth, endOfMonth } = getDateBoundaries();

    // Get summary counts
    const totalResult = await db.get(`
      SELECT COUNT(*) as total FROM customers
    `) as any;

    const thisMonthResult = await db.get(`
      SELECT COUNT(*) as count FROM customers
      WHERE created_at >= $1 AND created_at <= $2
    `, [startOfMonth, endOfMonth]) as any;

    const thisWeekResult = await db.get(`
      SELECT COUNT(*) as count FROM customers
      WHERE created_at >= $1
    `, [startOfWeek]) as any;

    const todayResult = await db.get(`
      SELECT COUNT(*) as count FROM customers
      WHERE created_at >= $1 AND created_at <= $2
    `, [startOfToday, endOfToday]) as any;

    // Get trend (daily new customers for last 30 days)
    const trendResult = await db.all(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM customers
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `) as any[];

    const trend = trendResult.map(row => ({
      date: row.date,
      count: Number(row.count)
    }));

    // Get recent customers
    const recentCustomersResult = await db.all(`
      SELECT
        id,
        name,
        phone,
        created_at as createdAt,
        total_orders
      FROM customers
      ORDER BY created_at DESC
      LIMIT 10
    `) as any[];

    const recentCustomers = recentCustomersResult.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      createdAt: row.createdAt,
      totalOrders: Number(row.total_orders) || 0
    }));

    res.json({
      summary: {
        total: Number(totalResult.total) || 0,
        thisMonth: Number(thisMonthResult?.count) || 0,
        thisWeek: Number(thisWeekResult?.count) || 0,
        today: Number(todayResult?.count) || 0
      },
      trend,
      recentCustomers
    });
  } catch (error) {
    console.error('Error fetching new customer analytics:', error);
    res.status(500).json({ error: 'Failed to fetch new customer analytics' });
  }
});

// GET /api/analytics/customer-rankings - Returns customer rankings by multiple metrics
router.get('/customer-rankings', async (req, res) => {
  try {
    // Get all customers ordered by total_spent
    const bySpentResult = await db.all(`
      SELECT
        id,
        name,
        phone,
        total_spent as totalSpent,
        total_orders as orderCount,
        last_visit as lastVisit
      FROM customers
      WHERE status = 'active'
      ORDER BY total_spent DESC
      LIMIT 20
    `) as any[];

    const bySpent = bySpentResult.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      totalSpent: row.totalspent || 0,
      orderCount: row.ordercount || 0,
      lastVisit: row.lastvisit
    }));

    // Get all customers ordered by order count
    const byOrdersResult = await db.all(`
      SELECT
        id,
        name,
        phone,
        total_spent as totalSpent,
        total_orders as orderCount,
        last_visit as lastVisit
      FROM customers
      WHERE status = 'active'
      ORDER BY total_orders DESC
      LIMIT 20
    `) as any[];

    const byOrders = byOrdersResult.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      totalSpent: row.totalspent || 0,
      orderCount: row.ordercount || 0,
      lastVisit: row.lastvisit
    }));

    // Get all customers ordered by loyalty points
    const byLoyaltyResult = await db.all(`
      SELECT
        id,
        name,
        phone,
        loyalty_points as loyaltyPoints,
        total_spent as totalSpent
      FROM customers
      WHERE status = 'active'
      ORDER BY loyalty_points DESC
      LIMIT 20
    `) as any[];

    const byLoyalty = byLoyaltyResult.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      loyaltyPoints: row.loyaltypoints || 0,
      totalSpent: row.totalspent || 0
    }));

    res.json({
      bySpent,
      byOrders,
      byLoyalty
    });
  } catch (error) {
    console.error('Error fetching customer rankings:', error);
    res.status(500).json({ error: 'Failed to fetch customer rankings' });
  }
});

// GET /api/analytics/service-performance - Returns service performance analytics
router.get('/service-performance', async (req, res) => {
  try {
    // Get service performance by revenue
    const byRevenueResult = await db.all(`
      SELECT
        s.id as serviceId,
        s.name as serviceName,
        s.category,
        COALESCE(SUM(os.price * os.quantity), 0) as totalRevenue,
        COUNT(DISTINCT os.operation_shoe_id) as orderCount
      FROM services s
      LEFT JOIN operation_services os ON s.id = os.service_id
      GROUP BY s.id, s.name, s.category
      ORDER BY totalRevenue DESC
    `) as any[];

    const byRevenue = byRevenueResult.map(row => ({
      serviceId: row.serviceid,
      serviceName: row.servicename,
      category: row.category || 'Uncategorized',
      totalRevenue: Number(row.totalrevenue) || 0,
      orderCount: Number(row.ordercount) || 0
    }));

    // Get service performance by order count
    const byOrdersResult = await db.all(`
      SELECT
        s.id as serviceId,
        s.name as serviceName,
        s.category,
        COALESCE(SUM(os.price * os.quantity), 0) as totalRevenue,
        COUNT(DISTINCT os.operation_shoe_id) as orderCount
      FROM services s
      LEFT JOIN operation_services os ON s.id = os.service_id
      GROUP BY s.id, s.name, s.category
      ORDER BY orderCount DESC
    `) as any[];

    const byOrders = byOrdersResult.map(row => ({
      serviceId: row.serviceid,
      serviceName: row.servicename,
      category: row.category || 'Uncategorized',
      totalRevenue: Number(row.totalrevenue) || 0,
      orderCount: Number(row.ordercount) || 0
    }));

    // Get category breakdown
    const categoryBreakdownResult = await db.all(`
      SELECT
        COALESCE(s.category, 'Uncategorized') as category,
        COALESCE(SUM(os.price * os.quantity), 0) as totalRevenue,
        COUNT(DISTINCT os.operation_shoe_id) as orderCount
      FROM services s
      LEFT JOIN operation_services os ON s.id = os.service_id
      GROUP BY s.category
      ORDER BY totalRevenue DESC
    `) as any[];

    const categoryBreakdown = categoryBreakdownResult.map(row => ({
      category: row.category || 'Uncategorized',
      totalRevenue: Number(row.totalrevenue) || 0,
      orderCount: Number(row.ordercount) || 0
    }));

    res.json({
      byRevenue,
      byOrders,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Error fetching service performance:', error);
    res.status(500).json({ error: 'Failed to fetch service performance analytics' });
  }
});

// GET /api/analytics/unpaid-balances - Returns unpaid balance analytics
router.get('/unpaid-balances', async (req, res) => {
  try {
    const now = new Date();

    // Get summary statistics
    const summaryResult = await db.get(`
      SELECT
        COALESCE(SUM(total_amount - paid_amount), 0) as totalUnpaid,
        COUNT(CASE WHEN (total_amount - paid_amount) > 0 THEN 1 END) as partialPaymentCount,
        COUNT(CASE WHEN (total_amount - paid_amount) = total_amount
                   AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as overdueCount
      FROM operations
      WHERE total_amount > paid_amount
    `) as any;

    // Get aging analysis
    const agingResult = await db.get(`
      SELECT
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as currentCount,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days'
                          THEN total_amount - paid_amount ELSE 0 END), 0) as currentBalance,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days'
                   AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as aging30Count,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days'
                          AND created_at < CURRENT_DATE - INTERVAL '30 days'
                          THEN total_amount - paid_amount ELSE 0 END), 0) as aging30Balance,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '90 days'
                   AND created_at < CURRENT_DATE - INTERVAL '60 days' THEN 1 END) as aging60Count,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '90 days'
                          AND created_at < CURRENT_DATE - INTERVAL '60 days'
                          THEN total_amount - paid_amount ELSE 0 END), 0) as aging60Balance,
        COUNT(CASE WHEN created_at < CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as overdueCount,
        COALESCE(SUM(CASE WHEN created_at < CURRENT_DATE - INTERVAL '90 days'
                          THEN total_amount - paid_amount ELSE 0 END), 0) as overdueBalance
      FROM operations
      WHERE total_amount > paid_amount
    `) as any;

    const agingAnalysis = {
      current: {
        balance: agingResult.currentBalance || 0,
        count: agingResult.currentCount || 0
      },
      aging30: {
        balance: agingResult.aging30Balance || 0,
        count: agingResult.aging30Count || 0
      },
      aging60: {
        balance: agingResult.aging60Balance || 0,
        count: agingResult.aging60Count || 0
      },
      overdue: {
        balance: agingResult.overdueBalance || 0,
        count: agingResult.overdueCount || 0
      }
    };

    // Get unpaid operations
    const unpaidOperationsResult = await db.all(`
      SELECT
        o.id,
        o.customer_id as customerId,
        c.name as customerName,
        c.phone as customerPhone,
        o.total_amount,
        o.paid_amount,
        o.total_amount - o.paid_amount as balance,
        o.created_at as createdAt,
        o.created_at as createdAtRaw
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.total_amount > o.paid_amount
      ORDER BY o.created_at ASC
      LIMIT 50
    `) as any[];

    const unpaidOperations = unpaidOperationsResult.map(row => {
      const createdAtDate = new Date(row.createdAtRaw);
      const daysOutstanding = Math.floor((now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: row.id,
        customerId: row.customerId || '',
        customerName: row.customerName || 'Unknown',
        customerPhone: row.customerPhone || '',
        totalAmount: row.total_amount,
        paidAmount: row.paid_amount,
        balance: row.balance,
        createdAt: row.createdAt,
        daysOutstanding
      };
    });

    res.json({
      summary: {
        totalUnpaid: summaryResult.totalUnpaid || 0,
        overdueCount: summaryResult.overdueCount || 0,
        partialPaymentCount: summaryResult.partialPaymentCount || 0
      },
      agingAnalysis,
      unpaidOperations
    });
  } catch (error) {
    console.error('Error fetching unpaid balances:', error);
    res.status(500).json({ error: 'Failed to fetch unpaid balance analytics' });
  }
});

// GET /api/analytics/profit-summary - Returns sales, expenses, and profit summary
router.get('/profit-summary', authenticateToken, async (req: any, res: any) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const isStaff = req.user.role === 'staff';
    const userId = req.user.id;

    // Total sales (all time)
    const totalSalesResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM operations
      ${isStaff ? 'WHERE created_by = $1' : ''}
    `, isStaff ? [userId] : []) as any;

    // Total expenses (all time)
    const totalExpensesResult = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expenses
      ${isStaff ? 'WHERE created_by = $1' : ''}
    `, isStaff ? [userId] : []) as any;

    // Sales this month
    const salesThisMonthResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= $1${isStaff ? ' AND created_by = $2' : ''}
    `, [startOfMonth.toISOString(), ...(isStaff ? [userId] : [])]) as any;

    // Sales last month
    const salesLastMonthResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= $1 AND created_at <= $2${isStaff ? ' AND created_by = $3' : ''}
    `, [startOfLastMonth.toISOString(), endOfLastMonth.toISOString(), ...(isStaff ? [userId] : [])]) as any;

    // Expenses this month
    const expensesThisMonthResult = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date >= $1${isStaff ? ' AND created_by = $2' : ''}
    `, [startOfMonth.toISOString().split('T')[0], ...(isStaff ? [userId] : [])]) as any;

    // Expenses last month
    const expensesLastMonthResult = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date >= $1 AND date <= $2${isStaff ? ' AND created_by = $3' : ''}
    `, [startOfLastMonth.toISOString().split('T')[0], endOfLastMonth.toISOString().split('T')[0], ...(isStaff ? [userId] : [])]) as any;

    // Calculate values
    const totalSales = totalSalesResult?.total || 0;
    const totalExpenses = totalExpensesResult?.total || 0;
    const netProfit = totalSales - totalExpenses;
    const salesThisMonth = salesThisMonthResult?.total || 0;
    const expensesThisMonth = expensesThisMonthResult?.total || 0;
    const profitThisMonth = salesThisMonth - expensesThisMonth;

    // Calculate trends (% change vs last month)
    const salesLastMonth = salesLastMonthResult?.total || 0;
    const expensesLastMonth = expensesLastMonthResult?.total || 0;
    const profitLastMonth = salesLastMonth - expensesLastMonth;

    const salesTrend = salesLastMonth > 0
      ? ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100
      : 0;
    const expenseTrend = expensesLastMonth > 0
      ? ((expensesThisMonth - expensesLastMonth) / expensesLastMonth) * 100
      : 0;
    const profitTrend = profitLastMonth > 0
      ? ((profitThisMonth - profitLastMonth) / profitLastMonth) * 100
      : 0;

    // Get monthly breakdown for last 6 months
    const monthlyBreakdownResult = await db.all(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        SUM(total_amount) as sales
      FROM operations
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'${isStaff ? ' AND created_by = $1' : ''}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `, isStaff ? [userId] : []) as any[];

    const monthlyExpenseResult = await db.all(`
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(amount) as expenses
      FROM expenses
      WHERE date >= CURRENT_DATE - INTERVAL '6 months'${isStaff ? ' AND created_by = $1' : ''}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `, isStaff ? [userId] : []) as any[];

    // Combine monthly data
    const monthlyDataMap = new Map<string, { sales: number; expenses: number; profit: number }>();

    for (const row of monthlyBreakdownResult) {
      monthlyDataMap.set(row.month, { sales: row.sales || 0, expenses: 0, profit: 0 });
    }
    for (const row of monthlyExpenseResult) {
      const existing = monthlyDataMap.get(row.month) || { sales: 0, expenses: 0, profit: 0 };
      existing.expenses = row.expenses || 0;
      existing.profit = existing.sales - existing.expenses;
      monthlyDataMap.set(row.month, existing);
    }

    const monthlyBreakdown = Array.from(monthlyDataMap.entries()).map(([month, data]) => ({
      month,
      sales: data.sales,
      expenses: data.expenses,
      profit: data.profit
    })).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      totalSales,
      totalExpenses,
      netProfit,
      salesThisMonth,
      expensesThisMonth,
      profitThisMonth,
      salesTrend: Math.round(salesTrend * 10) / 10,
      expenseTrend: Math.round(expenseTrend * 10) / 10,
      profitTrend: Math.round(profitTrend * 10) / 10,
      monthlyBreakdown
    });
  } catch (error) {
    console.error('Error fetching profit summary:', error);
    res.status(500).json({ error: 'Failed to fetch profit summary' });
  }
});

// DEBUG: Check what's actually in operation_payments
router.get('/debug-payments', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get ALL payments for the date
    const allPayments = await db.all(`
      SELECT * FROM operation_payments
      WHERE DATE(created_at) = DATE($1)
      ORDER BY created_at DESC
    `, [targetDate]) as any[];

    // Get unique payment methods
    const methods = await db.all(`
      SELECT DISTINCT payment_method FROM operation_payments
      WHERE DATE(created_at) = DATE($1)
    `, [targetDate]) as any[];

    // Get count by raw method
    const byMethodRaw = await db.all(`
      SELECT payment_method, COUNT(*) as count, SUM(amount) as total
      FROM operation_payments
      WHERE DATE(created_at) = DATE($1)
      GROUP BY payment_method
    `, [targetDate]) as any[];

    // Get count by normalized method (what the query does)
    const byMethodNormalized = await db.all(`
      SELECT
        CASE payment_method
          WHEN 'cash' THEN 'Cash'
          WHEN 'mobile_money' THEN 'Mobile Money'
          WHEN 'bank_card' THEN 'Credit Card'
          WHEN 'bank_transfer' THEN 'Bank Transfer'
          WHEN 'cheque' THEN 'Cheque'
          WHEN 'store_credit' THEN 'Store Credit'
          ELSE payment_method
        END as paymentMethod,
        COUNT(*) as count,
        SUM(amount) as total
      FROM operation_payments
      WHERE DATE(created_at) = DATE($1)
      GROUP BY CASE payment_method
          WHEN 'cash' THEN 'Cash'
          WHEN 'mobile_money' THEN 'Mobile Money'
          WHEN 'bank_card' THEN 'Credit Card'
          WHEN 'bank_transfer' THEN 'Bank Transfer'
          WHEN 'cheque' THEN 'Cheque'
          WHEN 'store_credit' THEN 'Store Credit'
          ELSE payment_method
        END
    `, [targetDate]) as any[];

    console.log('[DEBUG] Target date:', targetDate);
    console.log('[DEBUG] All payments count:', allPayments.length);
    console.log('[DEBUG] Payments:', JSON.stringify(allPayments));
    console.log('[DEBUG] Unique methods:', methods);
    console.log('[DEBUG] By raw method:', byMethodRaw);
    console.log('[DEBUG] By normalized method:', byMethodNormalized);

    res.json({
      targetDate,
      allPayments,
      byMethodRaw,
      byMethodNormalized,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/analytics/daily-balance - Returns daily balance sheet with sales/expenses breakdown by payment method
router.get('/daily-balance', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log('[BALANCE] Fetching for date:', targetDate);

    // Get total paid amounts from operations table directly (authoritative source)
    const operationPaymentsResult = await db.all(`
      SELECT
        COALESCE(SUM(paid_amount), 0) as totalPaid,
        COUNT(*) as operationCount
      FROM operations
      WHERE DATE(created_at) = DATE($1)
        AND paid_amount > 0
    `, [targetDate]) as any[];

    console.log('[BALANCE] Operations paid summary:', JSON.stringify(operationPaymentsResult));

    // Get payment breakdown from operation_payments table with detailed grouping
    // Normalize payment method names to display format
    const salesResult = await db.all(`
      SELECT
        COALESCE(
          CASE
            WHEN LOWER(op.payment_method) = 'cash' THEN 'Cash'
            WHEN LOWER(op.payment_method) = 'mobile money' THEN 'Mobile Money'
            WHEN LOWER(op.payment_method) = 'credit card' THEN 'Credit Card'
            WHEN LOWER(op.payment_method) = 'bank transfer' THEN 'Bank Transfer'
            WHEN LOWER(op.payment_method) = 'cheque' THEN 'Cheque'
            WHEN LOWER(op.payment_method) = 'store credit' THEN 'Store Credit'
            ELSE op.payment_method
          END, 'Cash'
        ) as paymentMethod,
        COALESCE(SUM(op.amount), 0) as total
      FROM operation_payments op
      WHERE DATE(op.created_at) = DATE($1)
      GROUP BY 1
    `, [targetDate]) as any[];

    console.log('[BALANCE] Raw sales result from operation_payments:', JSON.stringify(salesResult));

    // If no payments found in operation_payments, use a simpler fallback query
    let normalizedSalesResult = salesResult;
    if (salesResult.length === 0) {
      // Try querying with just the raw payment_method to see what's stored
      const rawPayments = await db.all(`
        SELECT payment_method, amount, created_at FROM operation_payments
        WHERE DATE(created_at) = DATE($1)
        LIMIT 10
      `, [targetDate]) as any[];
      console.log('[BALANCE] Raw payment records:', JSON.stringify(rawPayments));
    }

    // Build normalized sales by method map
    const salesByMethod: Record<string, number> = {
      'Cash': 0,
      'Mobile Money': 0,
      'Credit Card': 0,
      'Bank Transfer': 0,
      'Cheque': 0
    };

    // Map each result to our normalized keys (case-insensitive matching)
    for (const s of salesResult) {
      const method = s.paymentmethod;
      const total = Number(s.total) || 0;

      // Case-insensitive match
      if (method.toLowerCase() === 'cash') {
        salesByMethod['Cash'] += total;
      } else if (method.toLowerCase() === 'mobile money') {
        salesByMethod['Mobile Money'] += total;
      } else if (method.toLowerCase() === 'credit card') {
        salesByMethod['Credit Card'] += total;
      } else if (method.toLowerCase() === 'bank transfer') {
        salesByMethod['Bank Transfer'] += total;
      } else if (method.toLowerCase() === 'cheque') {
        salesByMethod['Cheque'] += total;
      } else {
        // Try to match with original stored value
        salesByMethod['Cash'] += total; // Default to cash for unknown methods
      }
    }

    // If operation_payments has no data but operations table shows payments, use operations data
    const totalFromOperationPayments = Object.values(salesByMethod).reduce((a, b) => a + b, 0);
    const totalPaidFromOperations = Number(operationPaymentsResult[0]?.totalPaid) || 0;

    console.log('[BALANCE] Total from operation_payments:', totalFromOperationPayments);
    console.log('[BALANCE] Total from operations table:', totalPaidFromOperations);

    // If operation_payments is empty but operations shows payments, allocate to Cash
    if (totalFromOperationPayments === 0 && totalPaidFromOperations > 0) {
      console.log('[BALANCE] Using fallback: allocating total from operations to Cash');
      salesByMethod['Cash'] = totalPaidFromOperations;
    }

    console.log('[BALANCE] Final salesByMethod:', JSON.stringify(salesByMethod));

    // Get expenses breakdown by payment method
    const expensesResult = await db.all(`
      SELECT
        COALESCE(
          CASE
            WHEN LOWER(payment_method) = 'cash' THEN 'Cash'
            WHEN LOWER(payment_method) = 'mobile money' THEN 'Mobile Money'
            WHEN LOWER(payment_method) = 'credit card' THEN 'Credit Card'
            WHEN LOWER(payment_method) = 'bank transfer' THEN 'Bank Transfer'
            WHEN LOWER(payment_method) = 'cheque' THEN 'Cheque'
            WHEN LOWER(payment_method) = 'store credit' THEN 'Store Credit'
            ELSE payment_method
          END, 'Cash'
        ) as paymentMethod,
        COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date = $1
      GROUP BY payment_method
    `, [targetDate]) as any[];

    // Get expense details with staff names
    const expenseDetailsResult = await db.all(`
      SELECT e.*, u.name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.date = $1
      ORDER BY e.created_at DESC
    `, [targetDate]) as any[];

    const expenseDetails = expenseDetailsResult.map((e: any) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      amount: e.amount,
      paymentMethod: e.payment_method || 'Cash',
      vendor: e.vendor || '',
      createdByName: e.created_by_name || 'Unknown',
      notes: e.notes || ''
    }));

    // Build expenses by method map
    const expensesByMethod: Record<string, number> = {
      'Cash': 0,
      'Mobile Money': 0,
      'Credit Card': 0,
      'Bank Transfer': 0,
      'Cheque': 0
    };
    for (const e of expensesResult) {
      const method = e.paymentmethod;
      const total = Number(e.total) || 0;
      if (method.toLowerCase() === 'cash') {
        expensesByMethod['Cash'] += total;
      } else if (method.toLowerCase() === 'mobile money') {
        expensesByMethod['Mobile Money'] += total;
      } else if (method.toLowerCase() === 'credit card') {
        expensesByMethod['Credit Card'] += total;
      } else if (method.toLowerCase() === 'bank transfer') {
        expensesByMethod['Bank Transfer'] += total;
      } else if (method.toLowerCase() === 'cheque') {
        expensesByMethod['Cheque'] += total;
      } else {
        expensesByMethod['Cash'] += total;
      }
    }

    // Calculate totals
    const totalSales = Object.values(salesByMethod).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(expensesByMethod).reduce((a, b) => a + b, 0);
    const cashAtHand = salesByMethod['Cash'] - expensesByMethod['Cash'];
    const mobileMoneyBalance = salesByMethod['Mobile Money'] - expensesByMethod['Mobile Money'];
    const cardBalance = salesByMethod['Credit Card'] - expensesByMethod['Credit Card'];
    const bankTransferBalance = salesByMethod['Bank Transfer'] - expensesByMethod['Bank Transfer'];
    const chequeBalance = salesByMethod['Cheque'] - expensesByMethod['Cheque'];

    console.log('[BALANCE] Final totals:', { totalSales, totalExpenses, cashAtHand });

    res.json({
      date: targetDate,
      sales: {
        total: totalSales,
        byMethod: {
          cash: salesByMethod['Cash'],
          mobileMoney: salesByMethod['Mobile Money'],
          card: salesByMethod['Credit Card'],
          bankTransfer: salesByMethod['Bank Transfer'],
          cheque: salesByMethod['Cheque']
        }
      },
      expenses: {
        total: totalExpenses,
        byMethod: {
          cash: expensesByMethod['Cash'],
          mobileMoney: expensesByMethod['Mobile Money'],
          card: expensesByMethod['Credit Card'],
          bankTransfer: expensesByMethod['Bank Transfer'],
          cheque: expensesByMethod['Cheque']
        }
      },
      balance: {
        cashAtHand,
        mobileMoney: mobileMoneyBalance,
        card: cardBalance,
        bankTransfer: bankTransferBalance,
        cheque: chequeBalance
      },
      netBalance: totalSales - totalExpenses,
      expenseDetails
    });
  } catch (error) {
    console.error('Error fetching daily balance:', error);
    res.status(500).json({ error: 'Failed to fetch daily balance' });
  }
});

// GET /api/analytics/daily-balance/archives - List all archived dates
router.get('/daily-balance/archives', async (req, res) => {
  try {
    const archives = await db.all(`
      SELECT id, date, sales_total, expenses_total, cash_at_hand, net_balance, created_at
      FROM daily_balance_archives
      ORDER BY date DESC
      LIMIT 50
    `) as any[];

    res.json(archives.map((a: any) => ({
      id: a.id,
      date: a.date,
      salesTotal: a.sales_total,
      expensesTotal: a.expenses_total,
      cashAtHand: a.cash_at_hand,
      netBalance: a.net_balance,
      createdAt: a.created_at
    })));
  } catch (error) {
    console.error('Error fetching archives:', error);
    res.status(500).json({ error: 'Failed to fetch archives' });
  }
});

// GET /api/analytics/daily-balance/archives/month/:year/:month - Get archives for a specific month
router.get('/daily-balance/archives/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    // Use last day of month calculation
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;

    const archives = await db.all(`
      SELECT id, date, sales_total, expenses_total, cash_at_hand, net_balance
      FROM daily_balance_archives
      WHERE date >= $1 AND date <= $2
      ORDER BY date ASC
    `, [startDate, endDate]) as any[];

    res.json(archives.map((a: any) => ({
      date: a.date,
      hasArchive: true
    })));
  } catch (error) {
    console.error('Error fetching month archives:', error);
    res.status(500).json({ error: 'Failed to fetch month archives' });
  }
});

// GET /api/analytics/daily-balance/archive/:date - Get archived balance for specific date
router.get('/daily-balance/archive/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const archive = await db.get(`
      SELECT * FROM daily_balance_archives WHERE date = $1
    `, [date]) as any;

    if (!archive) {
      return res.status(404).json({ error: 'Archive not found for this date' });
    }

    res.json(JSON.parse(archive.data_json));
  } catch (error) {
    console.error('Error fetching archive:', error);
    res.status(500).json({ error: 'Failed to fetch archive' });
  }
});

// POST /api/analytics/daily-balance/archive - Save current balance sheet as archive
router.post('/daily-balance/archive', async (req, res) => {
  try {
    const { date, data } = req.body;

    // Check if archive already exists for this date
    const existing = await db.get(`
      SELECT id FROM daily_balance_archives WHERE date = $1
    `, [date]) as any;

    const id = existing?.id || `archive_${date}_${Date.now()}`;
    const now = new Date().toISOString();

    if (existing) {
      // Update existing archive
      await db.run(`
        UPDATE daily_balance_archives
        SET sales_total = $1, expenses_total = $2, cash_at_hand = $3, net_balance = $4, data_json = $5, created_at = $6
        WHERE date = $7
      `, [data.sales.total, data.expenses.total, data.balance.cashAtHand, data.netBalance, JSON.stringify(data), now, date]);
    } else {
      // Insert new archive
      await db.run(`
        INSERT INTO daily_balance_archives (id, date, sales_total, expenses_total, cash_at_hand, net_balance, data_json, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [id, date, data.sales.total, data.expenses.total, data.balance.cashAtHand, data.netBalance, JSON.stringify(data), now]);
    }

    res.json({ success: true, id, date });
  } catch (error) {
    console.error('Error saving archive:', error);
    res.status(500).json({ error: 'Failed to save archive' });
  }
});

// DELETE /api/analytics/daily-balance/archive/:date - Delete an archive
router.delete('/daily-balance/archive/:date', async (req, res) => {
  try {
    const { date } = req.params;

    await db.run(`
      DELETE FROM daily_balance_archives WHERE date = $1
    `, [date]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting archive:', error);
    res.status(500).json({ error: 'Failed to delete archive' });
  }
});

export default router;
