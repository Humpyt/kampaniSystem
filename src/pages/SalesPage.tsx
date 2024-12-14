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
import { DollarSign, ShoppingBag, Wrench, Package, Calendar } from 'lucide-react';
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
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Overview</h1>
          <p className="text-gray-400">Monitor and analyze your sales performance</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2 text-gray-400">
            <DollarSign className="h-5 w-5" />
            <span>Total Sales: {formatCurrency(totalSales)}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card-bevel p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Repairs</p>
              <p className="text-xl font-bold text-white mt-1">
                {sales.filter(s => s.sale_type === 'repair').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-900/20 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>

        <div className="card-bevel p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Retail Sales</p>
              <p className="text-xl font-bold text-white mt-1">
                {sales.filter(s => s.sale_type === 'retail').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-900/20 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="card-bevel p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Pickups</p>
              <p className="text-xl font-bold text-white mt-1">
                {sales.filter(s => s.sale_type === 'pickup').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-900/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="card-bevel p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
            <div className="relative">
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white"
                placeholderText="Select start date"
                dateFormat="MMM d, yyyy"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
            <div className="relative">
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white"
                placeholderText="Select end date"
                dateFormat="MMM d, yyyy"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Sale Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-4 pr-8 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white"
            >
              <option value="all">All Types</option>
              <option value="repair">Repairs</option>
              <option value="retail">Retail</option>
              <option value="pickup">Pickups</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card-bevel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-400 font-medium">Date</TableHead>
              <TableHead className="text-gray-400 font-medium">Customer</TableHead>
              <TableHead className="text-gray-400 font-medium">Type</TableHead>
              <TableHead className="text-gray-400 font-medium">Details</TableHead>
              <TableHead className="text-gray-400 font-medium text-right">Amount</TableHead>
              <TableHead className="text-gray-400 font-medium">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                  No sales found for the selected criteria
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-gray-800/50">
                  <TableCell className="text-gray-300">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-white">
                    {sale.customer_name || 'Walk-in'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium
                      ${sale.sale_type === 'repair' ? 'bg-green-900/20 text-green-500' : 
                        sale.sale_type === 'retail' ? 'bg-purple-900/20 text-purple-500' : 
                        'bg-orange-900/20 text-orange-500'}`}>
                      {sale.sale_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {renderSaleDetails(sale)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-white">
                    {formatCurrency(sale.total_amount)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-800 text-gray-300">
                      {sale.payment_method}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
