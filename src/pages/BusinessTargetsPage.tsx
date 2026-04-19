import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Target, Users, Trophy, TrendingUp, DollarSign, Calendar, RefreshCw, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuthStore } from '../store/authStore';

interface BusinessSummary {
  period: { start: string; end: string; currentMonth: string };
  targets: { businessMonthly: number };
  current: { totalSales: number; operationsTotal: number; retailTotal: number };
  progress: { percentage: number; remaining: number; color: string };
}

interface StaffPerformance {
  period: { start: string; end: string; currentMonth: string; today: string };
  targets: { daily: number; monthly: number };
  dailyPerformance: { total: number; target: number; percentage: number; color: string; deficit: number | null; surplus: number | null };
  monthlyPerformance: { total: number; target: number; percentage: number; color: string; deficit: number | null; surplus: number | null };
  commission: { currentTier: number; rate: number; rateDisplay: string; estimatedCommission: number; progressToNextTier: number | null; nextTierThreshold: number | null };
}

interface DailyData {
  period: { start: string; end: string; currentMonth: string };
  dailyTarget: number;
  dailyBreakdown: Array<{ date: string; total: number; target: number; percentage: number; color: string; deficit: number | null; surplus: number | null }>;
  statistics: { totalDays: number; totalMonthlySales: number; averageDailySales: number; daysAtTarget: number; daysBelowTarget: number; percentageOfTarget: number };
}

interface StaffMemberPerformance {
  id: string; name: string; email: string;
  today_sales: number; monthly_sales: number;
  daily_target: number; monthly_target: number;
  daily_percentage: number; monthly_percentage: number;
  daily_color: string; monthly_color: string;
  commission_tier: number; estimated_commission: number;
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return 'text-emerald-400';
  if (percentage >= 50) return 'text-yellow-400';
  return 'text-red-400';
};

const getProgressBarColor = (percentage: number) => {
  if (percentage >= 80) return 'bg-emerald-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getTierBadge = (tier: number) => {
  if (tier === 3) return { bg: 'bg-yellow-900/50 text-yellow-400', border: 'border-yellow-600/30' };
  if (tier === 2) return { bg: 'bg-gray-700/50 text-gray-300', border: 'border-gray-500/30' };
  return { bg: 'bg-orange-900/50 text-orange-400', border: 'border-orange-600/30' };
};

const BusinessTargetsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [businessSummary, setBusinessSummary] = useState<BusinessSummary | null>(null);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance | null>(null);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [allStaffPerformance, setAllStaffPerformance] = useState<StaffMemberPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user?.role === 'admin' || user?.role === 'manager') {
        const [summaryRes, allStaffRes] = await Promise.all([
          fetch(API_ENDPOINTS['business/targets/summary']),
          fetch(API_ENDPOINTS['business/targets/staff/all'], { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } })
        ]);
        if (!summaryRes.ok || !allStaffRes.ok) throw new Error('Failed to fetch data');
        const [summary, allStaff] = await Promise.all([summaryRes.json(), allStaffRes.json()]);
        setBusinessSummary(summary);
        setAllStaffPerformance(allStaff);
      } else {
        const staffRes = await fetch(`${API_ENDPOINTS['business/targets/staff']}/${user?.id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } });
        if (!staffRes.ok) throw new Error('Failed to fetch performance data');
        const staff = await staffRes.json();
        const transformedStaff: StaffPerformance = { ...staff.staff, dailyPerformance: staff.todayPerformance, monthlyPerformance: staff.monthlyPerformance, commission: staff.commission, targets: staff.targets };
        const transformedDaily = { dailyBreakdown: staff.dailyBreakdown || [], statistics: { averageDailySales: staff.dailyBreakdown?.length > 0 ? staff.dailyBreakdown.reduce((sum: number, day: any) => sum + day.total, 0) / staff.dailyBreakdown.length : 0, daysAtTarget: staff.dailyBreakdown?.filter((day: any) => day.total >= staff.targets.daily).length || 0, totalDays: staff.dailyBreakdown?.length || 0, totalMonthlySales: staff.monthlyPerformance?.total || 0, percentageOfTarget: staff.monthlyPerformance?.percentage || 0 } };
        setStaffPerformance(transformedStaff);
        setDailyData(transformedDaily);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  useEffect(() => {
    const handleDropCompleted = () => fetchData();
    window.addEventListener('drop-completed', handleDropCompleted);
    return () => window.removeEventListener('drop-completed', handleDropCompleted);
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading performance data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg mb-2">Error loading data</p>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    </div>
  );

  // Admin/Manager View
  if (user?.role === 'admin' || user?.role === 'manager') {
    const percentage = businessSummary?.progress?.percentage || 0;

    return (
      <div className="min-h-screen bg-gray-900 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Business Targets</h1>
            <p className="text-gray-400 text-sm">{businessSummary?.period?.currentMonth || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* Monthly Target */}
          <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-xl p-4 border border-indigo-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-indigo-300 text-xs font-medium flex items-center gap-1">
                <Target size={12} />
                MONTHLY TARGET
              </span>
              <Target size={16} className="text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {formatCurrency(businessSummary?.targets?.businessMonthly || 0)}
            </p>
          </div>

          {/* Achieved */}
          <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl p-4 border border-emerald-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-300 text-xs font-medium flex items-center gap-1">
                <TrendingUp size={12} />
                ACHIEVED
              </span>
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {formatCurrency(businessSummary?.current?.totalSales || 0)}
            </p>
          </div>

          {/* Remaining / Progress */}
          <div className="bg-gradient-to-br from-rose-900/50 to-rose-800/30 rounded-xl p-4 border border-rose-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-rose-300 text-xs font-medium flex items-center gap-1">
                <Minus size={12} />
                REMAINING
              </span>
              <DollarSign size={16} className="text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {formatCurrency(businessSummary?.progress?.remaining || 0)}
            </p>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${getProgressColor(percentage)}`}>
                {percentage.toFixed(0)}%
              </span>
              <span className="text-rose-300/60 text-xs">of target</span>
            </div>
          </div>
        </div>

        {/* This Month Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Operations Revenue</p>
            <p className="text-lg font-bold text-indigo-400">{formatCurrency(businessSummary?.current?.operationsTotal || 0)}</p>
          </div>
          <div className="text-center border-x border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Retail Sales</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(businessSummary?.current?.retailTotal || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Progress</p>
            <p className={`text-lg font-bold ${getProgressColor(percentage)}`}>{percentage.toFixed(0)}%</p>
          </div>
        </div>

        {/* Staff Performance Table */}
        <div className="card-bevel overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Staff Performance</h2>
            </div>
            <span className="text-sm text-gray-400">{allStaffPerformance.length} members</span>
          </div>

          {allStaffPerformance.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={40} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No staff performance data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/80 backdrop-blur-sm sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Staff</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Tier</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Today</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Progress</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Month</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Progress</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {allStaffPerformance
                    .sort((a, b) => b.monthly_sales - a.monthly_sales)
                    .map((staff, idx) => {
                      const dailyPct = Math.min((staff.today_sales / staff.daily_target) * 100, 100);
                      const monthlyPct = Math.min((staff.monthly_sales / staff.monthly_target) * 100, 100);
                      const badge = getTierBadge(staff.commission_tier);
                      return (
                        <tr key={staff.id} className={`${idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                idx === 0 ? 'bg-yellow-500/20 text-yellow-400' : idx === 1 ? 'bg-gray-500/20 text-gray-400' : idx === 2 ? 'bg-orange-700/20 text-orange-400' : 'bg-gray-700/50 text-gray-400'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{staff.name}</p>
                                <p className="text-xs text-gray-500">{staff.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.border}`}>
                              Tier {staff.commission_tier}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-white">{formatCurrency(staff.today_sales)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full ${getProgressBarColor(dailyPct)}`} style={{ width: `${dailyPct}%` }} />
                              </div>
                              <span className={`text-xs font-medium ${getProgressColor(dailyPct)}`}>{dailyPct.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-white">{formatCurrency(staff.monthly_sales)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full ${getProgressBarColor(monthlyPct)}`} style={{ width: `${monthlyPct}%` }} />
                              </div>
                              <span className={`text-xs font-medium ${getProgressColor(monthlyPct)}`}>{monthlyPct.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-emerald-400">{formatCurrency(staff.estimated_commission)}</span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Staff View
  const dailyPerf = staffPerformance?.dailyPerformance || { total: 0, target: 1000000, percentage: 0 };
  const monthlyPerf = staffPerformance?.monthlyPerformance || { total: 0, target: 26000000, percentage: 0 };
  const commission = staffPerformance?.commission || { currentTier: 1, rateDisplay: '1%', estimatedCommission: 0 };
  const dailyStats = dailyData?.statistics || { averageDailySales: 0, daysAtTarget: 0, totalDays: 0 };
  const dailyBreakdown = dailyData?.dailyBreakdown || [];
  const tierBadge = getTierBadge(commission.currentTier);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Performance</h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <Calendar size={14} />
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Staff Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        {/* Today */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-xl p-4 border border-indigo-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-300 text-xs font-medium flex items-center gap-1">
              <TrendingUp size={12} />
              TODAY
            </span>
            <TrendingUp size={16} className="text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(dailyPerf.total)}
          </p>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${getProgressColor((dailyPerf.percentage ?? 0))}`}>
              {(dailyPerf.percentage ?? 0).toFixed(0)}%
            </span>
            <span className="text-indigo-300/60 text-xs">of target</span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full ${getProgressBarColor((dailyPerf.percentage ?? 0))}`} style={{ width: `${Math.min((dailyPerf.percentage ?? 0), 100)}%` }} />
          </div>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl p-4 border border-emerald-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-300 text-xs font-medium flex items-center gap-1">
              <Target size={12} />
              THIS MONTH
            </span>
            <Target size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(monthlyPerf.total)}
          </p>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${getProgressColor((monthlyPerf.percentage ?? 0))}`}>
              {(monthlyPerf.percentage ?? 0).toFixed(0)}%
            </span>
            <span className="text-emerald-300/60 text-xs">of target</span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full ${getProgressBarColor((monthlyPerf.percentage ?? 0))}`} style={{ width: `${Math.min((monthlyPerf.percentage ?? 0), 100)}%` }} />
          </div>
        </div>

        {/* Commission Tier */}
        <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 rounded-xl p-4 border border-amber-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-300 text-xs font-medium flex items-center gap-1">
              <Trophy size={12} />
              COMMISSION TIER
            </span>
            <Trophy size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            Tier {commission.currentTier}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-amber-300/60 text-xs">{commission.rateDisplay} rate</span>
          </div>
        </div>

        {/* Est. Earnings */}
        <div className="bg-gradient-to-br from-rose-900/50 to-rose-800/30 rounded-xl p-4 border border-rose-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-rose-300 text-xs font-medium flex items-center gap-1">
              <DollarSign size={12} />
              EST. EARNINGS
            </span>
            <DollarSign size={16} className="text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(commission.estimatedCommission)}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-rose-300/60 text-xs">this month</span>
          </div>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Daily Average</p>
          <p className="text-lg font-bold text-white">{formatCurrency(dailyStats.averageDailySales)}</p>
        </div>
        <div className="text-center border-x border-gray-700">
          <p className="text-gray-400 text-xs mb-1">Days on Target</p>
          <p className="text-lg font-bold text-emerald-400">{dailyStats.daysAtTarget} / {dailyStats.totalDays}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Daily Target</p>
          <p className="text-lg font-bold text-white">{formatCurrency(dailyPerf.target)}</p>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="card-bevel overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Daily Breakdown</h2>
        </div>
        {dailyBreakdown.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No daily data available yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/80 backdrop-blur-sm sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Sales</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Target</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Progress</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {dailyBreakdown.map((day, idx) => {
                  const pct = Math.min((day.total / day.target) * 100, 100);
                  return (
                    <tr key={idx} className={`${idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}>
                      <td className="px-4 py-3 text-sm text-white">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-white">{formatCurrency(day.total)}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-400">{formatCurrency(day.target)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full ${getProgressBarColor(pct)}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-xs font-medium ${getProgressColor(pct)}`}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pct >= 100 ? (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400">Hit</span>
                        ) : (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400">Missed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessTargetsPage;
