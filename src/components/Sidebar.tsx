import React from 'react';
import { useAuthStore } from '../store/authStore';
import {
  ShoppingBag,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Wrench,
  Clock,
  UserCircle,
  DollarSign,
  Package,
  Archive,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive: boolean;
  isCollapsed: boolean;
  variant?: 'default' | 'danger';
}

const NavItem = ({ icon, label, onClick, isActive, isCollapsed, variant = 'default' }: NavItemProps) => {
  const baseClasses = `
    group relative flex items-center h-12 rounded-xl transition-all duration-300 ease-out mb-1
    ${isCollapsed ? 'justify-center mx-2 px-0' : 'px-4 mx-3'}
  `;

  const activeClasses = isActive 
    ? 'bg-indigo-600/30 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-indigo-500/30' 
    : 'text-indigo-200/70 hover:bg-white/5 hover:text-white';

  const dangerClasses = variant === 'danger'
    ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
    : '';

  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${variant === 'danger' ? dangerClasses : activeClasses}`}
      title={isCollapsed ? label : ''}
    >
      <div className={`flex items-center justify-center ${isCollapsed ? 'w-8' : 'mr-3'} transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      
      {!isCollapsed && (
        <span className="font-medium text-sm tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
          {label}
        </span>
      )}

      {/* Active Indicator Dot */}
      {isActive && !isCollapsed && (
        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
      )}
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1.5 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-white/10 shadow-2xl">
          {label}
        </div>
      )}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleCollapse, onNavigate, currentView }) => {
  const logout = useAuthStore(state => state.logout);

  const handleLogout = () => {
    logout();
  };

  const navGroups = [
    {
      title: "Main",
      items: [
        { icon: <LayoutDashboard size={20} />, label: "Dashboard", view: "dashboard" },
        { icon: <Clock size={20} />, label: "Work in Progress", view: "in-progress" },
        { icon: <Package size={20} />, label: "Ready for Pickup", view: "pickups" },
      ]
    },
    {
      title: "Management",
      items: [
        { icon: <Users size={20} />, label: "Customers", view: "customers" },
        { icon: <Wrench size={20} />, label: "Services", view: "services" },
        { icon: <UserCircle size={20} />, label: "Staff", view: "staff" },
      ]
    },
    {
      title: "Finance",
      items: [
        { icon: <Archive size={20} />, label: "Stock", view: "stock" },
        { icon: <DollarSign size={20} />, label: "Accounts", view: "accounts" },
        { icon: <ShoppingBag size={20} />, label: "Sale Items", view: "sale-items" },
      ]
    }
  ];

  const isActive = (view: string) => currentView === view;

  return (
    <div 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gray-900 border-r border-white/5 transition-all duration-500 ease-in-out flex flex-col relative z-20`}
    >
      {/* Branding / Toggle */}
      <div className="h-20 flex items-center justify-between px-6 mb-2">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Wrench size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              RepairPro
            </h1>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className={`p-2 hover:bg-white/5 rounded-xl transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? <ChevronRight size={20} className="text-indigo-400" /> : <ChevronLeft size={20} className="text-indigo-400" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {navGroups.map((group, index) => (
          <div key={index} className="mb-6">
            {!isCollapsed ? (
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-7 mb-3">
                {group.title}
              </h2>
            ) : (
              <div className="h-px bg-white/5 mx-4 mb-3" />
            )}
            
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem
                  key={item.view}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => onNavigate(item.view)}
                  isActive={isActive(item.view)}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20 space-y-1">
        <NavItem
          icon={<Settings size={20} />}
          label="Settings"
          onClick={() => onNavigate('account')}
          isActive={isActive('account')}
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={<LogOut size={20} />}
          label="Logout"
          onClick={handleLogout}
          isActive={false}
          isCollapsed={isCollapsed}
          variant="danger"
        />
      </div>
    </div>
  );
};

export default Sidebar;
