import express from 'express';
import db from '../database';

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

// GET /api/analytics/discounts - Returns discount analytics
router.get('/discounts', async (req, res) => {
  try {
    const { startOfMonth, endOfMonth } = getDateBoundaries();

    // Get summary statistics
    const summaryResult = await db.prepare(`
      SELECT
        COUNT(*) as totalOperations,
        COALESCE(SUM(discount), 0) as totalDiscounts,
        COALESCE(AVG(CASE WHEN discount > 0 THEN (discount / NULLIF(total_amount, 0)) * 100 ELSE 0 END), 0) as averageDiscountPercent,
        COUNT(CASE WHEN discount > 0 THEN 1 END) as operationsWithDiscount
      FROM operations
      WHERE discount > 0
    `).get() as any;

    const totalOperationsWithDiscount = summaryResult.operationsWithDiscount || 0;
    const totalDiscounts = summaryResult.totalDiscounts || 0;
    const averageDiscountPercent = summaryResult.averageDiscountPercent || 0;

    // Get discounts by period (last 30 days)
    const byPeriodResult = await db.prepare(`
      SELECT
        DATE(created_at) as date,
        SUM(discount) as total,
        COUNT(*) as count
      FROM operations
      WHERE discount > 0
        AND created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all() as any[];

    const byPeriod = byPeriodResult.map(row => ({
      date: row.date,
      total: row.total,
      count: row.count
    }));

    // Get top discounted operations
    const topDiscountedResult = await db.prepare(`
      SELECT
        o.id,
        c.name as customerName,
        o.total_amount,
        o.discount,
        o.created_at as date
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.discount > 0
      ORDER BY o.discount DESC
      LIMIT 10
    `).all() as any[];

    const topDiscounted = topDiscountedResult.map(row => ({
      id: row.id,
      customerName: row.customerName || 'Unknown',
      totalAmount: row.total_amount,
      discount: row.discount,
      date: row.date
    }));

    res.json({
      summary: {
        totalDiscounts,
        averageDiscountPercent: Math.round(averageDiscountPercent * 100) / 100,
        operationsWithDiscount: totalOperationsWithDiscount
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
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total FROM customers
    `).get() as any;

    const thisMonthResult = await db.prepare(`
      SELECT COUNT(*) as count FROM customers
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfMonth, endOfMonth) as any;

    const thisWeekResult = await db.prepare(`
      SELECT COUNT(*) as count FROM customers
      WHERE created_at >= ?
    `).get(startOfWeek) as any;

    const todayResult = await db.prepare(`
      SELECT COUNT(*) as count FROM customers
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfToday, endOfToday) as any;

    // Get trend (daily new customers for last 30 days)
    const trendResult = await db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM customers
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all() as any[];

    const trend = trendResult.map(row => ({
      date: row.date,
      count: row.count
    }));

    // Get recent customers
    const recentCustomersResult = await db.prepare(`
      SELECT
        id,
        name,
        phone,
        created_at as createdAt,
        total_orders
      FROM customers
      ORDER BY created_at DESC
      LIMIT 10
    `).all() as any[];

    const recentCustomers = recentCustomersResult.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      createdAt: row.createdAt,
      totalOrders: row.total_orders
    }));

    res.json({
      summary: {
        total: totalResult.total || 0,
        thisMonth: thisMonthResult?.count || 0,
        thisWeek: thisWeekResult?.count || 0,
        today: todayResult?.count || 0
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
    const bySpentResult = await db.prepare(`
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
    `).all() as any[];

    const bySpent = bySpentResult.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      totalSpent: row.totalSpent || 0,
      orderCount: row.orderCount || 0,
      lastVisit: row.lastVisit
    }));

    // Get all customers ordered by order count
    const byOrdersResult = await db.prepare(`
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
    `).all() as any[];

    const byOrders = byOrdersResult.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      totalSpent: row.totalSpent || 0,
      orderCount: row.orderCount || 0,
      lastVisit: row.lastVisit
    }));

    // Get all customers ordered by loyalty points
    const byLoyaltyResult = await db.prepare(`
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
    `).all() as any[];

    const byLoyalty = byLoyaltyResult.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      loyaltyPoints: row.loyaltyPoints || 0,
      totalSpent: row.totalSpent || 0
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
    const byRevenueResult = await db.prepare(`
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
    `).all() as any[];

    const byRevenue = byRevenueResult.map(row => ({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      category: row.category || 'Uncategorized',
      totalRevenue: row.totalRevenue || 0,
      orderCount: row.orderCount || 0
    }));

    // Get service performance by order count
    const byOrdersResult = await db.prepare(`
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
    `).all() as any[];

    const byOrders = byOrdersResult.map(row => ({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      category: row.category || 'Uncategorized',
      totalRevenue: row.totalRevenue || 0,
      orderCount: row.orderCount || 0
    }));

    // Get category breakdown
    const categoryBreakdownResult = await db.prepare(`
      SELECT
        COALESCE(s.category, 'Uncategorized') as category,
        COALESCE(SUM(os.price * os.quantity), 0) as totalRevenue,
        COUNT(DISTINCT os.operation_shoe_id) as orderCount
      FROM services s
      LEFT JOIN operation_services os ON s.id = os.service_id
      GROUP BY s.category
      ORDER BY totalRevenue DESC
    `).all() as any[];

    const categoryBreakdown = categoryBreakdownResult.map(row => ({
      category: row.category || 'Uncategorized',
      totalRevenue: row.totalRevenue || 0,
      orderCount: row.orderCount || 0
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
    const summaryResult = await db.prepare(`
      SELECT
        COALESCE(SUM(total_amount - paid_amount), 0) as totalUnpaid,
        COUNT(CASE WHEN (total_amount - paid_amount) > 0 THEN 1 END) as partialPaymentCount,
        COUNT(CASE WHEN (total_amount - paid_amount) = total_amount
                   AND created_at < DATE('now', '-30 days') THEN 1 END) as overdueCount
      FROM operations
      WHERE total_amount > paid_amount
    `).get() as any;

    // Get aging analysis
    const agingResult = await db.prepare(`
      SELECT
        COUNT(CASE WHEN created_at >= DATE('now', '-30 days') THEN 1 END) as currentCount,
        COALESCE(SUM(CASE WHEN created_at >= DATE('now', '-30 days')
                          THEN total_amount - paid_amount ELSE 0 END), 0) as currentBalance,
        COUNT(CASE WHEN created_at >= DATE('now', '-60 days')
                   AND created_at < DATE('now', '-30 days') THEN 1 END) as aging30Count,
        COALESCE(SUM(CASE WHEN created_at >= DATE('now', '-60 days')
                          AND created_at < DATE('now', '-30 days')
                          THEN total_amount - paid_amount ELSE 0 END), 0) as aging30Balance,
        COUNT(CASE WHEN created_at >= DATE('now', '-90 days')
                   AND created_at < DATE('now', '-60 days') THEN 1 END) as aging60Count,
        COALESCE(SUM(CASE WHEN created_at >= DATE('now', '-90 days')
                          AND created_at < DATE('now', '-60 days')
                          THEN total_amount - paid_amount ELSE 0 END), 0) as aging60Balance,
        COUNT(CASE WHEN created_at < DATE('now', '-90 days') THEN 1 END) as overdueCount,
        COALESCE(SUM(CASE WHEN created_at < DATE('now', '-90 days')
                          THEN total_amount - paid_amount ELSE 0 END), 0) as overdueBalance
      FROM operations
      WHERE total_amount > paid_amount
    `).get() as any;

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
    const unpaidOperationsResult = await db.prepare(`
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
    `).all() as any[];

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
router.get('/profit-summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total sales (all time)
    const totalSalesResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM operations
    `).get() as any;

    // Total expenses (all time)
    const totalExpensesResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expenses
    `).get() as any;

    // Sales this month
    const salesThisMonthResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= ?
    `).get(startOfMonth.toISOString()) as any;

    // Sales last month
    const salesLastMonthResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfLastMonth.toISOString(), endOfLastMonth.toISOString()) as any;

    // Expenses this month
    const expensesThisMonthResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date >= ?
    `).get(startOfMonth.toISOString().split('T')[0]) as any;

    // Expenses last month
    const expensesLastMonthResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date >= ? AND date <= ?
    `).get(startOfLastMonth.toISOString().split('T')[0], endOfLastMonth.toISOString().split('T')[0]) as any;

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
    const monthlyBreakdownResult = await db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        SUM(total_amount) as sales
      FROM operations
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all() as any[];

    const monthlyExpenseResult = await db.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        SUM(amount) as expenses
      FROM expenses
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all() as any[];

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

// GET /api/analytics/daily-balance - Returns daily balance sheet with sales/expenses breakdown by payment method
router.get('/daily-balance', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const startOfDay = `${targetDate} 00:00:00`;
    const endOfDay = `${targetDate} 23:59:59`;

    // Get sales breakdown by payment method from operation_payments
    // Use date() function for proper date comparison (created_at is ISO format)
    const salesResult = await db.prepare(`
      SELECT
        COALESCE(op.payment_method, 'Cash') as paymentMethod,
        COALESCE(SUM(op.amount), 0) as total
      FROM operation_payments op
      WHERE date(op.created_at) = date(?)
      GROUP BY op.payment_method
    `).all(targetDate) as any[];

    // Get expenses breakdown by payment method
    const expensesResult = await db.prepare(`
      SELECT
        COALESCE(payment_method, 'Cash') as paymentMethod,
        COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date = ?
      GROUP BY payment_method
    `).all(targetDate) as any[];

    // Get expense details with staff names
    const expenseDetailsResult = await db.prepare(`
      SELECT e.*, u.name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.date = ?
      ORDER BY e.created_at DESC
    `).all(targetDate) as any[];

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

    // Build sales by method map
    const salesByMethod: Record<string, number> = {
      'Cash': 0,
      'Mobile Money': 0,
      'Credit Card': 0,
      'Bank Transfer': 0,
      'Cheque': 0
    };
    for (const s of salesResult) {
      salesByMethod[s.paymentMethod] = s.total;
    }

    // Build expenses by method map
    const expensesByMethod: Record<string, number> = {
      'Cash': 0,
      'Mobile Money': 0,
      'Credit Card': 0,
      'Bank Transfer': 0,
      'Cheque': 0
    };
    for (const e of expensesResult) {
      expensesByMethod[e.paymentMethod] = e.total;
    }

    // Calculate totals
    const totalSales = Object.values(salesByMethod).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(expensesByMethod).reduce((a, b) => a + b, 0);
    const cashAtHand = salesByMethod['Cash'] - expensesByMethod['Cash'];
    const mobileMoneyBalance = salesByMethod['Mobile Money'] - expensesByMethod['Mobile Money'];
    const cardBalance = salesByMethod['Credit Card'] - expensesByMethod['Credit Card'];
    const bankTransferBalance = salesByMethod['Bank Transfer'] - expensesByMethod['Bank Transfer'];
    const chequeBalance = salesByMethod['Cheque'] - expensesByMethod['Cheque'];

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
    const archives = await db.prepare(`
      SELECT id, date, sales_total, expenses_total, cash_at_hand, net_balance, created_at
      FROM daily_balance_archives
      ORDER BY date DESC
      LIMIT 50
    `).all() as any[];

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
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const archives = await db.prepare(`
      SELECT id, date, sales_total, expenses_total, cash_at_hand, net_balance
      FROM daily_balance_archives
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `).all(startDate, endDate) as any[];

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

    const archive = await db.prepare(`
      SELECT * FROM daily_balance_archives WHERE date = ?
    `).get(date) as any;

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
    const existing = await db.prepare(`
      SELECT id FROM daily_balance_archives WHERE date = ?
    `).get(date) as any;

    const id = existing?.id || `archive_${date}_${Date.now()}`;
    const now = new Date().toISOString();

    if (existing) {
      // Update existing archive
      await db.prepare(`
        UPDATE daily_balance_archives
        SET sales_total = ?, expenses_total = ?, cash_at_hand = ?, net_balance = ?, data_json = ?, created_at = ?
        WHERE date = ?
      `).run(data.sales.total, data.expenses.total, data.balance.cashAtHand, data.netBalance, JSON.stringify(data), now, date);
    } else {
      // Insert new archive
      await db.prepare(`
        INSERT INTO daily_balance_archives (id, date, sales_total, expenses_total, cash_at_hand, net_balance, data_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, date, data.sales.total, data.expenses.total, data.balance.cashAtHand, data.netBalance, JSON.stringify(data), now);
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

    await db.prepare(`
      DELETE FROM daily_balance_archives WHERE date = ?
    `).run(date);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting archive:', error);
    res.status(500).json({ error: 'Failed to delete archive' });
  }
});

export default router;
