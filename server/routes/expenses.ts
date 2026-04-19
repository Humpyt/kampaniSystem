import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken } from './auth';

const router = express.Router();

// Expense categories
const EXPENSE_CATEGORIES = [
  'Supplies & Materials',
  'Rent & Utilities',
  'Salaries & Wages',
  'Marketing & Advertising',
  'Equipment & Maintenance',
  'Transportation',
  'Insurance',
  'Taxes & Fees',
  'Office Supplies',
  'Miscellaneous'
];

// Category colors for charts
const CATEGORY_COLORS: Record<string, string> = {
  'Supplies & Materials': '#6366f1',
  'Rent & Utilities': '#ec4899',
  'Salaries & Wages': '#f59e0b',
  'Marketing & Advertising': '#10b981',
  'Equipment & Maintenance': '#8b5cf6',
  'Transportation': '#3b82f6',
  'Insurance': '#ef4444',
  'Taxes & Fees': '#14b8a6',
  'Office Supplies': '#84cc16',
  'Miscellaneous': '#6b7280'
};

// Helper to get date boundaries
const getDateBoundaries = () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { now, startOfToday, endOfToday, startOfWeek, startOfMonth, endOfMonth };
};

// Transform expense from database to API format
const transformExpense = (expense: any) => ({
  id: expense.id,
  title: expense.title,
  category: expense.category,
  amount: expense.amount,
  date: expense.date,
  status: expense.status,
  paymentMethod: expense.payment_method,
  vendor: expense.vendor,
  notes: expense.notes,
  createdBy: expense.created_by,
  createdByName: expense.creator_name || 'Unknown',
  createdAt: expense.created_at,
  updatedAt: expense.updated_at
});

// GET /api/expenses - List all expenses with optional filters and pagination
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { category, status, startDate, endDate, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT e.*, u.name as creator_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM expenses e
      WHERE 1=1
    `;
    const params: any[] = [];
    const countParams: any[] = [];

    // Role-based filtering: staff can only see their own expenses
    if (req.user.role === 'staff') {
      query += ` AND e.created_by = $${params.length + 1}`;
      countQuery += ` AND e.created_by = $${countParams.length + 1}`;
      params.push(req.user.id);
      countParams.push(req.user.id);
    }

    if (category) {
      query += ` AND e.category = $${params.length + 1}`;
      countQuery += ` AND e.category = $${countParams.length + 1}`;
      params.push(category);
      countParams.push(category);
    }

    if (status) {
      query += ` AND e.status = $${params.length + 1}`;
      countQuery += ` AND e.status = $${countParams.length + 1}`;
      params.push(status);
      countParams.push(status);
    }

    if (startDate) {
      query += ` AND e.date >= $${params.length + 1}`;
      countQuery += ` AND e.date >= $${countParams.length + 1}`;
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      query += ` AND e.date <= $${params.length + 1}`;
      countQuery += ` AND e.date <= $${countParams.length + 1}`;
      params.push(endDate);
      countParams.push(endDate);
    }

    query += ` ORDER BY e.date DESC, e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const expenses = await db.all(query, params);
    const countResult = await db.get(countQuery, countParams);
    const total = (countResult as any).total;

    res.json({
      expenses: expenses.map(transformExpense),
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/expenses/categories - List all expense categories
router.get('/categories', authenticateToken, async (req: any, res: any) => {
  res.json(EXPENSE_CATEGORIES);
});

// GET /api/expenses/analytics - Get expense analytics for charts
router.get('/analytics', authenticateToken, async (req: any, res: any) => {
  try {
    const { startOfToday, endOfToday, startOfWeek, startOfMonth, endOfMonth } = getDateBoundaries();
    const isStaff = req.user.role === 'staff';
    const userId = req.user.id;

    // Total expenses this month
    const monthlyTotalResult = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date >= $1 AND date <= $2${isStaff ? ' AND created_by = $3' : ''}
    `, [startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0], ...(isStaff ? [userId] : [])]) as any;

    // Total expenses this week
    const weeklyTotalResult = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date >= $1${isStaff ? ' AND created_by = $2' : ''}
    `, [startOfWeek.toISOString().split('T')[0], ...(isStaff ? [userId] : [])]) as any;

    // Total expenses today
    const todayTotalResult = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date = $1${isStaff ? ' AND created_by = $2' : ''}
    `, [startOfToday.toISOString().split('T')[0], ...(isStaff ? [userId] : [])]) as any;

    // Category breakdown
    const categoryBreakdownResult = await db.all(`
      SELECT
        category,
        SUM(amount) as amount
      FROM expenses
      WHERE date >= $1 AND date <= $2${isStaff ? ' AND created_by = $3' : ''}
      GROUP BY category
      ORDER BY amount DESC
    `, [startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0], ...(isStaff ? [userId] : [])]) as any[];

    const totalByCategory = categoryBreakdownResult.reduce((sum, cat) => sum + cat.amount, 0);

    const categoryBreakdown = categoryBreakdownResult.map(cat => ({
      category: cat.category,
      amount: cat.amount,
      percentage: totalByCategory > 0 ? Math.round((cat.amount / totalByCategory) * 100 * 10) / 10 : 0,
      color: CATEGORY_COLORS[cat.category] || '#6b7280'
    }));

    // Weekly trends (last 7 days)
    const weeklyTrendsResult = await db.all(`
      SELECT
        EXTRACT(DOW FROM date) as dayNum,
        CASE EXTRACT(DOW FROM date)
          WHEN 0 THEN 'Sun'
          WHEN 1 THEN 'Mon'
          WHEN 2 THEN 'Tue'
          WHEN 3 THEN 'Wed'
          WHEN 4 THEN 'Thu'
          WHEN 5 THEN 'Fri'
          WHEN 6 THEN 'Sat'
        END as day,
        SUM(amount) as amount
      FROM expenses
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'${isStaff ? ' AND created_by = $1' : ''}
      GROUP BY EXTRACT(DOW FROM date), day
      ORDER BY dayNum ASC
    `, isStaff ? [userId] : []) as any[];

    // Fill in missing days with 0
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyTrends = dayOrder.map(day => {
      const found = weeklyTrendsResult.find(w => w.day === day);
      return { day, amount: found ? found.amount : 0 };
    });

    // Monthly trends (last 6 months)
    const monthlyTrendsResult = await db.all(`
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(amount) as amount
      FROM expenses
      WHERE date >= CURRENT_DATE - INTERVAL '6 months'${isStaff ? ' AND created_by = $1' : ''}
      GROUP BY month
      ORDER BY month ASC
    `, isStaff ? [userId] : []) as any[];

    // Recent expenses
    const recentExpenses = await db.all(`
      SELECT e.*, u.name as creator_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1${isStaff ? ' AND e.created_by = $1' : ''}
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT 5
    `, isStaff ? [userId] : []);

    // Status breakdown
    const statusBreakdownResult = await db.all(`
      SELECT
        status,
        COUNT(*) as count,
        SUM(amount) as amount
      FROM expenses
      WHERE 1=1${isStaff ? ' AND created_by = $1' : ''}
      GROUP BY status
    `, isStaff ? [userId] : []) as any[];

    const statusBreakdown = statusBreakdownResult.map(s => ({
      status: s.status,
      count: s.count,
      amount: s.amount
    }));

    // Payment method breakdown
    const paymentMethodResult = await db.all(`
      SELECT
        payment_method,
        SUM(amount) as amount,
        COUNT(*) as count
      FROM expenses
      WHERE payment_method IS NOT NULL${isStaff ? ' AND created_by = $1' : ''}
      GROUP BY payment_method
    `, isStaff ? [userId] : []) as any[];

    const paymentMethodBreakdown = paymentMethodResult.map(p => ({
      method: p.payment_method,
      amount: p.amount,
      count: p.count
    }));

    // Top categories for pie chart
    const topCategories = categoryBreakdown.slice(0, 5);

    res.json({
      totalThisMonth: monthlyTotalResult?.total || 0,
      totalThisWeek: weeklyTotalResult?.total || 0,
      totalToday: todayTotalResult?.total || 0,
      categoryBreakdown,
      weeklyTrends,
      monthlyTrends: monthlyTrendsResult,
      recentExpenses: recentExpenses.map(transformExpense),
      statusBreakdown,
      paymentMethodBreakdown,
      topCategories
    });
  } catch (error) {
    console.error('Error fetching expense analytics:', error);
    res.status(500).json({ error: 'Failed to fetch expense analytics' });
  }
});

// GET /api/expenses/:id - Get single expense
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const expense = await db.get(`
      SELECT e.*, u.name as creator_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `, [id]);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Staff can only view their own expenses
    if (req.user.role === 'staff' && expense.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(transformExpense(expense));
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// POST /api/expenses - Create new expense
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { title, category, amount, date, status, paymentMethod, vendor, notes } = req.body;

    if (!title || !category || !amount || !date) {
      return res.status(400).json({ error: 'Title, category, amount, and date are required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const createdBy = req.user.id; // Always use authenticated user's ID

    await db.run(`
      INSERT INTO expenses (id, title, category, amount, date, status, payment_method, vendor, notes, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      id,
      title,
      category,
      amount,
      date,
      status || 'pending',
      paymentMethod || null,
      vendor || null,
      notes || null,
      createdBy,
      now,
      now
    ]);

    const expense = await db.get(`
      SELECT e.*, u.name as creator_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `, [id]);
    res.status(201).json(transformExpense(expense));
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PATCH /api/expenses/:id - Update expense
router.patch('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, category, amount, date, status, paymentMethod, vendor, notes } = req.body;

    const existing = await db.get('SELECT * FROM expenses WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Staff can only update their own expenses
    if (req.user.role === 'staff' && (existing as any).created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const now = new Date().toISOString();

    await db.run(`
      UPDATE expenses SET
        title = COALESCE($1, title),
        category = COALESCE($2, category),
        amount = COALESCE($3, amount),
        date = COALESCE($4, date),
        status = COALESCE($5, status),
        payment_method = $6,
        vendor = $7,
        notes = $8,
        updated_at = $9
      WHERE id = $10
    `, [
      title || null,
      category || null,
      amount || null,
      date || null,
      status || null,
      paymentMethod !== undefined ? paymentMethod : (existing as any).payment_method,
      vendor !== undefined ? vendor : (existing as any).vendor,
      notes !== undefined ? notes : (existing as any).notes,
      now,
      id
    ]);

    const expense = await db.get(`
      SELECT e.*, u.name as creator_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `, [id]);
    res.json(transformExpense(expense));
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM expenses WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Staff can only delete their own expenses
    if (req.user.role === 'staff' && (existing as any).created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.run('DELETE FROM expenses WHERE id = $1', [id]);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
