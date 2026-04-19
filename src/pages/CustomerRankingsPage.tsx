import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Crown, Medal, Search, Users } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { formatCurrency } from '../utils/formatCurrency';

type TabType = 'spent' | 'orders' | 'loyalty';

interface CustomerRankings {
  bySpent: {
    id: string;
    name: string;
    phone: string;
    totalSpent: number;
    orderCount: number;
    lastVisit: string;
  }[];
  byOrders: {
    id: string;
    name: string;
    phone: string;
    totalSpent: number;
    orderCount: number;
    lastVisit: string;
  }[];
  byLoyalty: {
    id: string;
    name: string;
    phone: string;
    loyaltyPoints: number;
    totalSpent: number;
  }[];
}

export default function CustomerRankingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('spent');
  const [searchQuery, setSearchQuery] = useState('');
  const [rankings, setRankings] = useState<CustomerRankings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch('/api/analytics/customer-rankings');
        if (response.ok) {
          const data = await response.json();
          setRankings(data);
        }
      } catch (error) {
        console.error('Error fetching customer rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const filteredData = useMemo(() => {
    if (!rankings) return { podium: [], table: [] };

    let data: any[] = [];
    switch (activeTab) {
      case 'spent':
        data = rankings.bySpent;
        break;
      case 'orders':
        data = rankings.byOrders;
        break;
      case 'loyalty':
        data = rankings.byLoyalty;
        break;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? data.filter((c) => c.name.toLowerCase().includes(query))
      : data;

    return {
      podium: filtered.slice(0, 3),
      table: filtered.slice(3),
    };
  }, [rankings, activeTab, searchQuery]);

  const tabs = [
    { id: 'spent' as TabType, label: 'By Spending' },
    { id: 'orders' as TabType, label: 'By Orders' },
    { id: 'loyalty' as TabType, label: 'By Loyalty' },
  ];

  const showPodium = activeTab !== 'loyalty';

  const getPodiumCard = (customer: any, rank: number) => {
    const sizeClass =
      rank === 1
        ? 'w-48'
        : rank === 2
        ? 'w-40'
        : 'w-36';

    const gradientClass =
      rank === 1
        ? 'from-amber-500 to-amber-600'
        : rank === 2
        ? 'from-gray-400 to-gray-500'
        : 'from-amber-700 to-amber-800';

    const IconComponent = rank === 1 ? Crown : rank === 2 ? Medal : Medal;
    const iconColor = rank === 1 ? 'text-amber-200' : rank === 2 ? 'text-gray-200' : 'text-amber-200';

    const valueDisplay =
      activeTab === 'spent'
        ? formatCurrency(customer.totalSpent)
        : `${customer.orderCount} orders`;

    return (
      <div
        key={customer.id}
        className={`${sizeClass} flex flex-col items-center p-4 rounded-xl bg-gradient-to-b ${gradientClass} shadow-lg`}
      >
        <div className="relative">
          <IconComponent className={`h-8 w-8 ${iconColor} ${rank === 1 ? '' : 'opacity-70'}`} />
          {rank === 1 && (
            <Crown className="absolute -top-2 -right-2 h-4 w-4 text-amber-200" />
          )}
        </div>
        <span className="text-xs font-bold text-white/80 mt-1">
          {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
        </span>
        <h3 className="font-semibold text-white text-center mt-2 text-sm leading-tight">
          {customer.name}
        </h3>
        <p className="text-xs text-white/70 mt-1">{customer.phone}</p>
        <p className="text-lg font-bold text-white mt-2">{valueDisplay}</p>
      </div>
    );
  };

  const renderTableRow = (customer: any, index: number, startRank: number) => {
    const rank = startRank + index;
    const valueDisplay =
      activeTab === 'spent'
        ? formatCurrency(customer.totalSpent)
        : activeTab === 'orders'
        ? `${customer.orderCount} orders`
        : `${customer.loyaltyPoints} pts`;

    const columns = [
      { label: '#', value: rank },
      { label: 'Name', value: customer.name },
      { label: 'Phone', value: customer.phone },
      ...(activeTab !== 'loyalty'
        ? [
            { label: activeTab === 'spent' ? 'Total Spent' : 'Orders', value: valueDisplay },
            { label: activeTab === 'spent' ? 'Orders' : 'Total Spent', value: formatCurrency(customer.totalSpent) },
            { label: 'Last Visit', value: customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'N/A' },
          ]
        : [
            { label: 'Loyalty Points', value: valueDisplay },
            { label: 'Total Spent', value: formatCurrency(customer.totalSpent) },
          ]),
    ];

    return (
      <tr
        key={customer.id}
        className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
      >
        {columns.map((col, i) => (
          <td key={i} className="px-4 py-3 text-sm">
            {i === 0 ? (
              <span className="flex items-center gap-2">
                {col.value <= 3 ? (
                  <Trophy className="h-4 w-4 text-amber-500" />
                ) : null}
                {col.value}
              </span>
            ) : (
              <span className={col.label === 'Name' ? 'font-medium text-white' : 'text-gray-400'}>
                {col.value}
              </span>
            )}
          </td>
        ))}
      </tr>
    );
  };

  const tableHeaders =
    activeTab !== 'loyalty'
      ? activeTab === 'spent'
        ? ['Rank', 'Name', 'Phone', 'Total Spent', 'Orders', 'Last Visit']
        : ['Rank', 'Name', 'Phone', 'Orders', 'Total Spent', 'Last Visit']
      : ['Rank', 'Name', 'Phone', 'Loyalty Points', 'Total Spent'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-700 rounded" />
          <div className="h-4 w-48 bg-gray-700 rounded" />
          <div className="grid grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="h-7 w-7 text-indigo-400" />
              Customer Rankings
            </h1>
            <p className="text-sm text-gray-400 mt-1">Top customers by spending, orders, and loyalty</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Podium Display */}
      {showPodium && filteredData.podium.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-center items-end gap-4 py-6">
            {filteredData.podium.length > 2 && (
              <div className="transform translate-y-4">
                {getPodiumCard(filteredData.podium[2], 3)}
              </div>
            )}
            {filteredData.podium.length > 0 && (
              <div className="transform -translate-y-2">
                {getPodiumCard(filteredData.podium[0], 1)}
              </div>
            )}
            {filteredData.podium.length > 1 && (
              <div className="transform translate-y-1">
                {getPodiumCard(filteredData.podium[1], 2)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 card-bevel rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900/50">
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.table.length > 0 ? (
                filteredData.table.map((customer, index) =>
                  renderTableRow(customer, index, 4)
                )
              ) : filteredData.podium.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No customers found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {filteredData.table.length > 0 && (
          <div className="px-4 py-3 bg-gray-900/30 border-t border-gray-700/50">
            <p className="text-sm text-gray-500">
              Showing {filteredData.table.length} more customers
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
