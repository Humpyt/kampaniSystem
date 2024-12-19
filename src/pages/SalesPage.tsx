import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Card } from '../components/ui/card';
import { formatCurrency } from '../utils/formatCurrency';
import { DollarSign, ShoppingBag, Wrench, Package, Calendar, ChevronDown, ArrowUpRight, Search } from 'lucide-react';
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
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate, selectedType]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = 'http://localhost:3000/api/sales';
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
      
      // Calculate total sales
      const total = data.reduce((sum: number, sale: Sale) => sum + (sale.total_amount || 0), 0);
      setTotalSales(total);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const renderSaleDetails = (sale: Sale) => {
    if (!sale.details?.length) return null;

    switch (sale.sale_type) {
      case 'repair':
        return sale.details.map((item, index) => (
          <div key={index} className="text-sm text-gray-300">
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sales Overview</h1>
          <p className="text-gray-400">Monitor and analyze your sales performance</p>
        </div>
        <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl px-6 py-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 text-indigo-400" />
            <div>
              <p className="text-sm text-indigo-300">Total Sales</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalSales)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-gray-400 font-medium">Repairs</p>
                <span className="text-green-500 text-xs bg-green-900/30 px-2 py-1 rounded-full">+12.5%</span>
              </div>
              <p className="text-3xl font-bold text-white mt-2">
                {sales.filter(s => s.sale_type === 'repair').length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total repair orders</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-green-900/20 flex items-center justify-center group">
              <Wrench className="h-7 w-7 text-green-500 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-gray-400 font-medium">Retail Sales</p>
                <span className="text-purple-500 text-xs bg-purple-900/30 px-2 py-1 rounded-full">+8.3%</span>
              </div>
              <p className="text-3xl font-bold text-white mt-2">
                {sales.filter(s => s.sale_type === 'retail').length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Products sold</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-purple-900/20 flex items-center justify-center group">
              <ShoppingBag className="h-7 w-7 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-gray-400 font-medium">Pickups</p>
                <span className="text-orange-500 text-xs bg-orange-900/30 px-2 py-1 rounded-full">+15.7%</span>
              </div>
              <p className="text-3xl font-bold text-white mt-2">
                {sales.filter(s => s.sale_type === 'pickup').length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Orders picked up</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-orange-900/20 flex items-center justify-center group">
              <Package className="h-7 w-7 text-orange-500 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/50">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-medium text-white">Filter Sales</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
            <div className="relative">
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                className="w-full pl-12 pr-4 py-3 bg-gray-900/50 rounded-xl border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white"
                placeholderText="Select start date"
                dateFormat="MMM d, yyyy"
              />
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
            <div className="relative">
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                className="w-full pl-12 pr-4 py-3 bg-gray-900/50 rounded-xl border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white"
                placeholderText="Select end date"
                dateFormat="MMM d, yyyy"
              />
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Sale Type</label>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-900/50 rounded-xl border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white appearance-none"
              >
                <option value="all">All Types</option>
                <option value="repair">Repairs</option>
                <option value="retail">Retail</option>
                <option value="pickup">Pickups</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-medium text-white">Sales History</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No sales found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Date</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Customer</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Type</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Details</th>
                    <th className="text-right py-4 px-4 text-gray-400 font-medium">Amount</th>
                    <th className="text-right py-4 px-4 text-gray-400 font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, index) => (
                    <tr 
                      key={sale.id}
                      className={`
                        border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors
                        ${index % 2 === 0 ? 'bg-gray-900/20' : ''}
                      `}
                    >
                      <td className="py-4 px-4 text-gray-300">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        {sale.customer_name || 'Walk-in'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`
                          inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                          ${sale.sale_type === 'repair' ? 'bg-green-900/20 text-green-400' : ''}
                          ${sale.sale_type === 'retail' ? 'bg-purple-900/20 text-purple-400' : ''}
                          ${sale.sale_type === 'pickup' ? 'bg-orange-900/20 text-orange-400' : ''}
                        `}>
                          {sale.sale_type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {renderSaleDetails(sale)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-white">
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300">
                          {sale.payment_method}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
