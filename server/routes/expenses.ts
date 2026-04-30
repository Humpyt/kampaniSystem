import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken } from './auth';

const router = express.Router();

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

const getDateBoundaries = () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { now, startOfToday, endOfToday, startOfWeek, startOfMonth, endOfMonth };
};

interface ExpenseLineItemInput {
  id?: string;
  title?: string;
  category?: string;
  amount?: number;
  notes?: string;
}

const normalizeAmount = (value: unknown): number => {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : NaN;
};

const normalizeLineItems = (
  lineItems: ExpenseLineItemInput[] | undefined,
  fallback?: { title?: string; category?: string; amount?: number; notes?: string }
) => {
  const sourceItems = Array.isArray(lineItems) && lineItems.length > 0
    ? lineItems
    : fallback
      ? [fallback]
      : [];

  return sourceItems.map((item, index) => ({
    id: item.id,
    title: (item.title || '').trim(),
    category: item.category || '',
    amount: normalizeAmount(item.amount),
    notes: item.notes?.trim() || null,
    sortOrder: index
  }));
};

const validateLineItems = (lineItems: ReturnType<typeof normalizeLineItems>) => {
  if (lineItems.length === 0) {
    return 'At least one expense item is required';
  }

  for (const item of lineItems) {
    if (!item.title) {
      return 'Each expense item must have a title';
    }
    if (!item.category) {
      return 'Each expense item must have a category';
    }
    if (!Number.isFinite(item.amount) || item.amount <= 0) {
      return 'Each expense item amount must be a positive number';
    }
  }

  return null;
};

const mapExpenseItems = (rows: any[]) => {
  const expenseMap = new Map<string, any>();

  for (const row of rows) {
    let expense = expenseMap.get(row.id);
    if (!expense) {
      expense = {
        id: row.id,
        title: row.title,
        category: row.category,
        amount: Number(row.amount),
        date: row.date,
        status: row.status,
        paymentMethod: row.payment_method,
        vendor: row.vendor,
        notes: row.notes,
        createdBy: row.created_by,
        createdByName: row.creator_name || 'Unknown',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lineItems: []
      };
      expenseMap.set(row.id, expense);
    }

    if (row.line_item_id) {
      expense.lineItems.push({
        id: row.line_item_id,
        expenseId: row.id,
        title: row.line_item_title,
        category: row.line_item_category,
        amount: Number(row.line_item_amount),
        notes: row.line_item_notes,
        sortOrder: row.line_item_sort_order ?? expense.lineItems.length,
        createdAt: row.line_item_created_at,
        updatedAt: row.line_item_updated_at
      });
    }
  }

  return Array.from(expenseMap.values()).map((expense) => {
    expense.lineItems.sort((a: any, b: any) => a.sortOrder - b.sortOrder);

    if (expense.lineItems.length === 0) {
      expense.lineItems = [
        {
          id: `${expense.id}-legacy`,
          expenseId: expense.id,
          title: expense.title,
          category: expense.category,
          amount: Number(expense.amount),
          notes: expense.notes || null,
          sortOrder: 0,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt
        }
      ];
    }

    return {
      ...expense,
      isItemized: expense.lineItems.length > 0,
      lineItemCount: expense.lineItems.length
    };
  });
};

const fetchExpensesByQuery = async (query: string, params: any[]) => {
  const rows = await db.prepare(query).all(...params);
  return mapExpenseItems(rows);
};

const expenseSelect = `
  SELECT
    e.*,
    u.name as creator_name,
    ei.id as line_item_id,
    ei.title as line_item_title,
    ei.category as line_item_category,
    ei.amount as line_item_amount,
    ei.notes as line_item_notes,
    ei.sort_order as line_item_sort_order,
    ei.created_at as line_item_created_at,
    ei.updated_at as line_item_updated_at
  FROM expenses e
  LEFT JOIN users u ON e.created_by = u.id
  LEFT JOIN expense_items ei ON e.id = ei.expense_id
`;

router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { category, status, startDate, endDate, limit = 20, offset = 0 } = req.query;

    let query = `${expenseSelect} WHERE 1=1`;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM expenses e
      WHERE 1=1
    `;
    const params: any[] = [];
    const countParams: any[] = [];

    if (req.user.role === 'staff') {
      query += ' AND e.created_by = ?';
      countQuery += ' AND e.created_by = ?';
      params.push(req.user.id);
      countParams.push(req.user.id);
    }

    if (category) {
      query += ' AND (e.category = ? OR EXISTS (SELECT 1 FROM expense_items ei_filter WHERE ei_filter.expense_id = e.id AND ei_filter.category = ?))';
      countQuery += ' AND (e.category = ? OR EXISTS (SELECT 1 FROM expense_items ei_filter WHERE ei_filter.expense_id = e.id AND ei_filter.category = ?))';
      params.push(category, category);
      countParams.push(category, category);
    }

    if (status) {
      query += ' AND e.status = ?';
      countQuery += ' AND e.status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (startDate) {
      query += ' AND e.date >= ?';
      countQuery += ' AND e.date >= ?';
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      query += ' AND e.date <= ?';
      countQuery += ' AND e.date <= ?';
      params.push(endDate);
      countParams.push(endDate);
    }

    query += ' ORDER BY e.date DESC, e.created_at DESC, ei.sort_order ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const expenses = await fetchExpensesByQuery(query, params);
    const countResult = await db.prepare(countQuery).get(...countParams);
    const total = Number((countResult as any)?.total || 0);

    res.json({
      expenses,
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.get('/categories', authenticateToken, async (_req: any, res: any) => {
  res.json(EXPENSE_CATEGORIES);
});

router.get('/analytics', authenticateToken, async (req: any, res: any) => {
  try {
    const { startOfToday, startOfWeek, startOfMonth, endOfMonth } = getDateBoundaries();
    const isStaff = req.user.role === 'staff';
    const userId = req.user.id;
    const staffWhere = isStaff ? ' AND e.created_by = ?' : '';
    const staffParams = isStaff ? [userId] : [];

    const monthlyTotalResult = await db.prepare(`
      SELECT COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      WHERE e.date >= ? AND e.date <= ?${staffWhere}
    `).get(startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0], ...staffParams) as any;

    const weeklyTotalResult = await db.prepare(`
      SELECT COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      WHERE e.date >= ?${staffWhere}
    `).get(startOfWeek.toISOString().split('T')[0], ...staffParams) as any;

    const todayTotalResult = await db.prepare(`
      SELECT COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      WHERE e.date = ?${staffWhere}
    `).get(startOfToday.toISOString().split('T')[0], ...staffParams) as any;

    const categoryBreakdownResult = await db.prepare(`
      SELECT
        categorized.category,
        SUM(categorized.amount) as amount
      FROM (
        SELECT
          e.id,
          COALESCE(ei.category, e.category) as category,
          COALESCE(ei.amount, e.amount) as amount
        FROM expenses e
        LEFT JOIN expense_items ei ON ei.expense_id = e.id
        WHERE e.date >= ? AND e.date <= ?${staffWhere}
      ) categorized
      GROUP BY categorized.category
      ORDER BY amount DESC
    `).all(startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0], ...staffParams) as any[];

    const totalByCategory = categoryBreakdownResult.reduce((sum, cat) => sum + Number(cat.amount), 0);
    const categoryBreakdown = categoryBreakdownResult.map((cat) => ({
      category: cat.category,
      amount: Number(cat.amount),
      percentage: totalByCategory > 0 ? Math.round((Number(cat.amount) / totalByCategory) * 1000) / 10 : 0,
      color: CATEGORY_COLORS[cat.category] || '#6b7280'
    }));

    const weeklyTrendsResult = await db.prepare(`
      SELECT
        EXTRACT(DOW FROM e.date)::int as dayNum,
        CASE EXTRACT(DOW FROM e.date)::int
          WHEN 0 THEN 'Sun'
          WHEN 1 THEN 'Mon'
          WHEN 2 THEN 'Tue'
          WHEN 3 THEN 'Wed'
          WHEN 4 THEN 'Thu'
          WHEN 5 THEN 'Fri'
          WHEN 6 THEN 'Sat'
        END as day,
        SUM(e.amount) as amount
      FROM expenses e
      WHERE e.date >= CURRENT_DATE - INTERVAL '7 days'${staffWhere}
      GROUP BY EXTRACT(DOW FROM e.date)
      ORDER BY dayNum ASC
    `).all(...staffParams) as any[];

    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyTrends = dayOrder.map((day) => {
      const found = weeklyTrendsResult.find((w) => w.day === day);
      return { day, amount: found ? Number(found.amount) : 0 };
    });

    const monthlyTrendsResult = await db.prepare(`
      SELECT
        TO_CHAR(e.date, 'YYYY-MM') as month,
        SUM(e.amount) as amount
      FROM expenses e
      WHERE e.date >= CURRENT_DATE - INTERVAL '6 months'${staffWhere}
      GROUP BY month
      ORDER BY month ASC
    `).all(...staffParams) as any[];

    const recentExpenses = await fetchExpensesByQuery(
      `${expenseSelect} WHERE 1=1${staffWhere} ORDER BY e.date DESC, e.created_at DESC, ei.sort_order ASC LIMIT 50`,
      staffParams
    );

    const statusBreakdownResult = await db.prepare(`
      SELECT
        e.status,
        COUNT(*) as count,
        SUM(e.amount) as amount
      FROM expenses e
      WHERE 1=1${staffWhere}
      GROUP BY e.status
    `).all(...staffParams) as any[];

    const paymentMethodResult = await db.prepare(`
      SELECT
        e.payment_method,
        SUM(e.amount) as amount,
        COUNT(*) as count
      FROM expenses e
      WHERE e.payment_method IS NOT NULL${staffWhere}
      GROUP BY e.payment_method
    `).all(...staffParams) as any[];

    res.json({
      totalThisMonth: Number(monthlyTotalResult?.total || 0),
      totalThisWeek: Number(weeklyTotalResult?.total || 0),
      totalToday: Number(todayTotalResult?.total || 0),
      categoryBreakdown,
      weeklyTrends,
      monthlyTrends: monthlyTrendsResult.map((row) => ({
        month: row.month,
        amount: Number(row.amount)
      })),
      recentExpenses: recentExpenses.slice(0, 5),
      statusBreakdown: statusBreakdownResult.map((s) => ({
        status: s.status,
        count: Number(s.count),
        amount: Number(s.amount)
      })),
      paymentMethodBreakdown: paymentMethodResult.map((p) => ({
        method: p.payment_method,
        amount: Number(p.amount),
        count: Number(p.count)
      })),
      topCategories: categoryBreakdown.slice(0, 5)
    });
  } catch (error) {
    console.error('Error fetching expense analytics:', error);
    res.status(500).json({ error: 'Failed to fetch expense analytics' });
  }
});

router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const expense = await db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any;

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (req.user.role === 'staff' && expense.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const expenses = await fetchExpensesByQuery(
      `${expenseSelect} WHERE e.id = ? ORDER BY ei.sort_order ASC`,
      [id]
    );

    res.json(expenses[0]);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { title, date, status, paymentMethod, vendor, notes, lineItems, category, amount } = req.body;

    if (!title?.trim() || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const normalizedLineItems = normalizeLineItems(lineItems, { title, category, amount, notes });
    const validationError = validateLineItems(normalizedLineItems);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const expenseId = uuidv4();
    const now = new Date().toISOString();
    const createdBy = req.user.id;
    const totalAmount = normalizedLineItems.reduce((sum, item) => sum + item.amount, 0);
    const primaryCategory = normalizedLineItems[0].category;

    await db.withTransaction(async (tx: any) => {
      await tx.prepare(`
        INSERT INTO expenses (id, title, category, amount, date, status, payment_method, vendor, notes, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        expenseId,
        title.trim(),
        primaryCategory,
        totalAmount,
        date,
        status || 'pending',
        paymentMethod || null,
        vendor?.trim() || null,
        notes?.trim() || null,
        createdBy,
        now,
        now
      );

      for (const item of normalizedLineItems) {
        await tx.prepare(`
          INSERT INTO expense_items (id, expense_id, title, category, amount, notes, sort_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          expenseId,
          item.title,
          item.category,
          item.amount,
          item.notes,
          item.sortOrder,
          now,
          now
        );
      }
    });

    const expenses = await fetchExpensesByQuery(
      `${expenseSelect} WHERE e.id = ? ORDER BY ei.sort_order ASC`,
      [expenseId]
    );
    res.status(201).json(expenses[0]);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.patch('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, date, status, paymentMethod, vendor, notes, lineItems, category, amount } = req.body;

    const existing = await db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (req.user.role === 'staff' && existing.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const existingItems = await db.prepare(`
      SELECT id, title, category, amount, notes
      FROM expense_items
      WHERE expense_id = ?
      ORDER BY sort_order ASC, created_at ASC
    `).all(id) as any[];

    const normalizedLineItems = normalizeLineItems(
      Array.isArray(lineItems) ? lineItems : undefined,
      existingItems.length > 0
        ? undefined
        : { title: existing.title, category: category ?? existing.category, amount: amount ?? existing.amount, notes: existing.notes }
    );

    if (Array.isArray(lineItems)) {
      const validationError = validateLineItems(normalizedLineItems);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }
    }

    const effectiveLineItems = Array.isArray(lineItems)
      ? normalizedLineItems
      : existingItems.length > 0
        ? normalizeLineItems(existingItems)
        : normalizeLineItems(undefined, {
            title: existing.title,
            category: category ?? existing.category,
            amount: amount ?? existing.amount,
            notes: existing.notes
          });

    const validationError = validateLineItems(effectiveLineItems);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const now = new Date().toISOString();
    const nextTitle = title !== undefined ? title.trim() : existing.title;
    const nextDate = date ?? existing.date;
    const nextStatus = status ?? existing.status;
    const nextPaymentMethod = paymentMethod !== undefined ? paymentMethod || null : existing.payment_method;
    const nextVendor = vendor !== undefined ? vendor?.trim() || null : existing.vendor;
    const nextNotes = notes !== undefined ? notes?.trim() || null : existing.notes;
    const totalAmount = effectiveLineItems.reduce((sum, item) => sum + item.amount, 0);
    const primaryCategory = effectiveLineItems[0].category;

    await db.withTransaction(async (tx: any) => {
      await tx.prepare(`
        UPDATE expenses SET
          title = ?,
          category = ?,
          amount = ?,
          date = ?,
          status = ?,
          payment_method = ?,
          vendor = ?,
          notes = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        nextTitle,
        primaryCategory,
        totalAmount,
        nextDate,
        nextStatus,
        nextPaymentMethod,
        nextVendor,
        nextNotes,
        now,
        id
      );

      if (Array.isArray(lineItems) || existingItems.length > 0) {
        await tx.prepare('DELETE FROM expense_items WHERE expense_id = ?').run(id);

        for (const item of effectiveLineItems) {
          await tx.prepare(`
            INSERT INTO expense_items (id, expense_id, title, category, amount, notes, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            id,
            item.title,
            item.category,
            item.amount,
            item.notes,
            item.sortOrder,
            now,
            now
          );
        }
      }
    });

    const expenses = await fetchExpensesByQuery(
      `${expenseSelect} WHERE e.id = ? ORDER BY ei.sort_order ASC`,
      [id]
    );
    res.json(expenses[0]);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const existing = await db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any;

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (req.user.role === 'staff' && existing.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
