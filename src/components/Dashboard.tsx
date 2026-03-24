import { useState, useEffect } from 'react';
import { Clock, Package, CheckCircle, AlertCircle, PlusCircle, TrendingUp, DollarSign, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { RepairItem } from '../types';
import { useAuthStore } from '../store/authStore';
import { pendingRepairs, mockRepairs, completedRepairs, mockPickups } from '../data/mockData';
import { formatCurrency } from '../utils/formatCurrency';

// Mock data for charts
const revenueData = [
  { name: 'Mon', value: 150000 },
  { name: 'Tue', value: 230000 },
  { name: 'Wed', value: 180000 },
  { name: 'Thu', value: 290000 },
  { name: 'Fri', value: 200000 },
  { name: 'Sat', value: 320000 },
  { name: 'Sun', value: 250000 }
];

const orderTypeData = [
  { name: 'Shoes', value: 60 },
  { name: 'Bags', value: 30 },
  { name: 'Other', value: 10 }
];

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899'];

// Calculate yesterday's revenue (mock data)
const yesterdayRevenue = 450000; // This would normally be calculated from actual transaction data

export function Dashboard({ onNewOrder }: { onNewOrder: () => void }) {
  const { user } = useAuthStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stats = [
    {
      title: "Yesterday's Revenue",
      value: formatCurrency(yesterdayRevenue),
      valueDisplay: (
        <div className="text-2xl font-semibold text-gray-900">
          {new Intl.NumberFormat('en-UG', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(yesterdayRevenue)}
          <span className="text-sm ml-1">USh</span>
        </div>
      ),
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'In Progress',
      value: mockRepairs.length,
      valueDisplay: <p className="text-2xl font-semibold text-gray-900">{mockRepairs.length}</p>,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Completed',
      value: completedRepairs.length,
      valueDisplay: <p className="text-2xl font-semibold text-gray-900">{completedRepairs.length}</p>,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Ready for Pickup',
      value: mockPickups.length,
      valueDisplay: <p className="text-2xl font-semibold text-gray-900">{mockPickups.length}</p>,
      icon: AlertCircle,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name || 'User'}</p>
        </div>
        <button
          onClick={onNewOrder}
          className="w-full md:w-auto inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          New Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`rounded-md p-3 ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                {stat.valueDisplay}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Weekly Revenue</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Order Distribution</h2>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {orderTypeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
          <span className="text-sm text-gray-500">
            Showing {mockRepairs.length} orders
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockRepairs.map((repair) => (
                <tr key={repair.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{repair.customerName}</div>
                    <div className="text-sm text-gray-500">{repair.contactNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize text-sm text-gray-900">{repair.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{repair.description}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      repair.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      repair.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      repair.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {repair.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(repair.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;