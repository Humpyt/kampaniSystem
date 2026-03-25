import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Filter, Search, Package, DollarSign, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { useOperation } from '../contexts/OperationContext';
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
  const [timeFilter, setTimeFilter] = useState<'today' | 'tomorrow' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const { operations } = useOperation();

  // Convert operations to work items
  const workItems = operations.map(operation => ({
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
    discount: (operation as any).discount || 0,
    status: operation.status,
    isNoCharge: operation.isNoCharge || false,
    isDoOver: operation.isDoOver || false,
    isDelivery: operation.isDelivery || false,
    isPickup: operation.isPickup || false,
  }));

  // Filter work items based on time filter and search query
  const filteredWorkItems = workItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ticketNo.includes(searchQuery) ||
      item.custNo.includes(searchQuery);

    if (!matchesSearch) return false;

    const itemDate = new Date(item.createDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (timeFilter) {
      case 'today':
        return itemDate.toDateString() === today.toDateString();
      case 'tomorrow':
        return itemDate.toDateString() === tomorrow.toDateString();
      default:
        return true;
    }
  });

  const handleViewDetails = (operationId: string) => {
    // Navigate to the operation details page
    navigate(`/operations/details/${operationId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations</h1>
          <p className="text-gray-400">Manage daily repair operations and workflow</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2 text-gray-400">
            <Package className="h-5 w-5" />
            <span>Total Items: {filteredWorkItems.length}</span>
            <DollarSign className="h-5 w-5 ml-4" />
            <span>Value: {formatCurrency(filteredWorkItems.reduce((acc, item) => acc + item.amount, 0))}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
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
              onClick={() => setTimeFilter('today')}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Today
            </button>
            <button 
              className={`btn-bevel px-6 py-2 rounded-lg flex items-center ${
                timeFilter === 'tomorrow' ? 'accent-primary' : 'accent-secondary'
              }`}
              onClick={() => setTimeFilter('tomorrow')}
            >
              <Clock className="h-5 w-5 mr-2" />
              Tomorrow
            </button>
            <button 
              className={`btn-bevel px-6 py-2 rounded-lg flex items-center ${
                timeFilter === 'all' ? 'accent-primary' : 'accent-secondary'
              }`}
              onClick={() => setTimeFilter('all')}
            >
              <Filter className="h-5 w-5 mr-2" />
              All
            </button>
          </div>
        </div>
      </div>

      {/* Work Table */}
      <div className="card-bevel overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Ticket No</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Customer ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Name</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Pairs</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Ready By</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Amount</th>
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