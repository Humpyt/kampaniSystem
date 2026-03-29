import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Filter, Search, Package, DollarSign, CheckCircle, Receipt, TrendingUp, TrendingDown, Wallet, Minus, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { useOperation } from '../contexts/OperationContext';
import { useAuthStore } from '../store/authStore';
import { useExpenses } from '../contexts/ExpenseContext';
import { getProfitSummary, ProfitSummary } from '../api/expenses';
import { format } from 'date-fns';

// Helper function to safely format dates
const safeFormat = (date: string | Date | null | undefined, formatStr: string) => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';
    return format(dateObj, formatStr);
  } catch {
    return 'N/A';
  }
};

export default function OperationPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [timeFilter, setTimeFilter] = useState<'today' | 'tomorrow' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { operations } = useOperation();
  const { expenses, fetchExpenses, fetchAnalytics } = useExpenses();
  const [profitSummary, setProfitSummary] = useState<ProfitSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'operations' | 'expenses'>('operations');

  // Fetch profit summary
  useEffect(() => {
    const fetchProfit = async () => {
      try {
        const data = await getProfitSummary();
        setProfitSummary(data);
      } catch (error) {
        console.error('Failed to fetch profit summary:', error);
      }
    };
    fetchProfit();
  }, []);

  // Fetch expenses when expenses tab is active
  useEffect(() => {
    if (activeTab === 'expenses') {
      fetchExpenses();
      fetchAnalytics();
    }
  }, [activeTab, fetchExpenses, fetchAnalytics]);

  // Memoize workItems to avoid recomputing on every render
  const workItems = useMemo(() => operations.map(operation => ({
    id: operation.id,
    ticketNo: `TKT-${operation.id.slice(-6).toUpperCase()}`,
    custNo: operation.customer?.id ? `CST-${operation.customer.id.slice(-6).toUpperCase()}` : 'N/A',
    name: operation.customer?.name || 'Unknown',
    pair: operation.shoes.length,
    createDate: safeFormat(operation.createdAt, 'MM/dd/yyyy'),
    createTime: safeFormat(operation.createdAt, 'hh:mm a'),
    readyDate: safeFormat(operation.updatedAt, 'MM/dd/yyyy'),
    readyTime: safeFormat(operation.updatedAt, 'hh:mm a'),
    amount: operation.totalAmount || 0,
    paid: operation.paidAmount || 0,
    balance: (operation.totalAmount || 0) - (operation.paidAmount || 0),
    discount: (operation as any).discount || 0,
    status: operation.status,
    isNoCharge: operation.isNoCharge || false,
    isDoOver: operation.isDoOver || false,
    isDelivery: operation.isDelivery || false,
    isPickup: operation.isPickup || false,
    createdBy: (operation as any).createdBy || null,
    staffName: (operation as any).staffName || null,
  })), [operations]);

  // Memoize filtered work items
  const filteredWorkItems = useMemo(() => workItems.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ticketNo.includes(searchQuery) ||
      item.custNo.includes(searchQuery);

    if (!matchesSearch) return false;

    const itemDate = new Date(item.createDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let matchesTimeFilter = true;
    switch (timeFilter) {
      case 'today':
        matchesTimeFilter = itemDate.toDateString() === today.toDateString();
        break;
      case 'tomorrow':
        matchesTimeFilter = itemDate.toDateString() === tomorrow.toDateString();
        break;
      case 'custom':
        if (customDate) {
          const filterDate = new Date(customDate);
          matchesTimeFilter = itemDate.toDateString() === filterDate.toDateString();
        }
        break;
      default:
        matchesTimeFilter = true;
    }

    if (!matchesTimeFilter) return false;

    // Staff can only see their own operations
    if (user?.role === 'staff' && item.createdBy !== user.id) {
      return false;
    }

    return true;
  }), [workItems, timeFilter, customDate, searchQuery, user]);

  // Memoize navigation handler
  const handleViewDetails = useCallback((operationId: string) => {
    navigate(`/operations/details/${operationId}`);
  }, [navigate]);

  // Memoize total value calculation
  const totalValue = useMemo(() =>
    filteredWorkItems.reduce((acc, item) => acc + item.amount, 0),
    [filteredWorkItems]
  );

  const getCategoryIcon = (category: string) => {
    if (category.includes('Supplies') || category.includes('Materials')) return <Package size={14} />;
    if (category.includes('Rent') || category.includes('Utilities')) return <Calendar size={14} />;
    if (category.includes('Marketing') || category.includes('Advertising')) return <TrendingUp size={14} />;
    if (category.includes('Salaries') || category.includes('Wages')) return <Wallet size={14} />;
    return <Receipt size={14} />;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations</h1>
          <p className="text-gray-400">Manage daily repair operations and workflow</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'operations'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={14} />
                Operations
              </div>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'expenses'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Receipt size={14} />
                Expenses
              </div>
            </button>
          </div>
          {activeTab === 'operations' && (
            <div className="flex items-center space-x-2 text-gray-400 bg-gray-800 px-3 py-2 rounded-lg">
              <Package className="h-4 w-4" />
              <span className="text-sm">{filteredWorkItems.length}</span>
              <DollarSign className="h-4 w-4 ml-2" />
              <span className="text-sm">{formatCurrency(totalValue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Total Sales */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-xl p-4 border border-indigo-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-300 text-xs font-medium flex items-center gap-1">
              <TrendingUp size={12} />
              TOTAL SALES
            </span>
            <Wallet size={16} className="text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(profitSummary?.totalSales || 0)}
          </p>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${(profitSummary?.salesTrend || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(profitSummary?.salesTrend || 0) >= 0 ? '+' : ''}{profitSummary?.salesTrend || 0}%
            </span>
            <span className="text-indigo-300/60 text-xs">vs last month</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-rose-900/50 to-rose-800/30 rounded-xl p-4 border border-rose-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-rose-300 text-xs font-medium flex items-center gap-1">
              <TrendingDown size={12} />
              TOTAL EXPENSES
            </span>
            <Wallet size={16} className="text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(profitSummary?.totalExpenses || 0)}
          </p>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${(profitSummary?.expenseTrend || 0) <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(profitSummary?.expenseTrend || 0) >= 0 ? '+' : ''}{profitSummary?.expenseTrend || 0}%
            </span>
            <span className="text-rose-300/60 text-xs">vs last month</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`bg-gradient-to-br rounded-xl p-4 border ${
          (profitSummary?.netProfit || 0) >= 0
            ? 'from-emerald-900/50 to-emerald-800/30 border-emerald-700/50'
            : 'from-rose-900/50 to-rose-800/30 border-rose-700/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium flex items-center gap-1 ${
              (profitSummary?.netProfit || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              <Minus size={12} />
              NET PROFIT
            </span>
            <Wallet size={16} className={(profitSummary?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
          </div>
          <p className={`text-2xl font-bold mb-1 ${
            (profitSummary?.netProfit || 0) >= 0 ? 'text-white' : 'text-rose-300'
          }`}>
            {formatCurrency(profitSummary?.netProfit || 0)}
          </p>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${(profitSummary?.profitTrend || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(profitSummary?.profitTrend || 0) >= 0 ? '+' : ''}{profitSummary?.profitTrend || 0}%
            </span>
            <span className="text-emerald-300/60 text-xs">vs last month</span>
          </div>
        </div>
      </div>

      {/* This Month Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Sales This Month</p>
          <p className="text-lg font-bold text-indigo-400">{formatCurrency(profitSummary?.salesThisMonth || 0)}</p>
        </div>
        <div className="text-center border-x border-gray-700">
          <p className="text-gray-400 text-xs mb-1">Expenses This Month</p>
          <p className="text-lg font-bold text-rose-400">{formatCurrency(profitSummary?.expensesThisMonth || 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Profit This Month</p>
          <p className={`text-lg font-bold ${(profitSummary?.profitThisMonth || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(profitSummary?.profitThisMonth || 0)}
          </p>
        </div>
      </div>

      {activeTab === 'expenses' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-200">All Expenses</h3>
          </div>
          <div className="max-h-[calc(100vh-380px)] overflow-y-auto">
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="text-gray-500 mb-2" size={32} />
                <p className="text-gray-400 text-sm">No expenses recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 hover:bg-gray-750/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          exp.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                          exp.status === 'overdue' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {getCategoryIcon(exp.category)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{exp.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{exp.category}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-500">
                              {format(new Date(exp.date), 'MMM d, yyyy')}
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="text-[10px] text-gray-500">
                              by {exp.createdByName || 'Unknown'}
                            </span>
                            {exp.vendor && (
                              <>
                                <span className="text-gray-600">•</span>
                                <span className="text-[10px] text-gray-500">{exp.vendor}</span>
                              </>
                            )}
                          </div>
                          {exp.notes && (
                            <p className="text-[10px] text-gray-500 mt-1 truncate max-w-xs">{exp.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm font-semibold text-white">{formatCurrency(exp.amount)}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          exp.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          exp.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {exp.status}
                        </span>
                        {exp.paymentMethod && (
                          <span className="text-[10px] text-gray-500">{exp.paymentMethod}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {activeTab === 'operations' && (
      <div className="card-bevel p-4 mb-6">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search operations..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <button
              className={`btn-bevel px-6 py-2 rounded-lg flex items-center ${
                timeFilter === 'today' ? 'accent-primary' : 'accent-secondary'
              }`}
              onClick={() => { setTimeFilter('today'); setCustomDate(''); }}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Today
            </button>
            <button
              className={`btn-bevel px-6 py-2 rounded-lg flex items-center ${
                timeFilter === 'tomorrow' ? 'accent-primary' : 'accent-secondary'
              }`}
              onClick={() => { setTimeFilter('tomorrow'); setCustomDate(''); }}
            >
              <Clock className="h-5 w-5 mr-2" />
              Tomorrow
            </button>
            <button
              className={`btn-bevel px-6 py-2 rounded-lg flex items-center ${
                timeFilter === 'all' ? 'accent-primary' : 'accent-secondary'
              }`}
              onClick={() => { setTimeFilter('all'); setCustomDate(''); }}
            >
              <Filter className="h-5 w-5 mr-2" />
              All
            </button>
            <div className="flex items-center space-x-2">
              <button
                className={`btn-bevel px-4 py-2 rounded-lg flex items-center ${
                  timeFilter === 'custom' ? 'accent-primary' : 'accent-secondary'
                }`}
                onClick={() => setTimeFilter('custom')}
              >
                <Calendar className="h-5 w-5 mr-2" />
                Date
              </button>
              {timeFilter === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Work Table */}
      <div className="card-bevel overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Ticket No</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Customer ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created By</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Name</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Pairs</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Ready By</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Amount</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Balance</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Flags</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Status</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredWorkItems.map((item, index) => (
              <tr 
                key={item.ticketNo} 
                className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {item.ticketNo}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {item.custNo}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {item.staffName || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-white">{item.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white text-sm">
                    {item.pair}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-300">{item.createDate}</div>
                  <div className="text-xs text-gray-500">{item.createTime}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-300">{item.readyDate}</div>
                  <div className="text-xs text-gray-500">{item.readyTime}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  {item.discount > 0 ? (
                    <div>
                      <div className="text-xs text-gray-400 line-through">
                        {formatCurrency(item.amount + item.discount)}
                      </div>
                      <div className="text-sm font-medium text-green-400">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="text-xs text-pink-400">
                        -{formatCurrency(item.discount)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-white">
                      {formatCurrency(item.amount)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {item.balance > 0 ? (
                    <div className="text-sm font-bold text-red-400">
                      {formatCurrency(item.balance)}
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-green-400">
                      Paid
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {item.isDelivery && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        Delivery
                      </span>
                    )}
                    {item.isPickup && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                        Pickup
                      </span>
                    )}
                    {item.isNoCharge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        No Charge
                      </span>
                    )}
                    {item.isDoOver && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Do Over
                      </span>
                    )}
                    {item.discount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                        Discount
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
                    ${item.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                    ${item.status === 'held' ? 'bg-purple-100 text-purple-800' : ''}
                    ${item.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {item.status.replace('_', ' ').charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    {item.isNoCharge && (
                      <span className="text-xs text-gray-400">No Charge</span>
                    )}
                    {item.isDoOver && (
                      <span className="text-xs text-gray-400">Do Over</span>
                    )}
                    {item.isDelivery && (
                      <span className="text-xs text-gray-400">Delivery</span>
                    )}
                    {item.isPickup && (
                      <span className="text-xs text-gray-400">Pickup</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      className="text-indigo-400 hover:text-indigo-300"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      View Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}