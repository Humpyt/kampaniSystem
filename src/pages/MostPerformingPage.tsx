import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, BarChart3, ArrowUpDown, Wrench, DollarSign, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  category: string;
  totalRevenue: number;
  orderCount: number;
}

interface CategoryBreakdown {
  category: string;
  totalRevenue: number;
  orderCount: number;
}

interface ServicePerformanceResponse {
  byRevenue: ServicePerformance[];
  byOrders: ServicePerformance[];
  categoryBreakdown: CategoryBreakdown[];
}

// Complete list of all 24 services with icons and colors
const ALL_SERVICES = [
  { name: 'Elastic', icon: '🔗', color: '#F59E0B' },
  { name: 'Glue', icon: '🧴', color: '#EF4444' },
  { name: 'Hardware', icon: '⚙️', color: '#8B5CF6' },
  { name: 'Heel', icon: '👠', color: '#3B82F6' },
  { name: 'Heel Fix', icon: '🔧', color: '#6366F1' },
  { name: 'Insoles', icon: '👣', color: '#14B8A6' },
  { name: 'Misc', icon: '📦', color: '#64748B' },
  { name: 'Pad', icon: '🛡️', color: '#22D3EE' },
  { name: 'Patches', icon: '🩹', color: '#EC4899' },
  { name: 'Rips', icon: '✂️', color: '#F97316' },
  { name: 'Sling', icon: '🔗', color: '#F59E0B' },
  { name: 'Stitch', icon: '🧵', color: '#A855F7' },
  { name: 'Straps', icon: '🎗️', color: '#EC4899' },
  { name: 'Stretch', icon: '📏', color: '#0EA5E9' },
  { name: 'Tassels', icon: '🎀', color: '#F472B6' },
  { name: 'Zipper', icon: '🤐', color: '#06B6D4' },
  { name: 'Clean', icon: '✨', color: '#10B981' },
  { name: 'Dye', icon: '🎨', color: '#8B5CF6' },
  { name: 'Waterproof', icon: '💧', color: '#0EA5E9' },
  { name: 'Shine', icon: '🌟', color: '#FACC15' },
  { name: 'Heels', icon: '👠', color: '#EC4899' },
  { name: 'Half Soles', icon: '👟', color: '#F97316' },
  { name: 'Sole Guard', icon: '🛡️', color: '#84CC16' },
  { name: 'Others', icon: '📋', color: '#6B7280' },
];

const SERVICE_INFO: Record<string, { icon: string; color: string }> = {};
ALL_SERVICES.forEach(s => {
  SERVICE_INFO[s.name] = { icon: s.icon, color: s.color };
});

type ViewMode = 'revenue' | 'orders';

export default function MostPerformingPage() {
  const [data, setData] = useState<ServicePerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('revenue');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/service-performance');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching service performance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Build complete service list with all 24 services, merging API data
  const allServices = useMemo(() => {
    const serviceMap = new Map<string, ServicePerformance>();

    // First, add all 24 services with zero values
    ALL_SERVICES.forEach(s => {
      serviceMap.set(s.name, {
        serviceId: s.name.toLowerCase().replace(/\s+/g, '-'),
        serviceName: s.name,
        category: s.name === 'Elastic' || s.name === 'Glue' || s.name === 'Hardware' ? 'Repair' :
                  s.name === 'Heel' || s.name === 'Heel Fix' || s.name === 'Heels' ? 'Heel' :
                  s.name === 'Insoles' || s.name === 'Pad' || s.name === 'Half Soles' || s.name === 'Sole Guard' ? 'Sole' :
                  s.name === 'Patches' || s.name === 'Rips' || s.name === 'Stitch' ? 'Stitching' :
                  s.name === 'Sling' || s.name === 'Straps' || s.name === 'Stretch' || s.name === 'Tassels' ? 'Straps' :
                  s.name === 'Zipper' ? 'Zipper' :
                  s.name === 'Clean' ? 'Cleaning' :
                  s.name === 'Dye' ? 'Dyeing' :
                  s.name === 'Waterproof' ? 'Waterproof' :
                  s.name === 'Shine' ? 'Shine' : 'Others',
        totalRevenue: 0,
        orderCount: 0,
      });
    });

    // Override with actual data from API
    if (data) {
      data.byRevenue.forEach(s => {
        if (serviceMap.has(s.serviceName)) {
          const existing = serviceMap.get(s.serviceName)!;
          serviceMap.set(s.serviceName, { ...s, category: existing.category });
        } else {
          serviceMap.set(s.serviceName, s);
        }
      });
    }

    return Array.from(serviceMap.values());
  }, [data]);

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let services = [...allServices];

    // Filter by search
    if (searchTerm) {
      services = services.filter(s =>
        s.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by revenue or orders
    if (viewMode === 'revenue') {
      services.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } else {
      services.sort((a, b) => b.orderCount - a.orderCount);
    }

    return services;
  }, [allServices, viewMode, searchTerm]);

  // Stats
  const totalRevenue = data?.byRevenue.reduce((sum, s) => sum + s.totalRevenue, 0) || 0;
  const totalOrders = data?.byOrders.reduce((sum, s) => sum + s.orderCount, 0) || 0;
  const totalServiceCount = allServices.filter(s => s.orderCount > 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-800 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-800 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Most Performing Services</h1>
        </div>
        <p className="text-gray-400 text-sm">Track service performance across all repair operations</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 rounded-xl p-5 border border-emerald-700/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-300/70 text-xs font-medium uppercase tracking-wider">Total Revenue</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl p-5 border border-blue-700/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-blue-300/70 text-xs font-medium uppercase tracking-wider">Total Orders</p>
              <p className="text-2xl font-bold text-white">{totalOrders.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl p-5 border border-purple-700/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-purple-300/70 text-xs font-medium uppercase tracking-wider">Active Services</p>
              <p className="text-2xl font-bold text-white">{totalServiceCount} / {ALL_SERVICES.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setViewMode('revenue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'revenue'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            By Revenue
          </button>
          <button
            onClick={() => setViewMode('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'orders'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            By Orders
          </button>
        </div>
      </div>

      {/* Services Table - Industrial List Style */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-380px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">Category</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-40">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">Performance Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No services found
                  </td>
                </tr>
              ) : (
                filteredServices.map((service, index) => {
                  const info = SERVICE_INFO[service.serviceName] || { icon: '🔧', color: '#6B7280' };
                  const maxValue = viewMode === 'revenue'
                    ? Math.max(...filteredServices.map(s => s.totalRevenue), 1)
                    : Math.max(...filteredServices.map(s => s.orderCount), 1);
                  const barWidth = viewMode === 'revenue'
                    ? (service.totalRevenue / maxValue) * 100
                    : (service.orderCount / maxValue) * 100;
                  const displayValue = viewMode === 'revenue'
                    ? formatCurrency(service.totalRevenue)
                    : service.orderCount.toLocaleString();

                  return (
                    <tr
                      key={service.serviceId}
                      className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750/50'} hover:bg-gray-700 transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${info.color}20` }}
                          >
                            {info.icon}
                          </div>
                          <span className="text-sm font-medium text-white">{service.serviceName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${info.color}20`,
                            color: info.color
                          }}
                        >
                          {service.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-white">{service.orderCount.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-emerald-400">{formatCurrency(service.totalRevenue)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${barWidth}%`,
                                backgroundColor: info.color,
                                boxShadow: `0 0 8px ${info.color}50`
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">{displayValue}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-700/50">
          <p className="text-xs text-gray-500">
            Showing {filteredServices.length} of {ALL_SERVICES.length} services
            {totalOrders > 0 && ` • ${totalOrders.toLocaleString()} total orders • ${formatCurrency(totalRevenue)} total revenue`}
          </p>
        </div>
      </div>

      {/* Category Breakdown - Compact Horizontal Bars */}
      <div className="mt-6 bg-gray-800/50 rounded-xl border border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Revenue by Category</h3>
        <div className="space-y-3">
          {data?.categoryBreakdown
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .map((category) => {
              const maxRevenue = data?.categoryBreakdown[0]?.totalRevenue || 1;
              const barWidth = (category.totalRevenue / maxRevenue) * 100;

              return (
                <div key={category.category} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-gray-300 truncate">{category.category}</div>
                  <div className="flex-1 h-5 bg-gray-700/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: '#6366F1',
                        minWidth: category.totalRevenue > 0 ? '40px' : '0'
                      }}
                    >
                      {category.totalRevenue > 0 && (
                        <span className="text-xs font-bold text-white">{formatCurrency(category.totalRevenue)}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-xs text-gray-400">{category.orderCount} orders</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
