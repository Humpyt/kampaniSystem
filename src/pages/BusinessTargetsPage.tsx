import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, Activity, Users, Trophy, Award, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuthStore } from '../store/authStore';

interface BusinessSummary {
  period: {
    start: string;
    end: string;
    currentMonth: string;
  };
  targets: {
    businessMonthly: number;
  };
  current: {
    totalSales: number;
    operationsTotal: number;
    retailTotal: number;
  };
  progress: {
    percentage: number;
    remaining: number;
    color: string;
  };
}

interface StaffPerformance {
  period: {
    start: string;
    end: string;
    currentMonth: string;
    today: string;
  };
  targets: {
    daily: number;
    monthly: number;
  };
  dailyPerformance: {
    total: number;
    target: number;
    percentage: number;
    color: string;
    deficit: number | null;
    surplus: number | null;
  };
  monthlyPerformance: {
    total: number;
    target: number;
    percentage: number;
    color: string;
    deficit: number | null;
    surplus: number | null;
  };
  commission: {
    currentTier: number;
    rate: number;
    rateDisplay: string;
    estimatedCommission: number;
    progressToNextTier: number | null;
    nextTierThreshold: number | null;
  };
}

interface DailyData {
  period: {
    start: string;
    end: string;
    currentMonth: string;
  };
  dailyTarget: number;
  dailyBreakdown: Array<{
    date: string;
    total: number;
    target: number;
    percentage: number;
    color: string;
    deficit: number | null;
    surplus: number | null;
  }>;
  statistics: {
    totalDays: number;
    totalMonthlySales: number;
    averageDailySales: number;
    daysAtTarget: number;
    daysBelowTarget: number;
    percentageOfTarget: number;
  };
}

interface StaffMemberPerformance {
  id: string;
  name: string;
  email: string;
  today_sales: number;
  monthly_sales: number;
  daily_target: number;
  monthly_target: number;
  daily_percentage: number;
  monthly_percentage: number;
  daily_color: string;
  monthly_color: string;
  commission_tier: number;
  estimated_commission: number;
}

// Staff Performance Dashboard Component
const StaffPerformanceDashboard: React.FC<{
  staffPerformance: StaffPerformance;
  dailyData: DailyData;
}> = ({ staffPerformance, dailyData }) => {
  // Add comprehensive safety checks
  if (!staffPerformance || !dailyData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading performance data...</div>
      </div>
    );
  }

  // Add safety checks for nested properties
  const dailyPerf = staffPerformance.dailyPerformance || { color: 'red', percentage: 0, total: 0, target: 1000000, deficit: 1000000, surplus: null };
  const monthlyPerf = staffPerformance.monthlyPerformance || { color: 'red', percentage: 0, total: 0, target: 26000000, deficit: 26000000, surplus: null };
  const commission = staffPerformance.commission || { currentTier: 1, rateDisplay: '1%', estimatedCommission: 0, nextTierThreshold: null, progressToNextTier: null };
  const dailyStats = dailyData?.statistics || { averageDailySales: 0, daysAtTarget: 0, totalDays: 0, totalMonthlySales: 0, percentageOfTarget: 0 };
  const dailyBreakdown = dailyData?.dailyBreakdown || [];

  const dailyColors = getColorClasses(dailyPerf.color);
  const monthlyColors = getColorClasses(monthlyPerf.color);

  const getMotivationalMessage = () => {
    const monthlyPercentage = monthlyPerf.percentage;
    const dailyPercentage = dailyPerf.percentage;

    if (monthlyPercentage >= 100 && dailyPercentage >= 100) {
      return {
        message: "🔥 Outstanding! You're crushing both daily and monthly targets!",
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-300'
      };
    } else if (monthlyPercentage >= 80) {
      return {
        message: "💪 Great progress! You're on track to meet your monthly target!",
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-300'
      };
    } else if (dailyPercentage >= 100) {
      return {
        message: "⭐ Excellent work today! Keep the momentum going!",
        bgColor: 'bg-purple-500/20',
        textColor: 'text-purple-300'
      };
    } else if (monthlyPercentage >= 50) {
      return {
        message: "📈 Making steady progress. Push through to reach your goals!",
        bgColor: 'bg-yellow-500/20',
        textColor: 'text-yellow-300'
      };
    } else {
      return {
        message: "🚀 Let's accelerate! Every sale counts towards your success!",
        bgColor: 'bg-orange-500/20',
        textColor: 'text-orange-300'
      };
    }
  };

  const motivationalContent = getMotivationalMessage();

  return (
    <div className="space-y-6">
      {/* Motivational Banner */}
      <div className={`p-4 rounded-lg border-2 ${motivationalContent.bgColor} border-current`}>
        <div className="flex items-center gap-3">
          <Zap className={`w-6 h-6 ${motivationalContent.textColor}`} />
          <p className={`text-lg font-semibold ${motivationalContent.textColor}`}>
            {motivationalContent.message}
          </p>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Circular Monthly Progress */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 card-bevel flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Progress</h3>
          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-gray-700"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - Math.min(staffPerformance?.monthlyPerformance?.percentage || 0, 100) / 100)}`}
                className={monthlyColors.text}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {monthlyPerf.percentage.toFixed(0)}%
              </span>
              <span className="text-xs text-gray-400">
                {formatCurrency(monthlyPerf.total)}
              </span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">Target: {formatCurrency(monthlyPerf.target)}</p>
            <p className={`text-sm font-semibold ${monthlyColors.text}`}>
              {monthlyPerf.deficit !== null
                ? `Need: ${formatCurrency(monthlyPerf.deficit)} more`
                : monthlyPerf.surplus !== null
                ? `Surplus: ${formatCurrency(monthlyPerf.surplus)}`
                : 'On track!'
              }
            </p>
          </div>
        </div>

        {/* Daily Progress Card */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 card-bevel">
          <div className="flex items-center gap-2 mb-4">
            <Target className={dailyColors.text} size={24} />
            <h3 className="text-lg font-semibold text-white">Today's Target</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Today's Sales</p>
              <p className={`text-3xl font-bold ${dailyColors.text}`}>
                {formatCurrency(dailyPerf.total)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Target</span>
                <span className="text-white">{formatCurrency(dailyPerf.target)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${dailyColors.bg}`}
                  style={{ width: `${Math.min(dailyPerf.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className={`font-bold ${dailyColors.text}`}>
                  {dailyPerf.percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {dailyPerf.deficit !== null && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500">
                <div className="flex items-center gap-2 text-red-400">
                  <TrendingDown size={16} />
                  <span className="text-sm font-medium">
                    Need: {formatCurrency(dailyPerf.deficit)} more
                  </span>
                </div>
              </div>
            )}

            {dailyPerf.surplus !== null && (
              <div className="p-3 rounded-lg bg-green-500/20 border border-green-500">
                <div className="flex items-center gap-2 text-green-400">
                  <TrendingUp size={16} />
                  <span className="text-sm font-medium">
                    Exceeded by: {formatCurrency(dailyPerf.surplus)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Commission Calculator */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 card-bevel">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-yellow-400" size={24} />
            <h3 className="text-lg font-semibold text-white">Commission</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Current Tier</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-white">Tier {commission.currentTier}</p>
                <Award className="text-yellow-400" size={32} />
              </div>
              <p className={`text-lg font-semibold ${monthlyColors.text} mt-2`}>
                {commission.rateDisplay}
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Estimated Earnings</p>
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(commission.estimatedCommission)}
              </p>
            </div>

            {commission.nextTierThreshold && (
              <div className="p-3 rounded-lg bg-indigo-500/20 border border-indigo-500">
                <p className="text-sm text-indigo-300">
                  {formatCurrency(commission.progressToNextTier)} to Tier {commission.currentTier + 1}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 card-bevel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={24} />
            My Daily Breakdown
          </h2>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">Avg Daily</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(dailyStats.averageDailySales)}
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">Days at Target</p>
            <p className="text-lg font-bold text-green-400">
              {dailyStats.daysAtTarget} / {dailyStats.totalDays}
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">Total Sales</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(dailyStats.totalMonthlySales)}
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">% of Target</p>
            <p className={`text-lg font-bold ${
              dailyStats.percentageOfTarget >= 100 ? 'text-green-400' :
              dailyStats.percentageOfTarget >= 80 ? 'text-orange-400' :
              'text-red-400'
            }`}>
              {dailyStats.percentageOfTarget.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Daily Progress Bars */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {dailyBreakdown.map((day, index) => {
            const colors = getColorClasses(day.color);
            const date = new Date(day.date);
            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <div key={index} className="flex items-center gap-3">
                <span className="w-16 text-sm text-gray-400 text-right">{formattedDate}</span>
                <div className="flex-1 bg-gray-700 rounded-full h-5 relative">
                  <div
                    className={`h-5 rounded-full transition-all ${colors.bg} flex items-center justify-end pr-2`}
                    style={{ width: `${Math.min(day.percentage, 100)}%` }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {formatCurrency(day.total)}
                    </span>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${colors.bg}`} title={day.color.toUpperCase()} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const getColorClasses = (color: string) => {
  switch (color) {
    case 'red':
      return {
        bg: 'bg-red-500',
        bgLight: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500',
      };
    case 'orange':
      return {
        bg: 'bg-orange-500',
        bgLight: 'bg-orange-500/20',
        text: 'text-orange-400',
        border: 'border-orange-500',
      };
    case 'green':
      return {
        bg: 'bg-green-500',
        bgLight: 'bg-green-500/20',
        text: 'text-green-400',
        border: 'border-green-500',
      };
    default:
      return {
        bg: 'bg-gray-500',
        bgLight: 'bg-gray-500/20',
        text: 'text-gray-400',
        border: 'border-gray-500',
      };
  }
};

const BusinessTargetsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [businessSummary, setBusinessSummary] = useState<BusinessSummary | null>(null);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance | null>(null);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [allStaffPerformance, setAllStaffPerformance] = useState<StaffMemberPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data based on user role
        if (user?.role === 'admin' || user?.role === 'manager') {
          // Admin/Manager: Fetch business summary, all staff performance, and personal daily data
          const [summaryRes, allStaffRes] = await Promise.all([
            fetch('http://localhost:3000/api/business/targets/summary'),
            fetch('http://localhost:3000/api/business/targets/staff/all', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            })
          ]);

          if (!summaryRes.ok || !allStaffRes.ok) {
            throw new Error('Failed to fetch business targets data');
          }

          const [summary, allStaff] = await Promise.all([
            summaryRes.json(),
            allStaffRes.json(),
          ]);

          setBusinessSummary(summary);
          setAllStaffPerformance(allStaff);
        } else {
          // Staff: Fetch only personal performance data
          const [staffRes, dailyRes] = await Promise.all([
            fetch(`http://localhost:3000/api/business/targets/staff/${user?.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            }),
            fetch('http://localhost:3000/api/business/targets/daily', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            })
          ]);

          if (!staffRes.ok || !dailyRes.ok) {
            throw new Error('Failed to fetch performance data');
          }

          const [staff, daily] = await Promise.all([
            staffRes.json(),
            dailyRes.json(),
          ]);

          setStaffPerformance(staff);
          setDailyData(daily);
        }
      } catch (err) {
        console.error('Error fetching business targets:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading business targets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Target className="text-indigo-400" size={32} />
            {user?.role === 'admin' || user?.role === 'manager' ? 'Business Targets & Staff Performance' : 'My Performance'}
          </h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            <Calendar size={16} />
            {businessSummary?.period?.currentMonth || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Activity size={18} />
          Refresh
        </button>
      </div>

      {/* Admin/Manager View: All Staff Performance */}
      {(user?.role === 'admin' || user?.role === 'manager') && businessSummary && allStaffPerformance && (
        <>
          {/* Overall Business Target */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 card-bevel">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="text-indigo-400" size={24} />
              Monthly Business Target
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Circular Progress */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <svg className="w-48 h-48 transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-gray-700"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - (businessSummary?.progress?.percentage || 0) / 100)}`}
                      className={getColorClasses(businessSummary.progress.color).text}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {(businessSummary?.progress?.percentage || 0).toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-400">Complete</span>
                  </div>
                </div>
              </div>

              {/* Target Details */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400">Monthly Target</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(businessSummary.targets.businessMonthly)}
                    </p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400">Current Sales</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(businessSummary.current.totalSales)}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-400">Remaining</p>
                    <p className={`text-lg font-bold ${getColorClasses(businessSummary.progress.color).text}`}>
                      {formatCurrency(businessSummary.progress.remaining)}
                    </p>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getColorClasses(businessSummary.progress.color).bg}`}
                      style={{ width: `${businessSummary.progress.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* All Staff Performance */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 card-bevel">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="text-indigo-400" size={24} />
              All Staff Performance
            </h2>

            <div className="grid gap-4">
              {allStaffPerformance && allStaffPerformance.length > 0 ? allStaffPerformance.map(staff => {
                const dailyColors = getColorClasses(staff.daily_color);
                const monthlyColors = getColorClasses(staff.monthly_color);

                return (
                  <div key={staff.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{staff.name}</h3>
                        <p className="text-sm text-gray-400">{staff.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="text-center px-3 py-1 bg-gray-600 rounded-lg">
                          <p className="text-xs text-gray-400">Tier</p>
                          <p className="text-lg font-bold text-white">{staff.commission_tier}</p>
                        </div>
                        <div className="text-center px-3 py-1 bg-gray-600 rounded-lg">
                          <p className="text-xs text-gray-400">Commission</p>
                          <p className="text-lg font-bold text-green-400">{formatCurrency(staff.estimated_commission)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Daily Progress */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-400">Today</span>
                          <span className={`text-sm font-bold ${dailyColors.text}`}>
                            {formatCurrency(staff.today_sales)} / {formatCurrency(staff.daily_target)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${dailyColors.bg}`}
                            style={{ width: `${Math.min(staff.daily_percentage, 100)}%` }}
                          />
                        </div>
                        <p className={`text-xs mt-1 ${dailyColors.text}`}>
                          {staff.daily_percentage.toFixed(1)}%
                        </p>
                      </div>

                      {/* Monthly Progress */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-400">Month</span>
                          <span className={`text-sm font-bold ${monthlyColors.text}`}>
                            {formatCurrency(staff.monthly_sales)} / {formatCurrency(staff.monthly_target)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${monthlyColors.bg}`}
                            style={{ width: `${Math.min(staff.monthly_percentage, 100)}%` }}
                          />
                        </div>
                        <p className={`text-xs mt-1 ${monthlyColors.text}`}>
                          {staff.monthly_percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center text-gray-400 py-8">
                  No staff performance data available
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Staff View: Personal Performance Dashboard */}
      {user?.role === 'staff' && staffPerformance && dailyData && (
        <StaffPerformanceDashboard
          staffPerformance={staffPerformance}
          dailyData={dailyData}
        />
      )}

      {/* No data available message */}
      {user && !loading && !businessSummary && !staffPerformance && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No performance data available yet.</p>
          <p className="text-gray-500 text-sm mt-2">Start making sales or processing operations to see your performance data here.</p>
        </div>
      )}
    </div>
  );
};

export default BusinessTargetsPage;