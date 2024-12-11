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

export default function MainMenu({ onMenuClick, currentView, isCollapsed }: MainMenuProps) {
  const menuItems = [
    { icon: Store, label: 'Store', view: '/' },
    { icon: Users, label: 'Customer', view: 'customers' },
    { icon: Download, label: 'Drop', view: 'drop' },
    { icon: Upload, label: 'Pickup', view: 'pickup' },
    { icon: MessageSquare, label: 'Messages', view: 'messages' },
    { icon: Settings, label: 'Operation', view: 'operations' },
    { icon: Package, label: 'Supplies', view: 'supplies' },
    { icon: DollarSign, label: 'Sales Overview', view: 'sales' },
    { icon: ShoppingBag, label: 'Sales Items', view: 'sales-items' },
    { icon: Tag, label: 'Tickets & Tags', view: 'tickets' },
    { icon: QrCode, label: 'QR Codes', view: 'qrcodes' },
    { icon: Megaphone, label: 'Marketing', view: 'marketing' },
    { icon: BarChart3, label: 'Reports', view: 'reports' },
    { icon: UserCog, label: 'Staff', view: 'staff' },
    { icon: Shield, label: 'Admin', view: 'admin' }
  ];

  const isActive = (view: string) => 
    currentView === view ? 'bg-indigo-700' : '';

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg hover:bg-gray-700 transition-colors ${isActive(item.view)}`}
            onClick={() => onMenuClick(item.view)}
            title={isCollapsed ? item.label : undefined}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span>{item.label}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}