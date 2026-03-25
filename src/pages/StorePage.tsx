import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  User,
  Package,
  AlertCircle,
  Home,
  Pause,
  UserPlus,
  Search,
  Warehouse,
  ShoppingCart,
  Clock,
  TrendingUp,
  DollarSign,
  MessageSquare,
  PackageSearch
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import CompactMetricCard from '../components/CompactMetricCard';
import GridMenu, { GridButton } from '../components/GridMenu';
import StatusDrawer from '../components/StatusDrawer';
import StatusBadge from '../components/StatusBadge';
import { MetricDetail, DetailList } from '../components/StatusDrawer';

export default function StorePage() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<React.ReactNode>(null);
  const [drawerTitle, setDrawerTitle] = useState('');

  // Metrics state
  const [metrics, setMetrics] = useState({
    revenue: 0,
    activeTickets: 0,
    pendingActions: 0,
    holdTickets: 0,
    lowStock: 0,
    messages: 0,
    revenueTrend: '+0%',
    ticketsTrend: '+0%'
  });

  // Status badges state
  const [statusBadges, setStatusBadges] = useState([
    { id: 'hold', type: 'warning' as const, count: 5, label: 'Hold tickets' },
    { id: 'low-stock', type: 'alert' as const, count: 2, label: 'Low stock' },
    { id: 'messages', type: 'info' as const, count: 3, label: 'Messages' }
  ]);

  // Quick actions (most used functions)
  const quickActions = [
    { id: 'drop', label: 'Drop', icon: Package, route: '/drop', color: 'amber' as const, description: 'Create new drop-off' },
    { id: 'pickup', label: 'Pickup', icon: Home, route: '/pickup', color: 'emerald' as const, description: 'Process pickup' },
    { id: 'sales', label: 'New Sale', icon: ShoppingCart, route: '/sales', color: 'sky' as const, description: 'Create new sale' },
    { id: 'customer', label: 'Add Customer', icon: UserPlus, route: '/customers', color: 'violet' as const, description: 'Add new customer' },
    { id: 'search', label: 'Find Ticket', icon: Search, route: '/ticket-search', color: 'blue' as const, description: 'Search ticket' },
    { id: 'supplies', label: 'Supplies', icon: Warehouse, route: '/supplies', color: 'emerald' as const, description: 'Manage supplies' },
  ];

  // Grid buttons for main navigation
  const gridButtons: GridButton[] = [
    { id: 'hold', label: 'Hold / Quick Drop', icon: <Pause />, route: '/no-charge-do-over', color: 'amber' },
    { id: 'no-charge', label: 'No Charge', icon: <PackageSearch />, route: '/no-charge-do-over', color: 'amber' },
    { id: 'search-ticket', label: 'Search Ticket', icon: <Search />, route: '/ticket-search', color: 'sky' },
    { id: 'find-customer', label: 'Find Customer', icon: <Search />, route: '/customers', color: 'violet' },
    { id: 'stock', label: 'Stock', icon: <PackageSearch />, route: '/inventory', color: 'emerald' },
    { id: 'sales-items', label: 'Sales Items', icon: <ShoppingCart />, route: '/sales-items', color: 'emerald' },
    { id: 'operations', label: 'Operations', icon: <PackageSearch />, route: '/operation', color: 'violet' },
    { id: 'sales-report', label: 'Sales Report', icon: <TrendingUp />, route: '/sales', color: 'violet' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch metrics from API
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch today's revenue (placeholder)
        setMetrics({
          revenue: 2845000,
          activeTickets: 24,
          pendingActions: 8,
          holdTickets: 5,
          lowStock: 2,
          messages: 3,
          revenueTrend: '+12.5%',
          ticketsTrend: '+8.1%'
        });

        // Fetch hold tickets count
        const heldResponse = await fetch('http://localhost:3000/api/operations?status=held');
        if (heldResponse.ok) {
          const heldTickets = await heldResponse.json();
          const holdCount = heldTickets.length;
          setMetrics(prev => ({ ...prev, holdTickets: holdCount, pendingActions: holdCount + prev.lowStock + prev.messages }));
          setStatusBadges(prev => {
            const holdBadge = prev.find(b => b.id === 'hold');
            if (holdBadge) {
              return prev.map(b => b.id === 'hold' ? { ...b, count: holdCount } : b);
            }
            return prev;
          });
        }

        // Fetch low stock items
        const suppliesResponse = await fetch('http://localhost:3000/api/supplies');
        if (suppliesResponse.ok) {
          const supplies = await suppliesResponse.json();
          const lowStock = supplies.filter((s: any) => s.on_hand <= s.min_stock);
          const stockCount = lowStock.length;
          setMetrics(prev => ({ ...prev, lowStock: stockCount }));
          setStatusBadges(prev => {
            const stockBadge = prev.find(b => b.id === 'low-stock');
            if (stockBadge) {
              return prev.map(b => b.id === 'low-stock' ? { ...b, count: stockCount } : b);
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleActionClick = (action: any) => {
    navigate(action.route);
  };

  const handleQuickActionClick = (action: typeof quickActions[0]) => {
    navigate(action.route);
  };

  const openRevenueDrawer = () => {
    setDrawerTitle('Revenue Details');
    setDrawerContent(
      <div>
        <MetricDetail
          label="Today's Revenue"
          value={formatCurrency(metrics.revenue)}
          trend={metrics.revenueTrend}
          trendUp={true}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <DetailList
          items={[
            { label: 'This Week', value: formatCurrency(metrics.revenue * 5) },
            { label: 'This Month', value: formatCurrency(metrics.revenue * 22) },
            { label: 'Avg. per Order', value: formatCurrency(118500) },
            { label: 'Transactions', value: '24' }
          ]}
        />
      </div>
    );
    setDrawerOpen(true);
  };

  const openTicketsDrawer = () => {
    setDrawerTitle('Active Tickets');
    setDrawerContent(
      <div>
        <MetricDetail
          label="Active Tickets"
          value={metrics.activeTickets}
          trend={metrics.ticketsTrend}
          trendUp={true}
          icon={<Package className="w-6 h-6" />}
        />
        <DetailList
          items={[
            { label: 'Pending', value: '18' },
            { label: 'In Progress', value: '4' },
            { label: 'Ready', value: '2' },
            { label: 'Overdue', value: '0' }
          ]}
        />
      </div>
    );
    setDrawerOpen(true);
  };

  const openPendingDrawer = () => {
    setDrawerTitle('Pending Actions');
    setDrawerContent(
      <div>
        <MetricDetail
          label="Pending Actions"
          value={metrics.pendingActions}
          icon={<AlertCircle className="w-6 h-6" />}
        />
        <DetailList
          items={[
            { label: 'Hold Tickets', value: metrics.holdTickets },
            { label: 'Low Stock Items', value: metrics.lowStock },
            { label: 'Unread Messages', value: metrics.messages }
          ]}
        />
      </div>
    );
    setDrawerOpen(true);
  };

  const handleStatusDismiss = (badgeId: string) => {
    setStatusBadges(prev => prev.filter(b => b.id !== badgeId));
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header - Fixed height (48px) */}
      <header className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-gray-700 bg-gray-900/50 backdrop-blur">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold text-white">Store</h1>
          </div>
        </div>

        {/* Clock (compact) */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-mono text-indigo-400 text-sm font-bold">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-gray-500 text-xs">
              {format(currentTime, 'MMM dd, yyyy')}
            </div>
          </div>

          {/* User Profile (compact) */}
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium text-xs">Admin</p>
              <p className="text-gray-400 text-[10px]">Online</p>
            </div>
          </div>
        </div>
      </header>

      {/* Compact Metrics Row - Fixed height (80px) */}
      <section className="h-20 flex-shrink-0 flex items-center gap-3 px-4 overflow-x-auto">
        <CompactMetricCard
          icon={DollarSign}
          label="Revenue"
          value={formatCurrency(metrics.revenue)}
          trend={metrics.revenueTrend}
          trendUp={true}
          color="emerald"
          onClick={openRevenueDrawer}
        />
        <CompactMetricCard
          icon={Package}
          label="Tickets"
          value={metrics.activeTickets}
          trend={metrics.ticketsTrend}
          trendUp={true}
          color="blue"
          onClick={openTicketsDrawer}
        />
        <CompactMetricCard
          icon={AlertCircle}
          label="Actions"
          value={metrics.pendingActions}
          color="orange"
          onClick={openPendingDrawer}
        />
        <CompactMetricCard
          icon={Clock}
          label="Holds"
          value={metrics.holdTickets}
          color="amber"
          onClick={openPendingDrawer}
        />
        <CompactMetricCard
          icon={Warehouse}
          label="Low Stock"
          value={metrics.lowStock}
          color="red"
        />
        <CompactMetricCard
          icon={MessageSquare}
          label="Messages"
          value={metrics.messages}
          color="violet"
        />
      </section>

      {/* Main Content - Flexible, fills remaining space */}
      <main className="flex-1 min-h-0 flex overflow-hidden">
        {/* Quick Actions Panel - Fixed width (240px) */}
        <aside className="w-60 flex-shrink-0 border-r border-gray-700 bg-gray-800/30 backdrop-blur p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickActionClick(action)}
                className={`
                  relative overflow-hidden rounded-lg border
                  p-4 flex flex-col items-center gap-2
                  transition-all duration-200
                  hover:scale-105 active:scale-95
                  cursor-pointer group
                  ${action.color === 'amber' && 'bg-amber-900/30 border-amber-700/50 hover:border-amber-600 hover:bg-amber-900/50'}
                  ${action.color === 'emerald' && 'bg-emerald-900/30 border-emerald-700/50 hover:border-emerald-600 hover:bg-emerald-900/50'}
                  ${action.color === 'sky' && 'bg-sky-900/30 border-sky-700/50 hover:border-sky-600 hover:bg-sky-900/50'}
                  ${action.color === 'violet' && 'bg-violet-900/30 border-violet-700/50 hover:border-violet-600 hover:bg-violet-900/50'}
                  ${action.color === 'blue' && 'bg-blue-900/30 border-blue-700/50 hover:border-blue-600 hover:bg-blue-900/50'}
                `}
              >
                <action.icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-white text-center leading-tight">
                  {action.label}
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Navigation - Flexible, scrollable */}
        <section className="flex-1 min-h-0 overflow-y-auto p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Navigation
          </h2>
          <GridMenu buttons={gridButtons} onButtonClick={handleActionClick} />
        </section>
      </main>

      {/* Status Footer - Fixed height (48px) */}
      <footer className="h-12 flex-shrink-0 flex items-center gap-4 px-4 border-t border-gray-700 bg-gray-800/50 backdrop-blur">
        {statusBadges.map(badge => (
          <StatusBadge
            key={badge.id}
            type={badge.type}
            count={badge.count}
            label={badge.label}
            onDismiss={() => handleStatusDismiss(badge.id)}
            compact
          />
        ))}
      </footer>

      {/* Status Drawer */}
      <StatusDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerTitle}
      >
        {drawerContent}
      </StatusDrawer>
    </div>
  );
}
