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
    const operationsResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfMonth, endOfMonth);

    const operationsTotal = (operationsResult as any).total || 0;

    // Calculate retail sales from sales table
    const salesResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfMonth, endOfMonth);

    const salesTotal = (salesResult as any).total || 0;

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
    const operationsDaily = await db.prepare(`
      SELECT
        DATE(created_at) as date,
        SUM(total_amount) as total
      FROM operations
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(startOfMonth, endOfMonth);

    // Get daily breakdown from sales
    const salesDaily = await db.prepare(`
      SELECT
        DATE(created_at) as date,
        SUM(total_amount) as total
      FROM sales
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(startOfMonth, endOfMonth);

    // Merge daily totals
    const dailyMap = new Map<string, number>();

    operationsDaily.forEach((row: any) => {
      dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + row.total);
    });

    salesDaily.forEach((row: any) => {
      dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + row.total);
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
    const todayOpsResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfDay, endOfDay);

    // Today's sales total
    const todaySalesResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfDay, endOfDay);

    const todayTotal = (todayOpsResult as any).total + (todaySalesResult as any).total;

    // Monthly total
    const monthlyOpsResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfMonth, endOfMonth);

    const monthlySalesResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfMonth, endOfMonth);

    const monthlyTotal = (monthlyOpsResult as any).total + (monthlySalesResult as any).total;

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
    const staffUsers = await db.prepare(`
      SELECT id, name, email, role
      FROM users
      WHERE role IN ('staff', 'manager') AND status = 'active'
      ORDER BY name ASC
    `).all();

    // Get performance for each staff member
    const staffPerformance = await Promise.all(
      (staffUsers as any[]).map(async (staff) => {
        // Get their targets
        const targetData = await db.prepare(`
          SELECT daily_target, monthly_target
          FROM staff_targets
          WHERE user_id = ?
        `).get(staff.id);

        const dailyTarget = targetData?.daily_target || TARGETS.staffDaily;
        const monthlyTarget = targetData?.monthly_target || TARGETS.staffMonthly;

        // Calculate today's sales
        const todayOpsResult = await db.prepare(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM operations
          WHERE created_by = ? AND created_at >= ? AND created_at <= ?
        `).get(staff.id, startOfDay, endOfDay);

        const todaySalesResult = await db.prepare(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM sales
          WHERE created_by = ? AND created_at >= ? AND created_at <= ?
        `).get(staff.id, startOfDay, endOfDay);

        const todayTotal = (todayOpsResult as any)?.total || 0 + (todaySalesResult as any)?.total || 0;

        // Calculate monthly sales
        const monthlyOpsResult = await db.prepare(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM operations
          WHERE created_by = ? AND created_at >= ? AND created_at <= ?
        `).get(staff.id, startOfMonth, endOfMonth);

        const monthlySalesResult = await db.prepare(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM sales
          WHERE created_by = ? AND created_at >= ? AND created_at <= ?
        `).get(staff.id, startOfMonth, endOfMonth);

        const monthlyTotal = (monthlyOpsResult as any)?.total || 0 + (monthlySalesResult as any)?.total || 0;

        // Calculate metrics
        const todayPercentage = Math.min((todayTotal / dailyTarget) * 100, 100);
        const monthlyPercentage = Math.min((monthlyTotal / monthlyTarget) * 100, 100);

        const todayColor = getStaffDailyColor(todayTotal);
        const monthlyColor = getStaffMonthlyColor(monthlyTotal);

        const commissionTier = getCommissionTier(monthlyTotal);
        const estimatedCommission = monthlyTotal * commissionTier.rate;

        return {
          userId: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          targets: {
            daily: dailyTarget,
            monthly: monthlyTarget
          },
          todaySales: todayTotal,
          monthlySales: monthlyTotal,
          todayProgress: {
            percentage: Math.round(todayPercentage * 100) / 100,
            color: todayColor
          },
          monthlyProgress: {
            percentage: Math.round(monthlyPercentage * 100) / 100,
            color: monthlyColor
          },
          commission: {
            tier: commissionTier.tier,
            rate: commissionTier.rate,
            estimatedCommission: Math.round(estimatedCommission)
          }
        };
      })
    );

    res.json({
      period: {
        start: startOfMonth,
        end: endOfMonth,
        currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
        today: now.toLocaleDateString()
      },
      staff: staffPerformance
    });
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
    const staff = await db.prepare(`
      SELECT id, name, email, role
      FROM users
      WHERE id = ? AND status = 'active'
    `).get(userId);

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Get their targets
    const targetData = await db.prepare(`
      SELECT daily_target, monthly_target
      FROM staff_targets
      WHERE user_id = ?
    `).get(userId);

    const dailyTarget = targetData?.daily_target || TARGETS.staffDaily;
    const monthlyTarget = targetData?.monthly_target || TARGETS.staffMonthly;

    // Calculate today's sales
    const todayOpsResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_by = ? AND created_at >= ? AND created_at <= ?
    `).get(userId, startOfDay, endOfDay);

    const todaySalesResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_by = ? AND created_at >= ? AND created_at <= ?
    `).get(userId, startOfDay, endOfDay);

    const todayTotal = (todayOpsResult as any)?.total || 0 + (todaySalesResult as any)?.total || 0;

    // Calculate monthly sales
    const monthlyOpsResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_by = ? AND created_at >= ? AND created_at <= ?
    `).get(userId, startOfMonth, endOfMonth);

    const monthlySalesResult = await db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_by = ? AND created_at >= ? AND created_at <= ?
    `).get(userId, startOfMonth, endOfMonth);

    const monthlyTotal = (monthlyOpsResult as any)?.total || 0 + (monthlySalesResult as any)?.total || 0;

    // Get daily breakdown for the month
    const dailyBreakdown = await db.prepare(`
      SELECT DATE(created_at) as date,
             COALESCE(SUM(total_amount), 0) as total
      FROM (
        SELECT created_at, total_amount
        FROM operations
        WHERE created_by = ? AND created_at >= ? AND created_at <= ?
        UNION ALL
        SELECT created_at, total_amount
        FROM sales
        WHERE created_by = ? AND created_at >= ? AND created_at <= ?
      )
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(userId, startOfMonth, endOfMonth, userId, startOfMonth, endOfMonth);

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
    const staff = await db.prepare('SELECT id FROM users WHERE id = ?', [userId]).get(userId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const now = new Date().toISOString();

    // Check if targets exist
    const existingTargets = await db.prepare(
      'SELECT id FROM staff_targets WHERE user_id = ?',
      [userId]
    ).get();

    if (existingTargets) {
      // Update existing targets
      const updates: string[] = [];
      const values: any[] = [];

      if (daily_target !== undefined) {
        updates.push('daily_target = ?');
        values.push(daily_target);
      }

      if (monthly_target !== undefined) {
        updates.push('monthly_target = ?');
        values.push(monthly_target);
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(userId);

      await db.run(
        `UPDATE staff_targets SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );
    } else {
      // Create new targets
      await db.run(
        `INSERT INTO staff_targets (id, user_id, daily_target, monthly_target, effective_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`${userId}-targets`, userId, daily_target || TARGETS.staffDaily, monthly_target || TARGETS.staffMonthly, now, now, now]
      );
    }

    // Return updated targets
    const updatedTargets = await db.prepare(
      'SELECT daily_target, monthly_target FROM staff_targets WHERE user_id = ?',
      [userId]
    ).get(userId);

    res.json({
      success: true,
      targets: updatedTargets
    });
  } catch (error) {
    console.error('Error updating staff targets:', error);
    res.status(500).json({ error: 'Failed to update staff targets' });
  }
});

export default router;
