import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useStaffMessages } from '../contexts/StaffMessageContext';
import {
  Store,
  Users,
  Download,
  Upload,
  CreditCard,
  Settings,
  Package,
  ShoppingBag,
  BarChart3,
  Target,
  UserCog,
  Shield,
  Wallet,
  Receipt
} from 'lucide-react';

interface MainMenuProps {
  isCollapsed: boolean;
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  isActive: boolean;
  isCollapsed: boolean;
  badge?: number;
}

const NavItem = ({ icon: Icon, label, to, isActive, isCollapsed, badge }: NavItemProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      title={isCollapsed ? label : undefined}
      className={`
        group relative flex items-center h-11 rounded-xl w-full
        transition-all duration-300 ease-out mb-1
        ${isCollapsed ? 'justify-center px-0' : 'px-4'}
        ${isActive
          ? 'bg-indigo-600/20 text-white shadow-[0_0_20px_rgba(79,70,229,0.2)] border border-indigo-500/20'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }
      `}
    >
      <div className={`flex items-center justify-center transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
        <Icon size={isCollapsed ? 22 : 18} className={isActive ? 'text-indigo-400' : ''} />
      </div>

      {!isCollapsed && (
        <span className="ml-3 text-sm font-medium tracking-wide truncate">
          {label}
        </span>
      )}

      {/* Active Pill Indicator */}
      {isActive && !isCollapsed && (
        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
      )}

      {/* Badge for unread messages */}
      {badge !== undefined && badge > 0 && (
        <span className={`absolute ${isCollapsed ? '-top-1 -right-1' : '-top-1 right-3'} bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-16 bg-gray-900 text-white text-xs px-2.5 py-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-white/10 shadow-2xl">
          {label}
        </div>
      )}
    </button>
  );
};

const menuGroups = [
  {
    title: "Main",
    items: [
      { icon: Store, label: "Store", to: "/store" },
      { icon: Users, label: "Customers", to: "/customers", permission: "view_customers" },
      { icon: Download, label: "Drop", to: "/drop", permission: "create_drop" },
      { icon: Upload, label: "Pickup", to: "/pickup", permission: "create_pickup" },
      { icon: CreditCard, label: "Balances", to: "/balances" },
    ]
  },
  {
    title: "Management",
    items: [
      { icon: Settings, label: "Operation", to: "/operation", permission: "view_operations" },
      { icon: Wallet, label: "Expenses", to: "/expenses" },
      { icon: ShoppingBag, label: "Sales", to: "/sales", permission: "view_sales" },
    ]
  },
  {
    title: "Business",
    items: [
      { icon: BarChart3, label: "Reports", to: "/reports", permission: "view_reports", roles: ["admin", "manager"] },
      { icon: Target, label: "Business Targets", to: "/business-targets", permission: "view_business_targets" },
      { icon: Receipt, label: "Invoices", to: "/invoices", roles: ["admin", "manager"] },
      { icon: Shield, label: "Admin", to: "/admin", permission: "manage_users", roles: ["admin"] },
    ]
  }
];

const MainMenu: React.FC<MainMenuProps> = ({ isCollapsed }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, hasPermission } = useAuthStore();
  const { unreadCount } = useStaffMessages();

  const filterMenuItems = (items: typeof menuGroups[0]['items']) => {
    return items.filter(item => {
      // @ts-ignore
      if (!item.permission && !item.roles) return true;
      // @ts-ignore
      if (item.roles && user && !item.roles.includes(user.role)) return false;
      // @ts-ignore
      if (item.permission && !hasPermission(item.permission)) return false;
      return true;
    });
  };

  return (
    <nav className="h-full py-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
      {menuGroups.map((group, groupIndex) => {
        const filteredItems = filterMenuItems(group.items);
        if (filteredItems.length === 0) return null;

        return (
          <div key={groupIndex} className={isCollapsed ? 'px-2' : 'px-4'}>
            {!isCollapsed ? (
              <h2 className="mb-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] opacity-80">
                {group.title}
              </h2>
            ) : (
              <div className="h-px bg-white/5 mx-2 mb-4" />
            )}
            <div className="space-y-1">
              {filteredItems.map((item, itemIndex) => (
                <NavItem
                  key={itemIndex}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  isActive={currentPath === item.to}
                  isCollapsed={isCollapsed}
                  badge={(item as any).badge ? unreadCount : undefined}
                />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
};

export default MainMenu;