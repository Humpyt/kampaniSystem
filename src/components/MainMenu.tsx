import React from 'react';
import { 
  Store, 
  Users, 
  Download,
  Upload,
  MessageSquare,
  Settings,
  Package,
  ShoppingBag,
  Tag,
  QrCode,
  Megaphone,
  BarChart3,
  UserCog,
  Shield,
  DollarSign
} from 'lucide-react';

interface MainMenuProps {
  onMenuClick: (view: string) => void;
  currentView: string;
  isCollapsed: boolean;
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  isActive: boolean;
  isCollapsed: boolean;
}

const NavItem = ({ icon: Icon, label, onClick, isActive, isCollapsed }: NavItemProps) => (
  <button 
    onClick={onClick}
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

const menuGroups = [
  {
    title: "Main",
    items: [
      { icon: Store, label: 'Store', view: '/' },
      { icon: Download, label: 'Drop', view: 'drop' },
      { icon: Upload, label: 'Pickup', view: 'pickup' },
      { icon: MessageSquare, label: 'Messages', view: 'messages' },
    ]
  },
  {
    title: "Management",
    items: [
      { icon: Users, label: 'Customer', view: 'customers' },
      { icon: Settings, label: 'Operation', view: 'operations' },
      { icon: UserCog, label: 'Staff', view: 'staff' },
    ]
  },
  {
    title: "Sales",
    items: [
      { icon: Package, label: 'Supplies', view: 'supplies' },
      { icon: DollarSign, label: 'Sales Overview', view: 'sales' },
      { icon: ShoppingBag, label: 'Sales Items', view: 'sales-items' },
    ]
  },
  {
    title: "Tools",
    items: [
      { icon: Tag, label: 'Tickets & Tags', view: 'tickets' },
      { icon: QrCode, label: 'QR Codes', view: 'qrcodes' },
      { icon: Megaphone, label: 'Marketing', view: 'marketing' },
      { icon: BarChart3, label: 'Reports', view: 'reports' },
      { icon: Shield, label: 'Admin', view: 'admin' },
    ]
  }
];

export default function MainMenu({ onMenuClick, currentView, isCollapsed }: MainMenuProps) {
  return (
    <div className="h-full py-4">
      <div className="space-y-6">
        {menuGroups.map((group, index) => (
          <div key={index} className="space-y-1.5">
            {!isCollapsed && (
              <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 mb-2">
                {group.title}
              </h2>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem
                  key={item.view}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => onMenuClick(item.view)}
                  isActive={currentView === item.view}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}