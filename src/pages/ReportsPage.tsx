import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { formatCurrency } from '../utils/formatCurrency';
import { getAuthToken } from '../store/authStore';
import {
  TrendingUp,
  DollarSign,
  Users,
  PieChart,
  Download,
  ArrowUp,
  ArrowDown,
  Clock,
  RefreshCw,
  AlertCircle,
  Activity,
  ShoppingBag,
  Target
} from 'lucide-react';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  BarElement,
  ArcElement,
  Filler
} from 'chart.js';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  BarElement,
  ArcElement,
  Filler
);

// Types
interface ProfitSummary {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  salesThisMonth: number;
  expensesThisMonth: number;
  profitThisMonth: number;
  salesTrend: number;
  expenseTrend: number;
  profitTrend: number;
  monthlyBreakdown: Array<{
    month: string;
    sales: number;
    expenses: number;
    profit: number;
  }>;
}

interface ServicePerformance {
  byRevenue: Array<{
    serviceId: string;
    serviceName: string;
    category: string;
    totalRevenue: number;
    orderCount: number;
  }>;
  byOrders: Array<{
    serviceId: string;
    serviceName: string;
    category: string;
    totalRevenue: number;
    orderCount: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    totalRevenue: number;
    orderCount: number;
  }>;
}

interface CustomerRankings {
  bySpent: Array<{
    id: string;
    name: string;
    phone: string;
    totalSpent: number;
    orderCount: number;
    lastVisit: string;
  }>;
  byOrders: Array<{
    id: string;
    name: string;
    phone: string;
    totalSpent: number;
    orderCount: number;
    lastVisit: string;
  }>;
  byLoyalty: Array<{
    id: string;
    name: string;
    phone: string;
    loyaltyPoints: number;
    totalSpent: number;
  }>;
}

interface ExpenseAnalytics {
  totalThisMonth: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    amount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    amount: number;
  }>;
  statusBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
  };
  paymentMethodBreakdown: Array<{
    method: string;
    amount: number;
  }>;
}

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: 'white'
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          return `${context.dataset.label || ''}: ${context.raw}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: 'white'
      }
    },
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: 'white'
      }
    }
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: 'white'
      }
    }
  }
};

export default function ReportsPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [profitSummary, setProfitSummary] = useState<ProfitSummary | null>(null);
  const [servicePerformance, setServicePerformance] = useState<ServicePerformance | null>(null);
  const [customerRankings, setCustomerRankings] = useState<CustomerRankings | null>(null);
  const [expenseAnalytics, setExpenseAnalytics] = useState<ExpenseAnalytics | null>(null);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      const [profitRes, serviceRes, customerRes] = await Promise.all([
        fetch(API_ENDPOINTS.analytics + '/profit-summary', { headers }),
        fetch(API_ENDPOINTS.analytics + '/service-performance', { headers }),
        fetch(API_ENDPOINTS.analytics + '/customer-rankings', { headers })
      ]);

      if (!profitRes.ok) throw new Error('Failed to fetch profit summary');
      if (!serviceRes.ok) throw new Error('Failed to fetch service performance');
      if (!customerRes.ok) throw new Error('Failed to fetch customer rankings');

      const [profitData, serviceData, customerData] = await Promise.all([
        profitRes.json(),
        serviceRes.json(),
        customerRes.json()
      ]);

      setProfitSummary(profitData);
      setServicePerformance(serviceData);
      setCustomerRankings(customerData);

      // Fetch expense analytics separately - it may fail due to auth requirements
      try {
        const expenseRes = await fetch(API_ENDPOINTS.expenses + '/analytics', { headers });
        if (expenseRes.ok) {
          const expenseData = await expenseRes.json();
          setExpenseAnalytics(expenseData);
        } else {
          // Set empty expense data if auth fails
          setExpenseAnalytics({
            totalThisMonth: 0,
            categoryBreakdown: [],
            weeklyTrends: [],
            monthlyTrends: [],
            statusBreakdown: { pending: 0, approved: 0, rejected: 0 },
            paymentMethodBreakdown: []
          });
        }
      } catch {
        // Silently fail for expense analytics - not critical
        setExpenseAnalytics({
          totalThisMonth: 0,
          categoryBreakdown: [],
          weeklyTrends: [],
          monthlyTrends: [],
          statusBreakdown: { pending: 0, approved: 0, rejected: 0 },
          paymentMethodBreakdown: []
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Prepare chart data
  const getSalesChartData = () => {
    if (!profitSummary?.monthlyBreakdown?.length) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Sales',
          data: [0],
          fill: true,
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgb(99, 102, 241)',
          tension: 0.4
        }]
      };
    }

    const labels = profitSummary.monthlyBreakdown.map(m => {
      const [year, month] = m.month.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Sales',
          data: profitSummary.monthlyBreakdown.map(m => m.sales),
          fill: true,
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgb(99, 102, 241)',
          tension: 0.4
        },
        {
          label: 'Expenses',
          data: profitSummary.monthlyBreakdown.map(m => m.expenses),
          fill: true,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgb(239, 68, 68)',
          tension: 0.4
        },
        {
          label: 'Profit',
          data: profitSummary.monthlyBreakdown.map(m => m.profit),
          fill: false,
          borderColor: 'rgba(34, 197, 94, 1)',
          tension: 0.4
        }
      ]
    };
  };

  const getServiceChartData = () => {
    if (!servicePerformance?.categoryBreakdown?.length) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(107, 114, 128, 0.8)']
        }]
      };
    }

    const colors = [
      'rgba(99, 102, 241, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(251, 191, 36, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(14, 165, 233, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(75, 85, 99, 0.8)'
    ];

    return {
      labels: servicePerformance.categoryBreakdown.map(c => c.category),
      datasets: [{
        data: servicePerformance.categoryBreakdown.map(c => c.totalRevenue),
        backgroundColor: servicePerformance.categoryBreakdown.map((_, i) => colors[i % colors.length])
      }]
    };
  };

  const getCustomerChartData = () => {
    if (!customerRankings?.bySpent?.length) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(107, 114, 128, 0.8)']
        }]
      };
    }

    const top10 = customerRankings.bySpent.slice(0, 10);

    return {
      labels: top10.map(c => c.name.split(' ')[0]),
      datasets: [{
        label: 'Total Spent',
        data: top10.map(c => c.totalSpent),
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
        borderColor: 'rgb(168, 85, 247)'
      }]
    };
  };

  const getExpenseChartData = () => {
    if (!expenseAnalytics?.categoryBreakdown?.length) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(107, 114, 128, 0.8)']
        }]
      };
    }

    const colors = [
      'rgba(239, 68, 68, 0.8)',
      'rgba(251, 191, 36, 0.8)',
      'rgba(14, 165, 233, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(75, 85, 99, 0.8)'
    ];

    return {
      labels: expenseAnalytics.categoryBreakdown.map(c => c.category),
      datasets: [{
        data: expenseAnalytics.categoryBreakdown.map(c => c.amount),
        backgroundColor: expenseAnalytics.categoryBreakdown.map((_, i) => colors[i % colors.length])
      }]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading reports data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Real-time business analytics and insights</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchAllData}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 card-bevel px-6 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-400" />
                <span className="font-mono text-indigo-400 text-lg">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
              <div className="text-gray-500 text-xs mt-1">
                {currentTime.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards - Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Sales */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(profitSummary?.totalSales || 0)}
                </p>
                <div className={`flex items-center text-sm mt-1 ${(profitSummary?.salesTrend || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(profitSummary?.salesTrend || 0) >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {Math.abs(profitSummary?.salesTrend || 0).toFixed(1)}% vs last month
                </div>
              </div>
              <div className="bg-indigo-900/50 p-3 rounded-lg">
                <TrendingUp className="text-indigo-400" size={24} />
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(profitSummary?.totalExpenses || 0)}
                </p>
                <div className={`flex items-center text-sm mt-1 ${(profitSummary?.expenseTrend || 0) <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(profitSummary?.expenseTrend || 0) <= 0 ? <ArrowDown className="h-3 w-3 mr-1" /> : <ArrowUp className="h-3 w-3 mr-1" />}
                  {Math.abs(profitSummary?.expenseTrend || 0).toFixed(1)}% vs last month
                </div>
              </div>
              <div className="bg-red-900/50 p-3 rounded-lg">
                <DollarSign className="text-red-400" size={24} />
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Net Profit</p>
                <p className={`text-2xl font-bold ${(profitSummary?.netProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(profitSummary?.netProfit || 0)}
                </p>
                <div className={`flex items-center text-sm mt-1 ${(profitSummary?.profitTrend || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(profitSummary?.profitTrend || 0) >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {Math.abs(profitSummary?.profitTrend || 0).toFixed(1)}% vs last month
                </div>
              </div>
              <div className="bg-green-900/50 p-3 rounded-lg">
                <Activity className="text-green-400" size={24} />
              </div>
            </div>
          </div>

          {/* This Month Stats */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">This Month</p>
                <p className="text-xl font-bold text-white">
                  Sales: {formatCurrency(profitSummary?.salesThisMonth || 0)}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Expenses: {formatCurrency(profitSummary?.expensesThisMonth || 0)}
                </p>
              </div>
              <div className="bg-purple-900/50 p-3 rounded-lg">
                <Target className="text-purple-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Trend Chart */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Sales & Profit Trend</h3>
            <div className="h-[250px]">
              <Line data={getSalesChartData()} options={options} />
            </div>
          </div>

          {/* Service Performance Chart */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue by Service Category</h3>
            <div className="h-[250px]">
              <Doughnut data={getServiceChartData()} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Customers Chart */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Customers by Spending</h3>
            <div className="h-[250px]">
              <Bar data={getCustomerChartData()} options={options} />
            </div>
          </div>

          {/* Expense Breakdown Chart */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Expense Breakdown</h3>
            <div className="h-[250px]">
              <Pie data={getExpenseChartData()} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Services Table */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Top Services by Revenue</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              <table className="w-full">
                <thead className="bg-gray-800/80 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Service</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Category</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Orders</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {servicePerformance?.byRevenue?.slice(0, 10).map((service, idx) => (
                    <tr key={service.serviceId || idx} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm text-white">{service.serviceName}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{service.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-right">{service.orderCount}</td>
                      <td className="px-4 py-3 text-sm text-green-400 text-right">{formatCurrency(service.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Customers Table */}
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Top Customers by Spending</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              <table className="w-full">
                <thead className="bg-gray-800/80 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Phone</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Orders</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {customerRankings?.bySpent?.slice(0, 10).map((customer, idx) => (
                    <tr key={customer.id || idx} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm text-white">{customer.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{customer.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-right">{customer.orderCount}</td>
                      <td className="px-4 py-3 text-sm text-green-400 text-right">{formatCurrency(customer.totalSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Expense Categories Table */}
        <div className="mt-6 card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Expense Categories This Month</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            <table className="w-full">
              <thead className="bg-gray-800/80 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Category</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Amount</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {expenseAnalytics?.categoryBreakdown?.map((category, idx) => (
                  <tr key={category.category || idx} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm text-white">{category.category}</td>
                    <td className="px-4 py-3 text-sm text-red-400 text-right">{formatCurrency(category.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 text-right">{category.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
