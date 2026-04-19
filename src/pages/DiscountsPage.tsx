import React, { useState, useEffect } from 'react';
import { Percent, TrendingDown, Tag, Award, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../utils/formatCurrency';

interface DiscountSummary {
  totalDiscounts: number;
  averageDiscountPercent: number;
  operationsWithDiscount: number;
}

interface PeriodData {
  date: string;
  total: number;
  count: number;
}

interface TopDiscounted {
  id: string;
  customerName: string;
  totalAmount: number;
  discount: number;
  discountPercent: number;
  date: string;
  items: Array<{
    name: string;
    type: 'service' | 'product';
    price: number;
  }>;
}

interface DiscountAnalytics {
  summary: DiscountSummary;
  byPeriod: PeriodData[];
  topDiscounted: TopDiscounted[];
}

type PeriodToggle = 'day' | 'week' | 'month';

const DiscountsPage: React.FC = () => {
  const [data, setData] = useState<DiscountAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodToggle, setPeriodToggle] = useState<PeriodToggle>('day');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/analytics/discounts', {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch discount analytics');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching discount analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Aggregate data for week/month view
  const getAggregatedData = () => {
    if (!data?.byPeriod) return [];

    if (periodToggle === 'day') {
      return data.byPeriod.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: item.total,
        count: item.count
      }));
    }

    // Group by week
    if (periodToggle === 'week') {
      const grouped: Record<string, { total: number; count: number }> = {};
      data.byPeriod.forEach(item => {
        const date = new Date(item.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!grouped[weekKey]) {
          grouped[weekKey] = { total: 0, count: 0 };
        }
        grouped[weekKey].total += item.total;
        grouped[weekKey].count += item.count;
      });
      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, values]) => ({
          date: `Week of ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          total: values.total,
          count: values.count
        }));
    }

    // Group by month
    if (periodToggle === 'month') {
      const grouped: Record<string, { total: number; count: number }> = {};
      data.byPeriod.forEach(item => {
        const monthKey = item.date.substring(0, 7); // YYYY-MM
        if (!grouped[monthKey]) {
          grouped[monthKey] = { total: 0, count: 0 };
        }
        grouped[monthKey].total += item.total;
        grouped[monthKey].count += item.count;
      });
      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, values]) => ({
          date: new Date(date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          total: values.total,
          count: values.count
        }));
    }

    return [];
  };

  // Find highest single discount from topDiscounted
  const highestDiscount = data?.topDiscounted && data.topDiscounted.length > 0
    ? Math.max(...data.topDiscounted.map(t => t.discount))
    : 0;

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-white font-semibold">{formatCurrency(payload[0].value)}</p>
          <p className="text-gray-400 text-xs">{payload[0].payload.count} operation(s)</p>
        </div>
      );
    }
    return null;
  };

  const chartData = getAggregatedData();

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Discount Analytics</h1>
          <p className="text-gray-400">Track and analyze discount trends</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setPeriodToggle('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                periodToggle === 'day'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setPeriodToggle('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                periodToggle === 'week'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setPeriodToggle('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                periodToggle === 'month'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        {/* Total Discounts */}
        <div className="bg-gradient-to-br from-rose-900/50 to-rose-800/30 rounded-xl p-4 border border-rose-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-rose-300 text-xs font-medium flex items-center gap-1">
              <TrendingDown size={12} />
              TOTAL DISCOUNTS
            </span>
            <Award size={16} className="text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {loading ? '...' : formatCurrency(data?.summary?.totalDiscounts || 0)}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-rose-300/60 text-xs">Given to customers</span>
          </div>
        </div>

        {/* Average Discount */}
        <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 rounded-xl p-4 border border-amber-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-300 text-xs font-medium flex items-center gap-1">
              <Percent size={12} />
              AVG DISCOUNT
            </span>
            <Percent size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {loading ? '...' : `${(data?.summary?.averageDiscountPercent || 0).toFixed(1)}%`}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-amber-300/60 text-xs">Per operation</span>
          </div>
        </div>

        {/* Operations with Discounts */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-xl p-4 border border-indigo-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-300 text-xs font-medium flex items-center gap-1">
              <Tag size={12} />
              DISCOUNTED OPS
            </span>
            <Tag size={16} className="text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {loading ? '...' : (data?.summary?.operationsWithDiscount || 0)}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-indigo-300/60 text-xs">Operations affected</span>
          </div>
        </div>

        {/* Highest Single Discount */}
        <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl p-4 border border-emerald-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-300 text-xs font-medium flex items-center gap-1">
              <Award size={12} />
              HIGHEST
            </span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {loading ? '...' : formatCurrency(highestDiscount)}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-emerald-300/60 text-xs">Single largest discount</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card-bevel overflow-hidden mb-4">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Discount Trends</h3>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-400">Loading chart data...</div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-400">No discount data available</div>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="total"
                    fill="url(#roseGradient)"
                    radius={[4, 4, 0, 0]}
                    name="Discount Total"
                  />
                  <defs>
                    <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity={1} />
                      <stop offset="100%" stopColor="#E11D48" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top Discounted Operations Table */}
      <div className="card-bevel overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Top Discounted Operations</h3>
          <p className="text-sm text-gray-400">Operations with the highest discounts</p>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-red-400">Error: {error}</div>
          </div>
        ) : !data?.topDiscounted || data.topDiscounted.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400">No discounted operations found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/80 backdrop-blur-sm sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Items / Services</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Original Total</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Discount</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Discount %</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.topDiscounted.map((item, index) => {
                  const originalTotal = item.totalAmount + item.discount;
                  const finalTotal = item.totalAmount;

                  return (
                    <tr
                      key={item.id}
                      className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 flex items-center justify-center mr-3">
                            <span className="text-rose-400 text-sm font-semibold">
                              {item.customerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white font-medium">{item.customerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.items && item.items.length > 0 ? (
                            item.items.map((serviceItem, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  serviceItem.type === 'service'
                                    ? 'bg-indigo-500/20 text-indigo-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {serviceItem.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-xs">No items</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {formatCurrency(originalTotal)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-rose-400 font-semibold">
                          -{formatCurrency(item.discount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-semibold">
                          {item.discountPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-sm">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
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

export default DiscountsPage;
