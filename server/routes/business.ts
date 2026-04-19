import express from 'express';
import db from '../database';

const router = express.Router();

// Business targets configuration
const TARGETS = {
  businessMonthly: 104000000, // 104M UGX
  staffMonthly: 26000000, // 26M UGX
  staffDaily: 1000000, // 1M UGX
};

// Color coding thresholds for business monthly (0-104M)
const getBusinessColor = (amount: number) => {
  if (amount < 30000000) return 'red'; // 0-30M
  if (amount < 80000000) return 'orange'; // 30-80M
  return 'green'; // 80-104M
};

// Color coding for staff daily (0-1M)
const getStaffDailyColor = (amount: number) => {
  if (amount < 300000) return 'red'; // 0-300k
  if (amount < 800000) return 'orange'; // 300k-800k
  return 'green'; // 800k-1M
};

// Color coding for staff monthly (0-26M)
const getStaffMonthlyColor = (amount: number) => {
  if (amount < 10000000) return 'red'; // 0-10M
  if (amount < 20000000) return 'orange'; // 10-20M
  return 'green'; // 20-26M
};

// Commission tier calculation
const getCommissionTier = (monthlySales: number) => {
  if (monthlySales < 10000000) return { rate: 0.01, tier: 1, min: 0, max: 10000000 };
  if (monthlySales < 20000000) return { rate: 0.02, tier: 2, min: 10000000, max: 20000000 };
  return { rate: 0.03, tier: 3, min: 20000000, max: 26000000 };
};

// Get business targets summary for current month
router.get('/targets/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Calculate total sales from operations (repairs) for current month
    const operationsResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= $1 AND created_at <= $2
    `, [startOfMonth, endOfMonth]);

    const operationsTotal = Number((operationsResult as any).total) || 0;

    // Calculate retail sales from sales table
    const salesResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_at >= $1 AND created_at <= $2
    `, [startOfMonth, endOfMonth]);

    const salesTotal = Number((salesResult as any).total) || 0;

    const totalSales = operationsTotal + salesTotal;
    const percentage = Math.min((totalSales / TARGETS.businessMonthly) * 100, 100);
    const color = getBusinessColor(totalSales);

    res.json({
      period: {
        start: startOfMonth,
        end: endOfMonth,
        currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' })
      },
      targets: {
        businessMonthly: TARGETS.businessMonthly
      },
      current: {
        totalSales,
        operationsTotal,
        retailTotal: salesTotal
      },
      progress: {
        percentage: Math.round(percentage * 100) / 100,
        remaining: Math.max(TARGETS.businessMonthly - totalSales, 0),
        color
      }
    });
  } catch (error) {
    console.error('Error fetching business targets summary:', error);
    res.status(500).json({ error: 'Failed to fetch business targets summary' });
  }
});

// Get daily sales breakdown for current month
router.get('/targets/daily', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Get daily breakdown from operations
    const operationsDaily = await db.all(`
      SELECT
        DATE(created_at) as date,
        SUM(total_amount) as total
      FROM operations
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [startOfMonth, endOfMonth]);

    // Get daily breakdown from sales
    const salesDaily = await db.all(`
      SELECT
        DATE(created_at) as date,
        SUM(total_amount) as total
      FROM sales
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [startOfMonth, endOfMonth]);

    // Merge daily totals
    const dailyMap = new Map<string, number>();

    operationsDaily.forEach((row: any) => {
      dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + Number(row.total));
    });

    salesDaily.forEach((row: any) => {
      dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + Number(row.total));
    });

    // Convert to array and add performance metrics
    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, total]) => {
      const percentage = Math.min((total / TARGETS.staffDaily) * 100, 100);
      const color = getStaffDailyColor(total);
      const deficit = Math.max(TARGETS.staffDaily - total, 0);
      const surplus = Math.max(total - TARGETS.staffDaily, 0);

      return {
        date,
        total,
        target: TARGETS.staffDaily,
        percentage: Math.round(percentage * 100) / 100,
        color,
        deficit: deficit > 0 ? deficit : null,
        surplus: surplus > 0 ? surplus : null
      };
    });

    // Calculate statistics
    const totalDays = dailyBreakdown.length;
    const totalMonthlySales = dailyBreakdown.reduce((sum, day) => sum + day.total, 0);
    const averageDailySales = totalDays > 0 ? totalMonthlySales / totalDays : 0;
    const daysAtTarget = dailyBreakdown.filter(day => day.total >= TARGETS.staffDaily).length;
    const daysBelowTarget = totalDays - daysAtTarget;

    res.json({
      period: {
        start: startOfMonth,
        end: endOfMonth,
        currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' })
      },
      dailyTarget: TARGETS.staffDaily,
      dailyBreakdown,
      statistics: {
        totalDays,
        totalMonthlySales: Math.round(totalMonthlySales),
        averageDailySales: Math.round(averageDailySales),
        daysAtTarget,
        daysBelowTarget,
        percentageOfTarget: Math.round((averageDailySales / TARGETS.staffDaily) * 10000) / 100
      }
    });
  } catch (error) {
    console.error('Error fetching daily targets:', error);
    res.status(500).json({ error: 'Failed to fetch daily targets' });
  }
});

// Get staff performance for current month
router.get('/targets/staff', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Get today's sales
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    // Today's operations total
    const todayOpsResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= $1 AND created_at <= $2
    `, [startOfDay, endOfDay]);

    // Today's sales total
    const todaySalesResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_at >= $1 AND created_at <= $2
    `, [startOfDay, endOfDay]);

    const todayTotal = Number((todayOpsResult as any).total) + Number((todaySalesResult as any).total);

    // Monthly total
    const monthlyOpsResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= $1 AND created_at <= $2
    `, [startOfMonth, endOfMonth]);

    const monthlySalesResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_at >= $1 AND created_at <= $2
    `, [startOfMonth, endOfMonth]);

    const monthlyTotal = Number((monthlyOpsResult as any).total) + Number((monthlySalesResult as any).total);

    // Calculate performance metrics
    const todayPercentage = Math.min((todayTotal / TARGETS.staffDaily) * 100, 100);
    const monthlyPercentage = Math.min((monthlyTotal / TARGETS.staffMonthly) * 100, 100);

    const todayColor = getStaffDailyColor(todayTotal);
    const monthlyColor = getStaffMonthlyColor(monthlyTotal);

    const todayDeficit = Math.max(TARGETS.staffDaily - todayTotal, 0);
    const todaySurplus = Math.max(todayTotal - TARGETS.staffDaily, 0);

    const monthlyDeficit = Math.max(TARGETS.staffMonthly - monthlyTotal, 0);
    const monthlySurplus = Math.max(monthlyTotal - TARGETS.staffMonthly, 0);

    // Commission calculation
    const commissionTier = getCommissionTier(monthlyTotal);
    const estimatedCommission = monthlyTotal * commissionTier.rate;
    const progressToNextTier = commissionTier.tier < 3
      ? commissionTier.max - monthlyTotal
      : 0;

    res.json({
      period: {
        start: startOfMonth,
        end: endOfMonth,
        currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
        today: now.toLocaleDateString()
      },
      targets: {
        daily: TARGETS.staffDaily,
        monthly: TARGETS.staffMonthly
      },
      dailyPerformance: {
        total: todayTotal,
        target: TARGETS.staffDaily,
        percentage: Math.round(todayPercentage * 100) / 100,
        color: todayColor,
        deficit: todayDeficit > 0 ? todayDeficit : null,
        surplus: todaySurplus > 0 ? todaySurplus : null
      },
      monthlyPerformance: {
        total: monthlyTotal,
        target: TARGETS.staffMonthly,
        percentage: Math.round(monthlyPercentage * 100) / 100,
        color: monthlyColor,
        deficit: monthlyDeficit > 0 ? monthlyDeficit : null,
        surplus: monthlySurplus > 0 ? monthlySurplus : null
      },
      commission: {
        currentTier: commissionTier.tier,
        rate: commissionTier.rate,
        rateDisplay: `${Math.round(commissionTier.rate * 100)}%`,
        estimatedCommission: Math.round(estimatedCommission),
        progressToNextTier: progressToNextTier > 0 ? progressToNextTier : null,
        nextTierThreshold: commissionTier.tier < 3 ? commissionTier.max : null
      }
    });
  } catch (error) {
    console.error('Error fetching staff targets:', error);
    res.status(500).json({ error: 'Failed to fetch staff targets' });
  }
});

// Get all staff performance (admin/manager view)
router.get('/targets/staff/all', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    // Get all staff users
    const staffUsers = await db.all(`
      SELECT id, name, email, role
      FROM users
      WHERE role IN ('staff', 'manager') AND status = 'active'
      ORDER BY name ASC
    `);

    // Get performance for each staff member
    const staffPerformance = await Promise.all(
      (staffUsers as any[]).map(async (staff) => {
        // Get their targets
        const targetData = await db.get(`
          SELECT daily_target, monthly_target
          FROM staff_targets
          WHERE user_id = $1
        `, [staff.id]);

        const dailyTarget = targetData?.daily_target || TARGETS.staffDaily;
        const monthlyTarget = targetData?.monthly_target || TARGETS.staffMonthly;

        // Calculate today's sales
        const todayOpsResult = await db.get(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM operations
          WHERE created_by = $1 AND created_at >= $2 AND created_at <= $3
        `, [staff.id, startOfDay, endOfDay]);

        const todaySalesResult = await db.get(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM sales
          WHERE created_by = $1 AND created_at >= $2 AND created_at <= $3
        `, [staff.id, startOfDay, endOfDay]);

        const todayTotal = Number((todayOpsResult as any)?.total || 0) + Number((todaySalesResult as any)?.total || 0);

        // Calculate monthly sales
        const monthlyOpsResult = await db.get(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM operations
          WHERE created_by = $1 AND created_at >= $2 AND created_at <= $3
        `, [staff.id, startOfMonth, endOfMonth]);

        const monthlySalesResult = await db.get(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM sales
          WHERE created_by = $1 AND created_at >= $2 AND created_at <= $3
        `, [staff.id, startOfMonth, endOfMonth]);

        const monthlyTotal = Number((monthlyOpsResult as any)?.total || 0) + Number((monthlySalesResult as any)?.total || 0);

        // Calculate metrics
        const todayPercentage = Math.min((todayTotal / dailyTarget) * 100, 100);
        const monthlyPercentage = Math.min((monthlyTotal / monthlyTarget) * 100, 100);

        const todayColor = getStaffDailyColor(todayTotal);
        const monthlyColor = getStaffMonthlyColor(monthlyTotal);

        const commissionTier = getCommissionTier(monthlyTotal);
        const estimatedCommission = monthlyTotal * commissionTier.rate;

        return {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          daily_target: dailyTarget,
          monthly_target: monthlyTarget,
          today_sales: todayTotal,
          monthly_sales: monthlyTotal,
          daily_percentage: Math.round(todayPercentage * 100) / 100,
          daily_color: todayColor,
          monthly_percentage: Math.round(monthlyPercentage * 100) / 100,
          monthly_color: monthlyColor,
          commission_tier: commissionTier.tier,
          commission_rate: commissionTier.rate,
          estimated_commission: Math.round(estimatedCommission)
        };
      })
    );

    res.json(staffPerformance);
  } catch (error) {
    console.error('Error fetching all staff performance:', error);
    res.status(500).json({ error: 'Failed to fetch staff performance' });
  }
});

// Get individual staff performance
router.get('/targets/staff/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    // Get staff user
    const staff = await db.get(`
      SELECT id, name, email, role
      FROM users
      WHERE id = $1 AND status = 'active'
    `, [userId]);

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Get their targets
    const targetData = await db.get(`
      SELECT daily_target, monthly_target
      FROM staff_targets
      WHERE user_id = $1
    `, [userId]);

    const dailyTarget = targetData?.daily_target || TARGETS.staffDaily;
    const monthlyTarget = targetData?.monthly_target || TARGETS.staffMonthly;

    // Calculate today's sales
    const todayOpsResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_by = $1 AND created_at >= $2 AND created_at <= $3
    `, [userId, startOfDay, endOfDay]);

    const todaySalesResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_by = $1 AND created_at >= $2 AND created_at <= $3
    `, [userId, startOfDay, endOfDay]);

    const todayTotal = Number((todayOpsResult as any)?.total || 0) + Number((todaySalesResult as any)?.total || 0);

    // Calculate monthly sales
    const monthlyOpsResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_by = $1 AND created_at >= $2 AND created_at <= $3
    `, [userId, startOfMonth, endOfMonth]);

    const monthlySalesResult = await db.get(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_by = $1 AND created_at >= $2 AND created_at <= $3
    `, [userId, startOfMonth, endOfMonth]);

    const monthlyTotal = Number((monthlyOpsResult as any)?.total || 0) + Number((monthlySalesResult as any)?.total || 0);

    // Get daily breakdown for the month
    const dailyBreakdown = await db.all(`
      SELECT DATE(created_at) as date,
             COALESCE(SUM(total_amount), 0) as total
      FROM (
        SELECT created_at, total_amount
        FROM operations
        WHERE created_by = $1 AND created_at >= $2 AND created_at <= $3
        UNION ALL
        SELECT created_at, total_amount
        FROM sales
        WHERE created_by = $4 AND created_at >= $5 AND created_at <= $6
      )
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [userId, startOfMonth, endOfMonth, userId, startOfMonth, endOfMonth]);

    // Calculate metrics
    const todayPercentage = Math.min((todayTotal / dailyTarget) * 100, 100);
    const monthlyPercentage = Math.min((monthlyTotal / monthlyTarget) * 100, 100);

    const todayColor = getStaffDailyColor(todayTotal);
    const monthlyColor = getStaffMonthlyColor(monthlyTotal);

    const todayDeficit = Math.max(dailyTarget - todayTotal, 0);
    const todaySurplus = Math.max(todayTotal - dailyTarget, 0);

    const monthlyDeficit = Math.max(monthlyTarget - monthlyTotal, 0);
    const monthlySurplus = Math.max(monthlyTotal - monthlyTarget, 0);

    // Commission calculation
    const commissionTier = getCommissionTier(monthlyTotal);
    const estimatedCommission = monthlyTotal * commissionTier.rate;
    const progressToNextTier = commissionTier.tier < 3
      ? commissionTier.max - monthlyTotal
      : 0;

    // Enhanced daily breakdown with color coding
    const dailyData = (dailyBreakdown as any[]).map(day => {
      const dayTotal = day.total;
      const dayPercentage = Math.min((dayTotal / dailyTarget) * 100, 100);
      const dayColor = getStaffDailyColor(dayTotal);

      return {
        date: day.date,
        total: dayTotal,
        target: dailyTarget,
        percentage: Math.round(dayPercentage * 100) / 100,
        color: dayColor,
        deficit: Math.max(dailyTarget - dayTotal, 0),
        surplus: Math.max(dayTotal - dailyTarget, 0)
      };
    });

    res.json({
      period: {
        start: startOfMonth,
        end: endOfMonth,
        currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
        today: now.toLocaleDateString()
      },
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role
      },
      targets: {
        daily: dailyTarget,
        monthly: monthlyTarget
      },
      todayPerformance: {
        total: todayTotal,
        target: dailyTarget,
        percentage: Math.round(todayPercentage * 100) / 100,
        color: todayColor,
        deficit: todayDeficit > 0 ? todayDeficit : null,
        surplus: todaySurplus > 0 ? todaySurplus : null
      },
      monthlyPerformance: {
        total: monthlyTotal,
        target: monthlyTarget,
        percentage: Math.round(monthlyPercentage * 100) / 100,
        color: monthlyColor,
        deficit: monthlyDeficit > 0 ? monthlyDeficit : null,
        surplus: monthlySurplus > 0 ? monthlySurplus : null
      },
      commission: {
        currentTier: commissionTier.tier,
        rate: commissionTier.rate,
        rateDisplay: `${Math.round(commissionTier.rate * 100)}%`,
        estimatedCommission: Math.round(estimatedCommission),
        progressToNextTier: progressToNextTier > 0 ? progressToNextTier : null,
        nextTierThreshold: commissionTier.tier < 3 ? commissionTier.max : null
      },
      dailyBreakdown: dailyData
    });
  } catch (error) {
    console.error('Error fetching staff performance:', error);
    res.status(500).json({ error: 'Failed to fetch staff performance' });
  }
});

// Update staff targets (admin only)
router.put('/targets/staff/:userId/targets', async (req, res) => {
  try {
    const { userId } = req.params;
    const { daily_target, monthly_target } = req.body;

    // Validate inputs
    if (daily_target !== undefined && (isNaN(daily_target) || daily_target < 0)) {
      return res.status(400).json({ error: 'Invalid daily target' });
    }

    if (monthly_target !== undefined && (isNaN(monthly_target) || monthly_target < 0)) {
      return res.status(400).json({ error: 'Invalid monthly target' });
    }

    // Check if staff exists
    const staff = await db.get('SELECT id FROM users WHERE id = $1', [userId]);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const now = new Date().toISOString();

    // Check if targets exist
    const existingTargets = await db.get(
      'SELECT id FROM staff_targets WHERE user_id = $1',
      [userId]
    );

    if (existingTargets) {
      // Update existing targets
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (daily_target !== undefined) {
        updates.push(`daily_target = $${paramIndex++}`);
        values.push(daily_target);
      }

      if (monthly_target !== undefined) {
        updates.push(`monthly_target = $${paramIndex++}`);
        values.push(monthly_target);
      }

      updates.push(`updated_at = $${paramIndex++}`);
      values.push(now);
      values.push(userId);

      await db.run(
        `UPDATE staff_targets SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
        values
      );
    } else {
      // Create new targets
      await db.run(
        `INSERT INTO staff_targets (id, user_id, daily_target, monthly_target, effective_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [`${userId}-targets`, userId, daily_target || TARGETS.staffDaily, monthly_target || TARGETS.staffMonthly, now, now, now]
      );
    }

    // Return updated targets
    const updatedTargets = await db.get(
      'SELECT daily_target, monthly_target FROM staff_targets WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      targets: updatedTargets
    });
  } catch (error) {
    console.error('Error updating staff targets:', error);
    res.status(500).json({ error: 'Failed to update staff targets' });
  }
});

// ==================== COMMISSION ARCHIVE ENDPOINTS ====================

// Get commission archives
router.get('/commissions/archives', async (req, res) => {
  try {
    const { year, month, status, userId, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT ca.*, u.name as user_name, u.email as user_email
      FROM commission_archives ca
      LEFT JOIN users u ON ca.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (year) {
      query += ` AND ca.year = $${params.length + 1}`;
      params.push(Number(year));
    }
    if (month) {
      query += ` AND ca.month = $${params.length + 1}`;
      params.push(Number(month));
    }
    if (status) {
      query += ` AND ca.status = $${params.length + 1}`;
      params.push(status);
    }
    if (userId) {
      query += ` AND ca.user_id = $${params.length + 1}`;
      params.push(userId);
    }

    query += ` ORDER BY ca.year DESC, ca.month DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const archives = await db.all(query, params);

    // Get totals
    let totalsQuery = `
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(commission_amount), 0) as total_commissions,
        COALESCE(SUM(total_sales), 0) as total_sales,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM commission_archives ca
      WHERE 1=1
    `;
    const totalsParams: any[] = [];
    if (year) {
      totalsQuery += ` AND ca.year = $${totalsParams.length + 1}`;
      totalsParams.push(Number(year));
    }
    if (month) {
      totalsQuery += ` AND ca.month = $${totalsParams.length + 1}`;
      totalsParams.push(Number(month));
    }
    if (status) {
      totalsQuery += ` AND ca.status = $${totalsParams.length + 1}`;
      totalsParams.push(status);
    }
    if (userId) {
      totalsQuery += ` AND ca.user_id = $${totalsParams.length + 1}`;
      totalsParams.push(userId);
    }

    const totals = await db.get(totalsQuery, totalsParams);

    res.json({
      archives,
      totals,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error fetching commission archives:', error);
    res.status(500).json({ error: 'Failed to fetch commission archives' });
  }
});

// Get commission by staff (for bar chart)
router.get('/commissions/by-staff', async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const targetYear = year ? Number(year) : now.getFullYear();
    const targetMonth = month ? Number(month) : now.getMonth() + 1;

    // First try to get from archives
    let archives = await db.all(`
      SELECT ca.*, u.name as user_name
      FROM commission_archives ca
      LEFT JOIN users u ON ca.user_id = u.id
      WHERE ca.year = $1 AND ca.month = $2
      ORDER BY ca.commission_amount DESC
    `, [targetYear, targetMonth]);

    // If no archives, calculate from operations
    if (archives.length === 0) {
      const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
      const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;

      const staffSales = await db.all(`
        SELECT
          u.id as user_id,
          u.name as user_name,
          COALESCE(SUM(o.total_amount), 0) as total_sales
        FROM users u
        LEFT JOIN operations o ON u.id = o.created_by
          AND o.created_at >= $1 AND o.created_at <= $2
          AND o.status = 'completed'
        WHERE u.role IN ('staff', 'manager')
        GROUP BY u.id, u.name
        HAVING total_sales > 0
        ORDER BY total_sales DESC
      `, [startDate, endDate]);

      archives = staffSales.map((staff: any) => {
        const tier = getCommissionTier(staff.total_sales);
        return {
          user_id: staff.user_id,
          user_name: staff.user_name,
          total_sales: staff.total_sales,
          commission_rate: tier.rate,
          commission_amount: staff.total_sales * tier.rate,
          year: targetYear,
          month: targetMonth
        };
      });
    }

    res.json({ staff: archives });
  } catch (error) {
    console.error('Error fetching commission by staff:', error);
    res.status(500).json({ error: 'Failed to fetch commission by staff' });
  }
});

// Get commission trends (for line chart)
router.get('/commissions/trends', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();

    const trends = [];
    for (let i = Number(months) - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      const archives = await db.get(`
        SELECT
          COALESCE(SUM(commission_amount), 0) as total_commissions,
          COUNT(*) as staff_count
        FROM commission_archives
        WHERE year = $1 AND month = $2
      `, [year, month]) as any;

      const topPerformer = await db.get(`
        SELECT ca.*, u.name as user_name
        FROM commission_archives ca
        LEFT JOIN users u ON ca.user_id = u.id
        WHERE ca.year = $1 AND ca.month = $2
        ORDER BY ca.commission_amount DESC
        LIMIT 1
      `, [year, month]) as any;

      trends.push({
        month: `${year}-${String(month).padStart(2, '0')}`,
        year,
        monthNum: month,
        totalCommissions: archives.total_commissions,
        staffCount: archives.staff_count,
        topPerformer: topPerformer ? {
          userId: topPerformer.user_id,
          userName: topPerformer.user_name,
          commissionAmount: topPerformer.commission_amount
        } : null
      });
    }

    const avgMonthly = trends.reduce((sum, t) => sum + t.totalCommissions, 0) / trends.length;

    res.json({ trends, averageMonthlyCommission: avgMonthly });
  } catch (error) {
    console.error('Error fetching commission trends:', error);
    res.status(500).json({ error: 'Failed to fetch commission trends' });
  }
});

// Archive previous month's commissions
router.post('/commissions/archive', async (req, res) => {
  try {
    const { year: providedYear, month: providedMonth } = req.body;
    const now = new Date();

    // Default to previous month
    let targetYear = providedYear;
    let targetMonth = providedMonth;

    if (!targetYear || !targetMonth) {
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      targetYear = prevMonth.getFullYear();
      targetMonth = prevMonth.getMonth() + 1;
    }

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;

    // Get or create admin user for created_by
    const adminUser = await db.get(`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1
    `) as any;
    const createdBy = adminUser?.id || null;

    // Calculate commissions for each staff member
    const staffCommissions = await db.all(`
      SELECT
        u.id as user_id,
        u.name as user_name,
        COALESCE(SUM(o.total_amount), 0) as total_sales
      FROM users u
      LEFT JOIN operations o ON u.id = o.created_by
        AND o.created_at >= $1 AND o.created_at <= $2
        AND o.status = 'completed'
      WHERE u.role IN ('staff', 'manager')
      GROUP BY u.id, u.name
    `, [startDate, endDate]);

    const archives = [];
    for (const staff of staffCommissions) {
      if (staff.total_sales <= 0) continue;

      const tier = getCommissionTier(staff.total_sales);
      const commissionAmount = staff.total_sales * tier.rate;
      const archiveId = `ca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check if already exists
      const existing = await db.get(`
        SELECT id FROM commission_archives WHERE user_id = $1 AND year = $2 AND month = $3
      `, [staff.user_id, targetYear, targetMonth]);

      if (existing) {
        // Update existing
        await db.run(`
          UPDATE commission_archives
          SET total_sales = $1, commission_rate = $2, commission_amount = $3, archived_at = CURRENT_TIMESTAMP
          WHERE user_id = $4 AND year = $5 AND month = $6
        `, [staff.total_sales, tier.rate, commissionAmount, staff.user_id, targetYear, targetMonth]);
      } else {
        // Insert new
        await db.run(`
          INSERT INTO commission_archives (id, user_id, year, month, total_sales, commission_rate, commission_amount, status, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
        `, [archiveId, staff.user_id, targetYear, targetMonth, staff.total_sales, tier.rate, commissionAmount, createdBy]);
      }

      archives.push({
        userId: staff.user_id,
        userName: staff.user_name,
        totalSales: staff.total_sales,
        commissionRate: tier.rate,
        commissionAmount
      });
    }

    res.json({
      success: true,
      archivedCount: archives.length,
      year: targetYear,
      month: targetMonth,
      archives
    });
  } catch (error) {
    console.error('Error archiving commissions:', error);
    res.status(500).json({ error: 'Failed to archive commissions' });
  }
});

// Mark commission as paid
router.patch('/commissions/:id/mark-paid', async (req, res) => {
  try {
    const { id } = req.params;

    const archive = await db.get(`
      SELECT * FROM commission_archives WHERE id = $1
    `, [id]);

    if (!archive) {
      return res.status(404).json({ error: 'Commission archive not found' });
    }

    await db.run(`
      UPDATE commission_archives
      SET status = 'paid', paid_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    const updated = await db.get(`
      SELECT ca.*, u.name as user_name
      FROM commission_archives ca
      LEFT JOIN users u ON ca.user_id = u.id
      WHERE ca.id = $1
    `, [id]);

    res.json({ success: true, archive: updated });
  } catch (error) {
    console.error('Error marking commission as paid:', error);
    res.status(500).json({ error: 'Failed to mark commission as paid' });
  }
});

export default router;
