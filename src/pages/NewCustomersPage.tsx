import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import {
  Users,
  TrendingUp,
  UserPlus,
  Sparkles,
  Gift,
  Trophy,
  Zap,
  Clock,
  ChevronRight,
  ArrowUp
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday, isValid } from 'date-fns';

const safeFormatDate = (dateStr: string | null | undefined, fallback = 'Recently'): string => {
  if (!dateStr) return fallback;
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return fallback;
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd, yyyy');
  } catch {
    return fallback;
  }
};
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChartCard } from '../components/ui/ChartCard';

interface NewCustomersData {
  summary: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
  };
  trend: {
    date: string;
    count: number;
  }[];
  recentCustomers: {
    id: string;
    name: string;
    phone: string;
    createdAt: string;
    totalOrders: number;
  }[];
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899'];

export default function NewCustomersPage() {
  const [data, setData] = useState<NewCustomersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(API_ENDPOINTS['analytics/new-customers']);
        if (!res.ok) {
          throw new Error('Failed to fetch new customers data');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error fetching new customers:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <UserPlus size={24} className="text-indigo-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-400 animate-pulse text-sm">Loading acquisition data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-red-400">Error: {error || 'No data available'}</div>
      </div>
    );
  }

  const { summary, trend, recentCustomers } = data;

  // Compute streak: consecutive days with at least 1 new customer (up to today)
  const computeStreak = () => {
    if (!trend || trend.length === 0) return 0;
    const sorted = [...trend].reverse(); // newest first
    let streak = 0;
    for (const day of sorted) {
      if (day.count > 0) streak++;
      else break;
    }
    return streak;
  };

  // Compute milestone based on this month's count
  const getMilestone = () => {
    const count = summary.thisMonth;
    if (count >= 100) return { label: `${count}th Customer!`, emoji: '🎉', color: 'from-yellow-500 to-orange-500' };
    if (count >= 50) return { label: `${count}th Customer!`, emoji: '🏆', color: 'from-amber-500 to-yellow-500' };
    if (count >= 25) return { label: `${count}th Customer!`, emoji: '⭐', color: 'from-indigo-500 to-purple-500' };
    if (count >= 10) return { label: `${count} New This Month`, emoji: '🚀', color: 'from-emerald-500 to-teal-500' };
    if (count >= 1) return { label: `${count} New Customer${count > 1 ? 's' : ''} This Month`, emoji: '🎊', color: 'from-blue-500 to-indigo-500' };
    return null;
  };

  const streak = computeStreak();
  const milestone = getMilestone();
  const newestCustomer = recentCustomers[0] ?? null;
  const returningCustomers = summary.total > 0 ? Math.max(0, summary.total - summary.thisMonth) : 0;
  const pieData = [
    { name: 'New Customers', value: summary.thisMonth, color: '#10B981' },
    { name: 'Returning', value: returningCustomers, color: '#6366F1' }
  ].filter(d => d.value > 0);

  // Timeline data: last 14 days
  const timelineData = trend.slice(-14);

  // Weekly comparison
  const thisWeekRegistrations = summary.thisWeek;
  const lastWeekRegistrations = trend.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);
  const weekOverWeekChange = lastWeekRegistrations > 0
    ? Math.round(((thisWeekRegistrations - lastWeekRegistrations) / lastWeekRegistrations) * 100)
    : thisWeekRegistrations > 0 ? 100 : 0;

  return (
    <div className="p-6 space-y-6">

      {/* Hero: Latest Arrival */}
      {newestCustomer && (
        <div className="relative rounded-2xl overflow-hidden">
          {/* Ambient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-gray-900 to-indigo-900/20" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-in fade-in zoom-in duration-500">
                <span className="text-3xl md:text-4xl font-bold text-white">
                  {newestCustomer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Pulsing ring */}
              <div className="absolute -inset-2 rounded-3xl border-2 border-emerald-400/50 animate-ping" />
              {/* NEW badge */}
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Zap size={10} />
                LATEST
              </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                  <Sparkles size={12} />
                  Newest Arrival
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {newestCustomer.name}
              </h2>
              <p className="text-gray-400 text-sm flex items-center justify-center md:justify-start gap-2">
                <span className="font-mono text-gray-300">{newestCustomer.phone}</span>
                <span className="text-white/20">·</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Joined {safeFormatDate(newestCustomer.createdAt)}
                </span>
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{newestCustomer.totalOrders}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Orders</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1">
                  <ArrowUp size={16} />
                  {summary.thisMonth}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">This Month</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{summary.total}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">All Time</div>
              </div>
            </div>

            {/* Milestone callout */}
            {milestone && (
              <div className={`flex-shrink-0 hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${milestone.color} text-white font-bold text-sm shadow-lg`}>
                <span className="text-lg">{milestone.emoji}</span>
                <span>{milestone.label}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Streak + Milestone Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak Card */}
        <div className="relative rounded-2xl bg-gradient-to-br from-amber-900/30 to-orange-900/20 border border-amber-500/20 p-5 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Trophy size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Acquisition Streak</p>
                <p className="text-gray-400 text-[10px]">Consecutive days with new customers</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">{streak}</span>
              <span className="text-amber-400 text-sm mb-1">day{streak !== 1 ? 's' : ''} in a row</span>
            </div>
            <div className="flex gap-1 mt-3">
              {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
              ))}
              {Array.from({ length: Math.max(0, 7 - streak) }).map((_, i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full bg-white/10" />
              ))}
            </div>
          </div>
        </div>

        {/* Growth vs Last Week */}
        <div className="relative rounded-2xl bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-indigo-500/20 p-5 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Week-over-Week</p>
                <p className="text-gray-400 text-[10px]">Registration growth</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-4xl font-bold ${weekOverWeekChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {weekOverWeekChange >= 0 ? '+' : ''}{weekOverWeekChange}%
              </span>
              <span className="text-gray-400 text-sm mb-1">vs last week</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span className="text-gray-400">{thisWeekRegistrations} this week</span>
              <span className="text-white/20">·</span>
              <span>{lastWeekRegistrations} last week</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="relative rounded-2xl bg-gray-800/60 border border-white/10 p-5 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Gift size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">New This Month</p>
                <p className="text-gray-400 text-[10px]">Customer acquisition</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">{summary.thisMonth}</span>
              <span className="text-gray-400 text-sm mb-1">new customers</span>
            </div>
            {/* Progress bar to next milestone */}
            {summary.thisMonth < 100 && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>{summary.thisMonth}</span>
                  <span>{Math.min(summary.thisMonth + 1, 100)}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                    style={{ width: `${Math.min((summary.thisMonth % 50) / 50 * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Trends Chart */}
        <ChartCard
          title="Registration Trends"
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
                Last 30 days
              </span>
              <div className="flex items-center gap-1 text-xs">
                {weekOverWeekChange >= 0 ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <ArrowUp size={12} /> {Math.abs(weekOverWeekChange)}%
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-0.5">
                    <TrendingUp size={12} className="rotate-180" /> {Math.abs(weekOverWeekChange)}%
                  </span>
                )}
              </div>
            </div>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCountGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1F2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}
                  labelFormatter={(value) => format(new Date(value), 'MMMM dd, yyyy')}
                  formatter={(value: number) => [`${value} customer${value !== 1 ? 's' : ''}`, 'New Customers']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fill="url(#colorCount)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* New vs Returning Pie Chart */}
        <ChartCard
          title="New vs Returning"
          className="lg:col-span-1"
          action={
            <span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
              This month
            </span>
          }
        >
          <div className="h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1F2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(value: number, name: string) => [`${value}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-3xl font-bold text-white">{summary.thisMonth}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">New</p>
            </div>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-gray-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Mini Bar Chart: Last 14 days */}
      <ChartCard
        title="14-Day Registration Timeline"
        className="w-full"
        action={
          <span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
            Daily breakdown
          </span>
        }
      >
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 10 }}
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 10 }}
                width={25}
              />
              <Tooltip
                contentStyle={{
                  background: '#1F2937',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                formatter={(value: number) => [`${value}`, 'Registrations']}
              />
              <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Recent Customers Timeline */}
      <ChartCard title="Recent New Customers" className="w-full">
        <div className="space-y-1">
          {recentCustomers.length > 0 ? (
            recentCustomers.map((customer, index) => {
              const isNewest = index === 0;
              const dayLabel = safeFormatDate(customer.createdAt, 'Unknown');
              const timeLabel = customer.createdAt ? format(parseISO(customer.createdAt), 'h:mm a') : '--:--';

              return (
                <div
                  key={customer.id}
                  className={`group flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isNewest
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isNewest
                      ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/30'
                      : 'bg-gray-700/50'
                  }`}>
                    <span className={`text-sm font-bold ${isNewest ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                    {isNewest && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900">
                        <Sparkles size={6} className="text-white absolute inset-0 m-auto" />
                      </div>
                    )}
                  </div>

                  {/* Name & Phone */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${isNewest ? 'text-white' : 'text-gray-300'}`}>
                        {customer.name}
                      </p>
                      {isNewest && (
                        <span className="flex-shrink-0 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">
                          Newest
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{customer.phone}</p>
                  </div>

                  {/* Date */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-medium ${isNewest ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {dayLabel}
                    </p>
                    <p className="text-[10px] text-gray-600">{timeLabel}</p>
                  </div>

                  {/* Orders */}
                  <div className="text-right flex-shrink-0 w-16">
                    <p className={`text-sm font-bold ${isNewest ? 'text-white' : 'text-gray-300'}`}>
                      {customer.totalOrders}
                    </p>
                    <p className="text-[10px] text-gray-500">orders</p>
                  </div>

                  {/* Badge */}
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${
                      isNewest
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                        : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                    }`}>
                      NEW CUSTOMER
                    </span>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={14} className="text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Users size={32} className="mx-auto mb-3 text-gray-700" />
              <p>No new customers yet</p>
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  );
}
