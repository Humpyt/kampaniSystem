import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Filter, Search, Package, DollarSign, CheckCircle, Receipt, TrendingUp, TrendingDown, Wallet, Minus, ArrowRightLeft, Printer, FileDown, X, ChevronLeft, ChevronRight, Save, Archive, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { useOperation } from '../contexts/OperationContext';
import { useAuthStore } from '../store/authStore';
import { useExpenses } from '../contexts/ExpenseContext';
import { getProfitSummary, ProfitSummary, getDailyBalance, DailyBalance, getBalanceArchives, getMonthArchives, getBalanceArchive, saveBalanceArchive, deleteBalanceArchive, BalanceArchive } from '../api/expenses';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

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
  const isAdmin = user?.role === 'admin';
  const [timeFilter, setTimeFilter] = useState<'today' | 'tomorrow' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { operations } = useOperation();
  const { expenses, fetchExpenses, fetchAnalytics } = useExpenses();
  const [profitSummary, setProfitSummary] = useState<ProfitSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'operations' | 'expenses'>('operations');
  const [balanceSheetOpen, setBalanceSheetOpen] = useState(false);
  const [balanceSheetDate, setBalanceSheetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyBalance, setDailyBalance] = useState<DailyBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [archives, setArchives] = useState<BalanceArchive[]>([]);
  const [archivedDates, setArchivedDates] = useState<Set<string>>(new Set());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isFromArchive, setIsFromArchive] = useState(false);
  const balanceRef = useRef<HTMLDivElement>(null);

  // Fetch balance sheet data
  const fetchBalanceSheet = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const data = await getDailyBalance(balanceSheetDate);
      setDailyBalance(data);
    } catch (error) {
      console.error('Failed to fetch balance sheet:', error);
    } finally {
      setBalanceLoading(false);
    }
  }, [balanceSheetDate]);

  // Fetch archives when modal opens
  useEffect(() => {
    if (balanceSheetOpen) {
      fetchBalanceSheet();
      fetchArchivesList();
      fetchMonthArchives(calendarMonth);
    }
  }, [balanceSheetOpen]);

  // Fetch archives list
  const fetchArchivesList = async () => {
    try {
      const data = await getBalanceArchives();
      setArchives(data);
    } catch (error) {
      console.error('Failed to fetch archives:', error);
    }
  };

  // Fetch archived dates for calendar month
  const fetchMonthArchives = async (month: Date) => {
    try {
      const year = month.getFullYear();
      const monthNum = month.getMonth() + 1;
      const data = await getMonthArchives(year, monthNum);
      setArchivedDates(new Set(data.map(d => d.date)));
    } catch (error) {
      console.error('Failed to fetch month archives:', error);
    }
  };

  // Handle archive save
  const handleSaveArchive = async () => {
    if (!dailyBalance) return;
    try {
      await saveBalanceArchive(balanceSheetDate, dailyBalance);
      await fetchArchivesList();
      await fetchMonthArchives(calendarMonth);
      alert('Balance sheet saved to archive!');
    } catch (error) {
      console.error('Failed to save archive:', error);
      alert('Failed to save archive');
    }
  };

  // Handle archive delete
  const handleDeleteArchive = async () => {
    if (!confirm('Delete this archived balance sheet?')) return;
    try {
      await deleteBalanceArchive(balanceSheetDate);
      await fetchArchivesList();
      await fetchMonthArchives(calendarMonth);
      setIsFromArchive(false);
    } catch (error) {
      console.error('Failed to delete archive:', error);
    }
  };

  // Handle calendar date click
  const handleCalendarDateClick = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setBalanceSheetDate(dateStr);
    setBalanceLoading(true);
    setIsFromArchive(archivedDates.has(dateStr));
    try {
      if (archivedDates.has(dateStr)) {
        const data = await getBalanceArchive(dateStr);
        setDailyBalance(data);
      } else {
        const data = await getDailyBalance(dateStr);
        setDailyBalance(data);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Navigate calendar month
  const handlePrevMonth = () => {
    const newMonth = subMonths(calendarMonth, 1);
    setCalendarMonth(newMonth);
    fetchMonthArchives(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(calendarMonth, 1);
    setCalendarMonth(newMonth);
    fetchMonthArchives(newMonth);
  };

  useEffect(() => {
    if (balanceSheetOpen) {
      fetchBalanceSheet();
    }
  }, [balanceSheetOpen, fetchBalanceSheet]);

  // Print balance sheet
  const handlePrint = () => {
    const printContent = balanceRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Daily Balance Sheet</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { font-size: 24px; margin-bottom: 5px; }
      .date { color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background: #f5f5f5; }
      .total-row { font-weight: bold; background: #f9f9f9; }
      .cash-at-hand { background: #e8f5e9; font-weight: bold; }
      .positive { color: green; }
      .negative { color: red; }
      @media print { body { padding: 0; } }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  // Download as PDF (simple approach using print)
  const handleDownloadPdf = () => {
    handlePrint();
  };

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
          {/* Balance Sheet Button */}
          <button
            onClick={() => setBalanceSheetOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Wallet size={16} />
            Balance Sheet
          </button>
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
        <div className="card-bevel overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Staff</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Vendor</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Amount</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No expenses recorded yet
                  </td>
                </tr>
              ) : (
                expenses.map((exp, index) => (
                  <tr
                    key={exp.id}
                    className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300">{format(new Date(exp.date), 'MMM d, yyyy')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">{exp.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${
                          exp.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                          exp.status === 'overdue' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {getCategoryIcon(exp.category)}
                        </div>
                        <span className="text-sm text-gray-300">{exp.category.split('&')[0].trim()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300">{exp.createdByName || 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400">{exp.vendor || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-white">{formatCurrency(exp.amount)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        exp.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        exp.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{exp.paymentMethod || '-'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
      {activeTab === 'operations' && (
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
      )}

      {/* Balance Sheet Modal */}
      {balanceSheetOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Daily Balance Sheet</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="date"
                      value={balanceSheetDate}
                      onChange={(e) => { setBalanceSheetDate(e.target.value); setIsFromArchive(false); }}
                      className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    />
                    <button
                      onClick={fetchBalanceSheet}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
                    >
                      Load
                    </button>
                    {isFromArchive && (
                      <span className="px-2 py-1 bg-emerald-600/20 text-emerald-400 text-xs rounded flex items-center gap-1">
                        <Archive size={12} /> From Archive
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={handleSaveArchive}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm"
                      title="Save to Archive"
                    >
                      <Save size={16} />
                      Save
                    </button>
                    {isFromArchive && (
                      <button
                        onClick={handleDeleteArchive}
                        className="flex items-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm"
                        title="Delete Archive"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                >
                  <Printer size={16} />
                  Print
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                >
                  <FileDown size={16} />
                  PDF
                </button>
                <button
                  onClick={() => setBalanceSheetOpen(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Calendar Sidebar */}
              <div className="w-72 border-r border-gray-700 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-700 rounded">
                    <ChevronLeft size={20} className="text-gray-400" />
                  </button>
                  <h3 className="text-sm font-semibold text-white">
                    {format(calendarMonth, 'MMMM yyyy')}
                  </h3>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-gray-700 rounded">
                    <ChevronRight size={20} className="text-gray-400" />
                  </button>
                </div>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-xs text-gray-500 font-medium py-1">{day}</div>
                  ))}
                  {eachDayOfInterval({ start: startOfMonth(calendarMonth), end: endOfMonth(calendarMonth) }).map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = dateStr === balanceSheetDate;
                    const hasArchive = archivedDates.has(dateStr);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleCalendarDateClick(day)}
                        className={`
                          relative p-1 text-xs rounded transition-all
                          ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-300'}
                          ${isToday && !isSelected ? 'border border-indigo-500' : ''}
                        `}
                      >
                        {format(day, 'd')}
                        {isAdmin && hasArchive && (
                          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Recent Archives */}
                {isAdmin && (
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Recent Archives</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {archives.slice(0, 10).map(archive => (
                        <button
                          key={archive.id}
                          onClick={() => {
                            setBalanceSheetDate(archive.date);
                            setIsFromArchive(true);
                            setBalanceLoading(true);
                            getBalanceArchive(archive.date).then(setDailyBalance).finally(() => setBalanceLoading(false));
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-gray-700 transition-colors ${
                            archive.date === balanceSheetDate ? 'bg-indigo-600/30 text-indigo-300' : 'text-gray-400'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{format(new Date(archive.date), 'MMM d, yyyy')}</span>
                            <span className="text-emerald-400">{formatCurrency(archive.cashAtHand)}</span>
                          </div>
                        </button>
                      ))}
                      {archives.length === 0 && (
                        <p className="text-xs text-gray-500 italic">No archives yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-6" ref={balanceRef}>
                {balanceLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : dailyBalance ? (
                  <div className="space-y-6">
                    {/* Date Header */}
                    <div className="text-center border-b border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold text-white">Balance Sheet</h3>
                      <p className="text-gray-400 text-sm">{format(new Date(dailyBalance.date), 'MMMM d, yyyy')}</p>
                    </div>

                    {/* Sales Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wide mb-3">Day's Sales</h4>
                      <div className="bg-gray-900/50 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b border-gray-700">
                              <td className="px-4 py-2 text-gray-300">Cash Sales</td>
                              <td className="px-4 py-2 text-right text-white font-medium">{formatCurrency(dailyBalance.sales.byMethod.cash)}</td>
                            </tr>
                            <tr className="border-b border-gray-700">
                              <td className="px-4 py-2 text-gray-300">Mobile Money</td>
                              <td className="px-4 py-2 text-right text-white font-medium">{formatCurrency(dailyBalance.sales.byMethod.mobileMoney)}</td>
                            </tr>
                            <tr className="border-b border-gray-700">
                              <td className="px-4 py-2 text-gray-300">Card Payments</td>
                              <td className="px-4 py-2 text-right text-white font-medium">{formatCurrency(dailyBalance.sales.byMethod.card)}</td>
                            </tr>
                            <tr className="border-b border-gray-700">
                              <td className="px-4 py-2 text-gray-300">Bank Transfer</td>
                              <td className="px-4 py-2 text-right text-white font-medium">{formatCurrency(dailyBalance.sales.byMethod.bankTransfer)}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 text-gray-300">Cheque</td>
                              <td className="px-4 py-2 text-right text-white font-medium">{formatCurrency(dailyBalance.sales.byMethod.cheque)}</td>
                            </tr>
                            <tr className="total-row border-t-2 border-gray-600">
                              <td className="px-4 py-2 text-white font-bold">Total Sales</td>
                              <td className="px-4 py-2 text-right text-white font-bold">{formatCurrency(dailyBalance.sales.total)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-rose-400 uppercase tracking-wide mb-3">Less: Expenses</h4>
                      <div className="bg-gray-900/50 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b border-gray-700">
                              <td className="px-4 py-2 text-gray-300">Cash Expenses</td>
                              <td className="px-4 py-2 text-right text-rose-400 font-medium">-{formatCurrency(dailyBalance.expenses.byMethod.cash)}</td>
                            </tr>
                            <tr className="border-b border-gray-700">
                              <td className="px-4 py-2 text-gray-300">Mobile Money Expenses</td>
                              <td className="px-4 py-2 text-right text-rose-400 font-medium">-{formatCurrency(dailyBalance.expenses.byMethod.mobileMoney)}</td>
                            </tr>
                            <tr className="border-b border-gray-700">
                              <td className="px-4 py-2 text-gray-300">Card Expenses</td>
                              <td className="px-4 py-2 text-right text-rose-400 font-medium">-{formatCurrency(dailyBalance.expenses.byMethod.card)}</td>
                            </tr>
                            <tr className="border-b border-gray-700">
                              <td className="px-4 py-2 text-gray-300">Bank Transfer Expenses</td>
                              <td className="px-4 py-2 text-right text-rose-400 font-medium">-{formatCurrency(dailyBalance.expenses.byMethod.bankTransfer)}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 text-gray-300">Cheque Expenses</td>
                              <td className="px-4 py-2 text-right text-rose-400 font-medium">-{formatCurrency(dailyBalance.expenses.byMethod.cheque)}</td>
                            </tr>
                            <tr className="total-row border-t-2 border-gray-600">
                              <td className="px-4 py-2 text-white font-bold">Total Expenses</td>
                              <td className="px-4 py-2 text-right text-rose-400 font-bold">-{formatCurrency(dailyBalance.expenses.total)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Expense Details Section */}
                    {dailyBalance.expenseDetails && dailyBalance.expenseDetails.length > 0 && (
                      <div>
                        <button
                          onClick={() => setShowExpenseDetails(!showExpenseDetails)}
                          className="flex items-center gap-2 text-sm font-semibold text-rose-400 uppercase tracking-wide mb-3 hover:text-rose-300"
                        >
                          <ChevronRight size={16} className={`transform transition-transform ${showExpenseDetails ? 'rotate-90' : ''}`} />
                          Expense Details ({dailyBalance.expenseDetails.length})
                        </button>
                        {showExpenseDetails && (
                          <div className="bg-gray-900/50 rounded-xl overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-700/50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-gray-400 font-medium">Title</th>
                                  <th className="px-3 py-2 text-left text-gray-400 font-medium">Category</th>
                                  <th className="px-3 py-2 text-left text-gray-400 font-medium">Staff</th>
                                  <th className="px-3 py-2 text-left text-gray-400 font-medium">Vendor</th>
                                  <th className="px-3 py-2 text-right text-gray-400 font-medium">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700">
                                {dailyBalance.expenseDetails.map((exp) => (
                                  <tr key={exp.id} className="hover:bg-gray-700/30">
                                    <td className="px-3 py-2 text-white">{exp.title}</td>
                                    <td className="px-3 py-2 text-gray-400">{exp.category.split('&')[0].trim()}</td>
                                    <td className="px-3 py-2 text-indigo-400">{exp.createdByName}</td>
                                    <td className="px-3 py-2 text-gray-400">{exp.vendor || '-'}</td>
                                    <td className="px-3 py-2 text-right text-rose-400 font-medium">{formatCurrency(exp.amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cash at Hand Section */}
                    <div>
                      <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Cash at Hand</h4>
                            <p className="text-xs text-gray-400 mt-1">Cash Sales minus Cash Expenses</p>
                          </div>
                          <p className={`text-2xl font-bold ${dailyBalance.balance.cashAtHand >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(dailyBalance.balance.cashAtHand)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-900/50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Net Balance</span>
                        <span className={`text-lg font-bold ${dailyBalance.netBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                          {formatCurrency(dailyBalance.netBalance)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Total Sales - Total Expenses</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    Select a date from the calendar or enter a date and click Load
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}