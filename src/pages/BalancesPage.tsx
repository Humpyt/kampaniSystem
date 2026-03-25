import React, { useState, useEffect } from 'react';
import { Printer, User, Phone, DollarSign, Calendar, Search, Filter, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { useOperation } from '../contexts/OperationContext';

interface BalanceRecord {
  id: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  } | null;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  createdAt: string;
  shoes: Array<{
    description: string;
    services: Array<{ name: string; price: number }>;
  }>;
}

export default function BalancesPage() {
  const { operations } = useOperation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Filter and process operations with balances
  const balanceRecords: BalanceRecord[] = operations
    .filter(op => {
      // Only include operations with partial or no payment
      const hasBalance = op.totalAmount > (op.paidAmount || 0);
      if (!hasBalance) return false;

      // Filter by status if selected
      if (statusFilter === 'pending' && op.paidAmount && op.paidAmount > 0) return false;
      if (statusFilter === 'partial' && (!op.paidAmount || op.paidAmount === 0)) return false;

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const customerName = op.customer?.name?.toLowerCase() || '';
        const customerPhone = op.customer?.phone?.includes(searchTerm) || '';
        const ticketId = op.id.toLowerCase().includes(searchLower);
        return customerName.includes(searchLower) || customerPhone || ticketId;
      }

      return true;
    })
    .map(op => ({
      id: op.id,
      customer: op.customer,
      totalAmount: op.totalAmount,
      paidAmount: op.paidAmount || 0,
      balance: op.totalAmount - (op.paidAmount || 0),
      status: op.status,
      createdAt: op.createdAt,
      shoes: (op as any).shoes || []
    }))
    .sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest':
          return b.balance - a.balance;
        case 'lowest':
          return a.balance - b.balance;
        default:
          return 0;
      }
    });

  // Calculate totals
  const totalBalance = balanceRecords.reduce((sum, record) => sum + record.balance, 0);
  const totalOriginal = balanceRecords.reduce((sum, record) => sum + record.totalAmount, 0);
  const totalPaid = balanceRecords.reduce((sum, record) => sum + record.paidAmount, 0);
  const recordCount = balanceRecords.length;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-UG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Customer Balances</h1>
            <p className="text-gray-400">Track customers with outstanding payments</p>
          </div>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <Printer size={20} />
            Print Report
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Customers</p>
                <p className="text-2xl font-bold text-white">{recordCount}</p>
              </div>
              <div className="bg-blue-900/50 p-3 rounded-lg">
                <User className="text-blue-400" size={24} />
              </div>
            </div>
          </div>

          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Balance</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="bg-red-900/50 p-3 rounded-lg">
                <DollarSign className="text-red-400" size={24} />
              </div>
            </div>
          </div>

          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Original Amount</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalOriginal)}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <DollarSign className="text-gray-400" size={24} />
              </div>
            </div>
          </div>

          <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Amount Paid</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="bg-green-900/50 p-3 rounded-lg">
                <DollarSign className="text-green-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, phone, or ticket ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white appearance-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Unpaid Only</option>
                <option value="partial">Partial Payments</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>

            {/* Sort Order */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white appearance-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Balance</option>
                <option value="lowest">Lowest Balance</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden">
          {balanceRecords.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <User className="text-gray-400" size={40} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Balances Found</h3>
              <p className="text-gray-400">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'All customers have paid in full'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Ticket ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Original</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Paid</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Balance</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {balanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-750/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-300">
                        #{record.id.slice(-6)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <User className="text-gray-400 mr-2" size={16} />
                          <span className="text-sm text-white font-medium">
                            {record.customer?.name || 'Walk-in'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Phone className="text-gray-400 mr-2" size={16} />
                          <span className="text-sm text-gray-300">
                            {record.customer?.phone || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Calendar className="text-gray-400 mr-2" size={16} />
                          <span className="text-sm text-gray-300">
                            {formatDate(record.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gray-300">
                          {formatCurrency(record.totalAmount)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-green-400">
                          {formatCurrency(record.paidAmount)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-bold text-red-400">
                          {formatCurrency(record.balance)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.paidAmount === 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400">
                            Unpaid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400">
                            Partial
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-850 border-t-2 border-gray-700">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-white">
                      Total ({recordCount} records)
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-white">
                      {formatCurrency(totalOriginal)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-400">
                      {formatCurrency(totalPaid)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-red-400">
                      {formatCurrency(totalBalance)}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              background: white !important;
            }
            .card-bevel {
              box-shadow: none !important;
              border: 1px solid #ddd !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
