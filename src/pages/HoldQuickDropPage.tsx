import React from 'react';
import { Search, Package, DollarSign, Calendar, Clock, User, Plus, Filter, Download } from 'lucide-react';

interface HoldItem {
  id: string;
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  holdDate: string;
  expectedCompletion: string;
  status: 'pending' | 'in-progress' | 'ready';
}

const HoldQuickDropPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Header Section */}
        <div className="col-span-12 card-bevel p-6 bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-200">Hold & Quick Drop</h1>
              <p className="text-gray-400 text-sm mt-1">Manage items on hold and quick drop requests</p>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus className="h-4 w-4" />
                <span>Add Hold</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 bg-gray-800/50 p-4 rounded-lg">
              <Package className="h-8 w-8 text-indigo-400" />
              <div>
                <p className="text-sm text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-white">15</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-gray-800/50 p-4 rounded-lg">
              <Clock className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Due Today</p>
                <p className="text-2xl font-bold text-white">5</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-gray-800/50 p-4 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Quick Drops</p>
                <p className="text-2xl font-bold text-white">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="col-span-12 card-bevel p-6 bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search holds by customer, item, or date..."
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 rounded-xl border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-gray-400"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-3 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Items Table */}
        <div className="col-span-12 card-bevel p-6 bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            <table className="w-full">
              <thead className="bg-gray-800/80 backdrop-blur-sm sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Item</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Hold Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Expected</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {/* Sample row - map through actual data */}
                <tr className="hover:bg-gray-800/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-900/50 flex items-center justify-center">
                        <User className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-200">James Wilson</div>
                        <div className="text-xs text-gray-400">555-0123</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">2x Dress Shoes - Polish & Repair</td>
                  <td className="px-6 py-4 text-sm text-gray-300">Jan 18, 2025</td>
                  <td className="px-6 py-4 text-sm text-gray-300">Jan 20, 2025</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-400">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoldQuickDropPage;
