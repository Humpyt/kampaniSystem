import React, { useState } from 'react';
import {
  Package,
  Home,
  Pause,
  UserPlus,
  Search,
  FileText,
  Warehouse,
  PackageSearch,
  BarChart3,
  ClipboardList,
  ShoppingCart,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  description?: string;
  colorFrom: string;
  colorTo: string;
  glowColor: string;
  onClick?: () => void;
}

interface TabConfig {
  id: string;
  label: string;
  colorFrom: string;
  colorTo: string;
  glowColor: string;
  actions: Action[];
}

const tabs: TabConfig[] = [
  {
    id: 'workflows',
    label: 'Workflows',
    colorFrom: '#06B6D4',  // Cyan
    colorTo: '#3B82F6',  // Blue
    glowColor: 'rgba(6, 182, 212, 0.5)',
    actions: [
      {
        id: 'drop',
        label: 'Drop',
        icon: <Package className="w-6 h-6" />,
        route: '/drop',
        colorFrom: '#06B6D4',
        colorTo: '#3B82F6',
        glowColor: 'rgba(6, 182, 212, 0.5)'
      },
      {
        id: 'pickup',
        label: 'Pickup',
        icon: <Home className="w-6 h-6" />,
        route: '/pickup',
        colorFrom: '#06B6D4',
        colorTo: '#3B82F6',
        glowColor: 'rgba(6, 182, 212, 0.5)'
      },
      {
        id: 'hold',
        label: 'Hold',
        icon: <Pause className="w-6 h-6" />,
        route: '/hold-quick-drop',
        colorFrom: '#06B6D4',
        colorTo: '#3B82F6',
        glowColor: 'rgba(6, 182, 212, 0.5)'
      },
      {
        id: 'no-charge',
        label: 'No Charge',
        icon: <ClipboardList className="w-6 h-6" />,
        route: '/no-charge-do-over',
        colorFrom: '#06B6D4',
        colorTo: '#3B82F6',
        glowColor: 'rgba(6, 182, 212, 0.5)'
      },
      {
        id: 'search',
        label: 'Search',
        icon: <Search className="w-6 h-6" />,
        route: '/ticket-search',
        colorFrom: '#06B6D4',
        colorTo: '#3B82F6',
        glowColor: 'rgba(6, 182, 212, 0.5)'
      },
    ]
  },
  {
    id: 'customers',
    label: 'Customers',
    colorFrom: '#F97316',  // Orange
    colorTo: '#FB923C',  // Coral
    glowColor: 'rgba(249, 115, 22, 0.5)',
    actions: [
      {
        id: 'add',
        label: 'Add Customer',
        icon: <UserPlus className="w-6 h-6" />,
        route: '/customers',
        colorFrom: '#F97316',
        colorTo: '#FB923C',
        glowColor: 'rgba(249, 115, 22, 0.5)'
      },
      {
        id: 'find',
        label: 'Find',
        icon: <Search className="w-6 h-6" />,
        route: '/customers',
        colorFrom: '#F97316',
        colorTo: '#FB923C',
        glowColor: 'rgba(249, 115, 22, 0.5)'
      },
      {
        id: 'search-all',
        label: 'Search All',
        icon: <Search className="w-6 h-6" />,
        route: '/ticket-search',
        colorFrom: '#F97316',
        colorTo: '#FB923C',
        glowColor: 'rgba(249, 115, 22, 0.5)'
      },
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    colorFrom: '#8B5CF6',  // Purple
    colorTo: '#EC4899',  // Pink
    glowColor: 'rgba(139, 92, 246, 0.5)',
    actions: [
      {
        id: 'supplies',
        label: 'Supplies',
        icon: <Warehouse className="w-6 h-6" />,
        route: '/supplies',
        colorFrom: '#8B5CF6',
        colorTo: '#EC4899',
        glowColor: 'rgba(139, 92, 246, 0.5)'
      },
      {
        id: 'stock',
        label: 'Stock',
        icon: <PackageSearch className="w-6 h-6" />,
        route: '/inventory',
        colorFrom: '#8B5CF6',
        colorTo: '#EC4899',
        glowColor: 'rgba(139, 92, 246, 0.5)'
      },
      {
        id: 'sales',
        label: 'Sales Items',
        icon: <ShoppingCart className="w-6 h-6" />,
        route: '/sales-items',
        colorFrom: '#8B5CF6',
        colorTo: '#EC4899',
        glowColor: 'rgba(139, 92, 246, 0.5)'
      },
    ]
  },
  {
    id: 'reports',
    label: 'Reports',
    colorFrom: '#10B981',  // Emerald
    colorTo: '#34D399',  // Green
    glowColor: 'rgba(16, 185, 129, 0.5)',
    actions: [
      {
        id: 'operations',
        label: 'Operations',
        icon: <ClipboardList className="w-6 h-6" />,
        route: '/operation',
        colorFrom: '#10B981',
        colorTo: '#34D399',
        glowColor: 'rgba(16, 185, 129, 0.5)'
      },
      {
        id: 'sales',
        label: 'Sales',
        icon: <BarChart3 className="w-6 h-6" />,
        route: '/sales',
        colorFrom: '#10B981',
        colorTo: '#34D399',
        glowColor: 'rgba(16, 185, 129, 0.5)'
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: <FileText className="w-6 h-6" />,
        route: '/reports',
        colorFrom: '#10B981',
        colorTo: '#34D399',
        glowColor: 'rgba(16, 185, 129, 0.5)'
      },
    ]
  }
];

interface ActionTabsProps {
  onActionClick?: (action: Action) => void;
}

function RippleButton({ children, onClick, className, style }: { children: React.ReactNode; onClick?: () => void; className?: string; style?: React.CSSProperties }) {
  const [ripple, setRipple] = React.useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y });
    setTimeout(() => setRipple(null), 600);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
      {ripple && (
        <span
          className="absolute rounded-full pointer-events-none animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            background: 'rgba(255, 255, 255, 0.6)',
            transform: 'scale(4)',
            opacity: 0,
            transition: 'all 0.6s ease-out'
          }}
        />
      )}
    </button>
  );
}

export default function ActionTabs({ onActionClick }: ActionTabsProps) {
  const [activeTab, setActiveTab] = useState('workflows');

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabClick(tabId);
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="w-full">
      {/* Tab Headers with Gradient Backgrounds */}
      <div className="flex space-x-2 mb-8" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            className={`
              relative px-8 py-4 rounded-2xl font-bold text-lg
              transition-all duration-300 transform hover:scale-105 active:scale-95
              focus:outline-none focus:ring-4 focus:ring-opacity-50
              ${activeTab === tab.id
                ? `text-white shadow-lg animate-bounce-short`
                : `text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-white border-2 border-gray-700`
              }
            `}
            style={
              activeTab === tab.id ? {
                background: `linear-gradient(135deg, ${tab.colorFrom}, ${tab.colorTo})`,
                boxShadow: `0 0 30px ${tab.glowColor}`,
                animation: 'bounce-subtle 1s ease-in-out'
              } : {}
            }
          >
            <span className="relative z-10 flex items-center space-x-2">
              <Sparkles className={`w-5 h-5 ${activeTab === tab.id ? 'animate-spin-slow' : ''}`} />
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div
                className="absolute inset-0 rounded-2xl opacity-20 blur-xl animate-pulse"
                style={{
                  background: `linear-gradient(135deg, ${tab.colorFrom}, ${tab.colorTo})`
                }}
              />
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>

      {/* Tab Content with Colorful Action Buttons */}
      <div
        className="grid grid-cols-3 gap-8"
        role="tabpanel"
        aria-labelledby={activeTab}
      >
        {activeTabData?.actions.map((action, index) => (
          <RippleButton
            key={action.id}
            onClick={() => onActionClick?.(action)}
            className={`
              group relative overflow-hidden
              bg-gray-800 rounded-2xl p-8
              border-2 border-gray-700
              transition-all duration-500 ease-out
              hover:scale-105 hover:shadow-2xl
              focus:outline-none focus:ring-4 focus:ring-opacity-50
            `}
            style={{
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              animationDelay: `${index * 100}ms`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = action.colorFrom;
              e.currentTarget.style.boxShadow = `0 0 40px ${action.glowColor}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            {/* Gradient Background on Hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
              style={{
                background: `linear-gradient(135deg, ${action.colorFrom}, ${action.colorTo})`
              }}
            />

            {/* Icon Container with Gradient */}
            <div className="relative z-10 mb-4">
              <div
                className="p-4 rounded-2xl inline-block transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                style={{
                  background: `linear-gradient(135deg, ${action.colorFrom}, ${action.colorTo})`,
                  boxShadow: `0 8px 24px ${action.glowColor}`
                }}
              >
                <div className="relative z-10 text-white">
                  {action.icon}
                </div>
              </div>
            </div>

            {/* Label */}
            <div className="relative z-10">
              <h3
                className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:text-gradient-to-r transition-all duration-500"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${action.colorFrom}, ${action.colorTo})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {action.label}
              </h3>
            </div>

            {/* Hover Arrow Animation */}
            <div className="relative z-10 mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 group-hover:translate-x-1 transition-all duration-500">
              <ArrowRight
                className="text-white"
                style={{ color: action.colorFrom }}
              />
            </div>

            {/* Shimmer Effect on Hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000">
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), ${action.colorFrom}, transparent)`,
                  backgroundSize: '200% 100%'
                }}
              />
            </div>

            {/* Particle effects on hover */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" style={{ animationDelay: '0ms' }} />
              <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" style={{ animationDelay: '100ms' }} />
              <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" style={{ animationDelay: '200ms' }} />
            </div>
          </RippleButton>
        ))}
      </div>

      {/* Empty states for tabs with fewer actions */}
      {activeTabData && activeTabData.actions.length < 6 && (
        <div className="mt-8 text-center text-gray-500">
          {activeTabData.actions.length} actions available in this category
        </div>
      )}
    </div>
  );
}
