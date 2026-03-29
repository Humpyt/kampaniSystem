import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatCurrency';
import { Trophy, Award, TrendingUp, Users, Wallet, ShieldOff, Archive, CheckCircle, Clock, BarChart3, PieChart as PieChartIcon, TrendingUp as LineIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import {
  getCommissionArchives,
  getCommissionByStaff,
  getCommissionTrends,
  archiveCommissions,
  markCommissionPaid,
  CommissionArchive,
  StaffCommission,
  CommissionTrends
} from '../api/commissions';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#14b8a6'];

export default function CommissionsPage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [mySales, setMySales] = useState<number>(0);
  const [viewingStaffId, setViewingStaffId] = useState<string | null>(searchParams.get('staff'));
  const [viewingStaffName, setViewingStaffName] = useState<string | null>(searchParams.get('name'));

  // Admin state
  const [allStaff, setAllStaff] = useState<StaffCommission[]>([]);
  const [archives, setArchives] = useState<CommissionArchive[]>([]);
  const [trends, setTrends] = useState<CommissionTrends[]>([]);
  const [archiveTotals, setArchiveTotals] = useState({ total_commissions: 0, total_sales: 0, paid_count: 0, pending_count: 0 });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        if (user?.role === 'admin') {
          await fetchAdminData();
        } else if (viewingStaffId && (user?.role === 'manager' || user?.role === 'admin')) {
          const res = await fetch(`http://localhost:3000/api/business/targets/staff/${viewingStaffId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
          });
          const data = await res.json();
          setMySales(data?.monthlyPerformance?.total || 0);
        } else if (user?.role === 'manager') {
          const res = await fetch('http://localhost:3000/api/business/targets/staff/all', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
          });
          const data = await res.json();
          setAllStaff(Array.isArray(data) ? data : []);
        } else {
          const res = await fetch(`http://localhost:3000/api/business/targets/staff/${user?.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
          });
          const data = await res.json();
          setMySales(data?.monthlyPerformance?.total || 0);
        }
      } catch (err) {
        console.error('Failed to fetch commission data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [user, viewingStaffId]);

  const fetchAdminData = async () => {
    try {
      const [archivesRes, byStaffRes, trendsRes] = await Promise.all([
        getCommissionArchives({ year: selectedYear, month: selectedMonth }),
        getCommissionByStaff(selectedYear, selectedMonth),
        getCommissionTrends(6)
      ]);
      setArchives(archivesRes.archives);
      setArchiveTotals(archivesRes.totals);
      setAllStaff(byStaffRes.staff);
      setTrends(trendsRes.trends);
    } catch (err) {
      console.error('Failed to fetch admin commission data', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user, selectedYear, selectedMonth]);

  const handleArchive = async () => {
    try {
      setArchiving(true);
      const result = await archiveCommissions();
      if (result.success) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to archive commissions', err);
    } finally {
      setArchiving(false);
    }
  };

  const handleMarkPaid = async (archiveId: string) => {
    try {
      await markCommissionPaid(archiveId);
      await fetchAdminData();
    } catch (err) {
      console.error('Failed to mark commission as paid', err);
    }
  };

  // Commission Calculation
  const calculateCommission = (sales: number) => {
    let rate = 0.01;
    let rateStr = '1%';
    let tierColor = 'text-gray-400';
    let progressMax = 10000000;

    if (sales > 20000000) {
      rate = 0.03;
      rateStr = '3%';
      tierColor = 'text-green-400';
      progressMax = 26000000;
    } else if (sales > 10000000) {
      rate = 0.02;
      rateStr = '2%';
      tierColor = 'text-orange-400';
      progressMax = 20000000;
    }
    return { commission: sales * rate, rate, rateStr, tierColor, progressMax };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-gray-400 animate-pulse text-lg">Loading Commissions...</div>
      </div>
    );
  }

  // Admin View
  if (user?.role === 'admin') {
    const barData = allStaff.map((s, i) => ({
      name: s.user_name.split(' ')[0],
      sales: s.total_sales,
      commission: s.commission_amount,
      fill: CHART_COLORS[i % CHART_COLORS.length]
    }));

    const pieData = allStaff.filter(s => s.commission_amount > 0).map((s, i) => ({
      name: s.user_name.split(' ')[0],
      value: s.commission_amount,
      color: CHART_COLORS[i % CHART_COLORS.length]
    }));

    const lineData = trends.map(t => ({
      month: String(t.month).padStart(2, '0'),
      commissions: t.totalCommissions,
      staff: t.staffCount
    }));

    return (
      <div className="min-h-screen bg-gray-900 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center gap-4 mb-2">
                <Trophy className="text-yellow-500" size={36} />
                Commission Management
              </h1>
              <p className="text-gray-400 font-medium max-w-2xl">
                Track and manage staff commissions with detailed analytics and archives.
              </p>
            </div>

            <div className="flex gap-3">
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-');
                  setSelectedYear(Number(y));
                  setSelectedMonth(Number(m));
                }}
                className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  return (
                    <option key={i} value={`${d.getFullYear()}-${d.getMonth() + 1}`}>
                      {d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </option>
                  );
                })}
              </select>
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
              >
                <Archive size={18} />
                {archiving ? 'Archiving...' : 'Archive Month'}
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="text-emerald-400" size={24} />
                <span className="text-gray-400 text-sm">Total Commissions</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(archiveTotals.total_commissions)}</p>
            </div>
            <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-orange-400" size={24} />
                <span className="text-gray-400 text-sm">Pending</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">{archiveTotals.pending_count}</p>
            </div>
            <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="text-green-400" size={24} />
                <span className="text-gray-400 text-sm">Paid</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{archiveTotals.paid_count}</p>
            </div>
            <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-blue-400" size={24} />
                <span className="text-gray-400 text-sm">Total Sales</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency(archiveTotals.total_sales)}</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart - Commission by Staff */}
            <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <BarChart3 className="text-indigo-400" size={20} />
                Commission by Staff
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="commission" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart - Distribution */}
            <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <PieChartIcon className="text-purple-400" size={20} />
                Commission Distribution
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Line Chart - Trends */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <LineIcon className="text-emerald-400" size={20} />
              Commission Trend
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="commissions" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Commission" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Archives Table */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Commission Archives</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {archives.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No commission archives for this period. Click "Archive Month" to create one.
                      </td>
                    </tr>
                  ) : (
                    archives.map((archive) => (
                      <tr key={archive.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 text-white font-medium">{archive.user_name}</td>
                        <td className="px-6 py-4 text-gray-400">{archive.month}/{archive.year}</td>
                        <td className="px-6 py-4 text-gray-400">{formatCurrency(archive.total_sales)}</td>
                        <td className="px-6 py-4 text-gray-400">{(archive.commission_rate * 100).toFixed(0)}%</td>
                        <td className="px-6 py-4 text-emerald-400 font-semibold">{formatCurrency(archive.commission_amount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            archive.status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {archive.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {archive.status === 'pending' && (
                            <button
                              onClick={() => handleMarkPaid(archive.id)}
                              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Staff/Manger Views (existing code)
  const renderCommissionCard = (name: string, sales: number, isPersonal: boolean = false) => {
    const { commission, rateStr, tierColor, progressMax } = calculateCommission(sales);
    const progressPercentage = Math.min(100, (sales / progressMax) * 100);
    const deficitToNextTier = progressMax - sales;

    const chartData = [
      { name: 'Achieved', value: sales, color: '#10B981' },
      { name: 'Remaining', value: Math.max(0, deficitToNextTier), color: '#374151' }
    ];

    return (
      <div className={`card-bevel bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-6 shadow-xl ${isPersonal ? 'md:col-span-2 lg:col-span-3' : ''}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className={tierColor} size={24} />
              {name}
            </h3>
            <p className="text-gray-400 text-sm mt-1">Monthly Sales: <strong className="text-gray-200">{formatCurrency(sales)}</strong></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Current Tier Rate</p>
            <span className={`px-4 py-1.5 rounded-full font-bold text-lg bg-gray-800/80 border border-white/10 shadow-inner ${tierColor}`}>
              {rateStr}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 relative flex-shrink-0 drop-shadow-lg">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-sm font-bold text-gray-300">{Math.round(progressPercentage)}%</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-5">
            <div className="bg-gray-800/60 rounded-xl p-4 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Estimated Commission</p>
                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  {formatCurrency(commission)}
                </p>
              </div>
              <Wallet className="text-emerald-500/50 w-12 h-12" />
            </div>

            {deficitToNextTier > 0 && sales < 26000000 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-start gap-3">
                <TrendingUp className="text-orange-400 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-orange-200 font-medium">
                  Earn <strong className="text-orange-400">{formatCurrency(deficitToNextTier)}</strong> more to reach the next tier threshold!
                </p>
              </div>
            )}
            {sales >= 26000000 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-3">
                <Trophy className="text-emerald-400 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-emerald-200 font-medium">
                  Maximum top tier unlocked! You are earning 3% commission.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center gap-4 mb-2">
              <Trophy className="text-yellow-500" size={36} />
              Staff Commissions
            </h1>
            <p className="text-gray-400 font-medium max-w-2xl">
              Commission rates increase based on monthly sales milestones.
            </p>
          </div>

          <div className="flex gap-2 text-xs font-mono font-bold self-start md:self-auto">
            <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400">1% &lt; 10M</span>
            <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-orange-500/30 text-orange-400">2% &lt; 20M</span>
            <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-green-500/30 text-emerald-400">3% &gt;= 20M</span>
          </div>
        </div>

        {/* Admin: Not Applicable Message */}
        {!viewingStaffId && user?.role === 'admin' ? (
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 rounded-2xl p-12 shadow-xl text-center">
            <ShieldOff className="text-gray-500 w-20 h-20 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">Commissions Not Applicable</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Commissions are earned by staff members based on their monthly sales performance.
              Use the Commission Management view above to track and manage staff commissions.
            </p>
          </div>
        ) : viewingStaffId && viewingStaffName ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
              <Users className="text-indigo-400" size={24} />
              {decodeURIComponent(viewingStaffName)}'s Commission
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderCommissionCard(decodeURIComponent(viewingStaffName), mySales)}
            </div>
          </div>
        ) : user?.role === 'manager' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
              <Users className="text-indigo-400" size={24} />
              Team Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allStaff.map(staff => renderCommissionCard(staff.name || staff.user_name, staff.monthly_sales || 0))}
              {allStaff.length === 0 && <p className="text-gray-500 col-span-3">No staff data available.</p>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {renderCommissionCard(user?.name || 'My Performance', mySales, true)}
          </div>
        )}
      </div>
    </div>
  );
}
