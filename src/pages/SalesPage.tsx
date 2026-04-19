import React, { useState, useEffect, useMemo } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { formatCurrency } from '../utils/formatCurrency';
import { DollarSign, ShoppingBag, Wrench, Package, Calendar, Search, TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Sale {
  id: string;
  customer_name: string | null;
  sale_type: 'repair' | 'retail' | 'pickup';
  total_amount: number;
  payment_method: string;
  created_at: string;
  details: Array<{
    category?: string;
    service_name?: string;
    name?: string;
    price: number;
    quantity?: number;
  }>;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate, selectedType]);

  // Listen for drop-completed event to refresh sales data
  useEffect(() => {
    const handleDropCompleted = (e: CustomEvent) => {
      if (e.detail?.timing === 'prepay') {
        fetchSales();
      }
    };
    window.addEventListener('drop-completed', handleDropCompleted as EventListener);
    return () => window.removeEventListener('drop-completed', handleDropCompleted as EventListener);
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = API_ENDPOINTS.sales;
      const params = new URLSearchParams();

      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }
      if (selectedType !== 'all') {
        params.append('saleType', selectedType);
      }

      const queryString = params.toString();
      if (queryString) {
        url += '?' + queryString;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid sales data received');
      }

      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  // Compute analytics
  const analytics = useMemo(() => {
    const repairSales = sales.filter(s => s.sale_type === 'repair');
    const retailSales = sales.filter(s => s.sale_type === 'retail');
    const pickupSales = sales.filter(s => s.sale_type === 'pickup');

    const totalAmount = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const repairAmount = repairSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const retailAmount = retailSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const pickupAmount = pickupSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

    // This month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthSales = sales.filter(s => new Date(s.created_at) >= startOfMonth);
    const thisMonthTotal = thisMonthSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

    return {
      count: sales.length,
      repairCount: repairSales.length,
      retailCount: retailSales.length,
      pickupCount: pickupSales.length,
      totalAmount,
      repairAmount,
      retailAmount,
      pickupAmount,
      thisMonthTotal,
    };
  }, [sales]);

  const renderSaleDetails = (sale: Sale) => {
    if (!sale.details?.length) return null;

    switch (sale.sale_type) {
      case 'repair':
        return sale.details.map((item, index) => (
          <div key={index} className="text-sm text-gray-300">
            {item.name && (
              <div>
                {item.name} x{item.quantity || 1} @ {formatCurrency(item.price)}
              </div>
            )}
            {item.category && <div>{item.category}</div>}
            {item.service_name && (
              <div className="ml-4 text-gray-400">
                - {item.service_name}: {formatCurrency(item.price)}
              </div>
            )}
          </div>
        ));

      case 'retail':
        return sale.details.map((item, index) => (
          <div key={index} className="text-sm text-gray-300">
            {item.name} x{item.quantity} @ {formatCurrency(item.price)}
          </div>
        ));

      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 text-red-400">
          <p className="font-medium">Error loading sales data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales</h1>
          <p className="text-gray-400">Monitor and analyze your sales performance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sale Type Tab Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('repair')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedType === 'repair'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wrench size={14} />
                Repairs
              </div>
            </button>
            <button
              onClick={() => setSelectedType('retail')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedType === 'retail'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={14} />
                Retail
              </div>
            </button>
          </div>
          {/* Total Display */}
          <div className="flex items-center space-x-2 text-gray-400 bg-gray-800 px-3 py-2 rounded-lg">
            <Package className="h-4 w-4" />
            <span className="text-sm">{analytics.count}</span>
            <DollarSign className="h-4 w-4 ml-2" />
            <span className="text-sm">{formatCurrency(analytics.totalAmount)}</span>
          </div>
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
            <DollarSign size={16} className="text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(analytics.totalAmount)}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-indigo-300">{analytics.count} transactions</span>
          </div>
        </div>

        {/* Repair Sales */}
        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-4 border border-green-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-300 text-xs font-medium flex items-center gap-1">
              <Wrench size={12} />
              REPAIR SALES
            </span>
            <Wrench size={16} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(analytics.repairAmount)}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-green-300">{analytics.repairCount} repairs</span>
          </div>
        </div>

        {/* Retail Sales */}
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-4 border border-purple-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 text-xs font-medium flex items-center gap-1">
              <ShoppingBag size={12} />
              RETAIL SALES
            </span>
            <ShoppingBag size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(analytics.retailAmount)}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-purple-300">{analytics.retailCount} items</span>
          </div>
        </div>
      </div>

      {/* This Month Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Sales This Month</p>
          <p className="text-lg font-bold text-indigo-400">{formatCurrency(analytics.thisMonthTotal)}</p>
        </div>
        <div className="text-center border-x border-gray-700">
          <p className="text-gray-400 text-xs mb-1">Repair Revenue</p>
          <p className="text-lg font-bold text-green-400">{formatCurrency(analytics.repairAmount)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Retail Revenue</p>
          <p className="text-lg font-bold text-purple-400">{formatCurrency(analytics.retailAmount)}</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar size={14} />
          <span>Filter by date:</span>
        </div>
        <div className="flex items-center gap-2">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start date"
            className="w-32 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            dateFormat="MMM d, yyyy"
          />
          <span className="text-gray-500">-</span>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate || undefined}
            placeholderText="End date"
            className="w-32 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            dateFormat="MMM d, yyyy"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(null); setEndDate(null); }}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sales Table */}
      <div className="card-bevel overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-200">Sales History</h2>
        </div>
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <table className="w-full">
            <thead className="bg-gray-800/80 backdrop-blur-sm sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Details</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Amount</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Loading...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No sales found for the selected period
                  </td>
                </tr>
              ) : (
                sales.map((sale, index) => (
                  <tr
                    key={sale.id}
                    className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {sale.customer_name || 'Walk-in'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${sale.sale_type === 'repair' ? 'bg-green-900/20 text-green-400' : ''}
                        ${sale.sale_type === 'retail' ? 'bg-purple-900/20 text-purple-400' : ''}
                        ${sale.sale_type === 'pickup' ? 'bg-orange-900/20 text-orange-400' : ''}
                      `}>
                        {sale.sale_type === 'retail' ? 'product' : sale.sale_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {renderSaleDetails(sale)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-200">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300">
                        {sale.payment_method}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
