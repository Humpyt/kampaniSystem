import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, Printer, ShoppingCart, Search, List, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SupplyItem {
  id: string;
  name: string;
  category: string;
  description: string;
  on_hand: number;
  min_stock: number;
  cost: number;
  unit: string;
  created_at?: string;
  updated_at?: string;
}

const categories = [
  'Buckles',
  'Cleaners',
  'Dowel Tubes',
  'Dye',
  'Elastics',
  'Glue & Thinner',
  'Heels',
  'Insoles - Pads & Sock Lining',
  'Leather & Rubber',
  'Nails',
  'Needles',
  'Rivets',
  'Sand Paper',
  'Shanks'
];

export default function SuppliesPage() {
  const [activeTab, setActiveTab] = useState<string>('Glue & Thinner');
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SupplyItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      console.log('Fetching items for category:', activeTab);
      const response = await fetch(`/api/supplies?category=${encodeURIComponent(activeTab)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Response:', data);
      const itemsData = Array.isArray(data) ? data : [];
      setItems(itemsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to fetch inventory items');
      toast.error('Failed to fetch inventory items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      {/* Header with Search */}
      <div className="flex flex-col space-y-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Supplies</h1>
            <p className="text-gray-400 mt-1">Manage inventory and stock levels</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search items..."
                className="w-64 px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-300"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
              <Plus className="h-4 w-4" />
              Add New Item
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card-bevel p-4 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-gray-400 text-sm">Total Items</div>
            <div className="text-2xl font-bold text-white mt-1">{items.length}</div>
          </div>
          <div className="card-bevel p-4 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-gray-400 text-sm">Low Stock Items</div>
            <div className="text-2xl font-bold text-red-400 mt-1">
              {items.filter(item => item.on_hand <= item.min_stock).length}
            </div>
          </div>
          <div className="card-bevel p-4 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-gray-400 text-sm">Total Value</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              ${items.reduce((sum, item) => sum + item.cost * item.on_hand, 0).toFixed(2)}
            </div>
          </div>
          <div className="card-bevel p-4 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-gray-400 text-sm">Categories</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">{categories.length}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar - Categories */}
        <div className="w-64 space-y-4">
          <div className="card-bevel p-4 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Categories</h2>
              <button className="p-1 hover:bg-gray-700 rounded">
                <List className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveTab(category)}
                  className={`w-full text-left p-2.5 rounded-lg text-sm transition-all
                    ${activeTab === category 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">{error}</div>
            </div>
          ) : (
            <div className="card-bevel bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-4 text-left text-gray-400 font-medium">Name</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Category</th>
                      <th className="p-4 text-left text-gray-400 font-medium">Description</th>
                      <th className="p-4 text-right text-gray-400 font-medium">On Hand</th>
                      <th className="p-4 text-right text-gray-400 font-medium">Min Stock</th>
                      <th className="p-4 text-right text-gray-400 font-medium">Cost</th>
                      <th className="p-4 text-right text-gray-400 font-medium">Unit</th>
                      <th className="p-4 text-center text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr 
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`border-b border-gray-700 text-gray-300 transition-all
                          ${selectedItem?.id === item.id 
                            ? 'bg-indigo-600/10 border-indigo-500/50' 
                            : 'hover:bg-gray-700'
                          }`}
                      >
                        <td className="p-4">{item.name}</td>
                        <td className="p-4">{item.category}</td>
                        <td className="p-4">{item.description}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-sm
                            ${item.on_hand <= item.min_stock 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-green-500/20 text-green-400'
                            }`}>
                            {item.on_hand}
                          </span>
                        </td>
                        <td className="p-4 text-right">{item.min_stock}</td>
                        <td className="p-4 text-right">${item.cost.toFixed(2)}</td>
                        <td className="p-4 text-right">{item.unit}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors">
                              <Edit2 className="h-4 w-4 text-gray-400" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors">
                              <Copy className="h-4 w-4 text-gray-400" />
                            </button>
                            <button className="p-1.5 hover:bg-red-900/50 rounded-lg transition-colors">
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="mt-4 flex items-center justify-between card-bevel p-4 bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="flex items-center space-x-2">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
                <Printer className="h-4 w-4" />
                Print List
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
                <List className="h-4 w-4" />
                Export
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}