import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Store,
  Users,
  Download,
  Upload,
  CreditCard,
  MessageSquare,
  Settings,
  Package,
  ShoppingBag,
  QrCode,
  Megaphone,
  BarChart3,
  Target,
  UserCog,
  Shield,
  DollarSign
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
  permission?: string;
  roles?: string[];
}

const NavItem = ({ icon: Icon, label, to, isActive, isCollapsed, permission, roles }: NavItemProps) => {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => navigate(to)}
      title={isCollapsed ? label : undefined}
      className={`
        flex items-center px-5 py-2.5 rounded-lg w-full
        transition-all duration-200
        ${isActive 
          ? 'bg-indigo-600 text-white shadow-lg translate-x-1.5' 
          : 'text-gray-300 hover:bg-indigo-600/20 hover:text-white hover:translate-x-1.5'
        }
      `}
    >
      <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
        <Icon className="h-5 w-5" />
      </div>
      {!isCollapsed && (
        <span className="ml-3 text-sm font-medium tracking-wide truncate">
          {label}
        </span>
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
      { icon: MessageSquare, label: "Messages", to: "/messages", permission: "send_messages" },
    ]
  },
  {
    title: "Management",
    items: [
      { icon: Settings, label: "Operation", to: "/operation", permission: "view_operations" },
      { icon: Package, label: "Supplies", to: "/supplies", permission: "manage_supplies", roles: ["admin", "manager"] },
      { icon: ShoppingBag, label: "Sales", to: "/sales", permission: "view_sales" },
      { icon: QrCode, label: "QR Codes", to: "/qrcodes", permission: "view_qrcodes" },
    ]
  },
  {
    title: "Business",
    items: [
      { icon: Megaphone, label: "Marketing", to: "/marketing", permission: "view_marketing" },
      { icon: BarChart3, label: "Reports", to: "/reports", permission: "view_reports", roles: ["admin", "manager"] },
      { icon: Target, label: "Business Targets", to: "/business-targets", permission: "view_business_targets" },
      { icon: UserCog, label: "Staff", to: "/staff", permission: "manage_staff", roles: ["admin", "manager"] },
      { icon: Shield, label: "Admin", to: "/admin", permission: "manage_users", roles: ["admin"] },
    ]
  }
];

const MainMenu: React.FC<MainMenuProps> = ({ isCollapsed }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, hasPermission } = useAuthStore();

  // Filter menu items based on permissions and roles
  const filterMenuItems = (items: typeof menuGroups[0]['items']) => {
    return items.filter(item => {
      // Always show items with no permission requirements
      if (!item.permission && !item.roles) return true;

      // Check role requirement
      if (item.roles && user && !item.roles.includes(user.role)) {
        return false;
      }

      // Check permission requirement
      if (item.permission && !hasPermission(item.permission)) {
        return false;
      }

      return true;
    });
  };

  return (
    <nav className="h-full py-4 flex flex-col gap-4">
      {menuGroups.map((group, groupIndex) => {
        const filteredItems = filterMenuItems(group.items);

        // Don't render empty groups
        if (filteredItems.length === 0) return null;

        return (
          <div key={groupIndex} className="px-4">
            {!isCollapsed && (
              <h2 className="mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.title}
              </h2>
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
                  permission={item.permission}
                  roles={item.roles}
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