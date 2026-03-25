import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
}

const NavItem = ({ icon, label, onClick, isActive }: NavItemProps) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center space-x-4 px-6 py-4 rounded-lg
      transition-all duration-200 w-full text-left relative
      ${isActive 
        ? 'bg-indigo-700 text-white shadow-lg translate-x-2 after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-8 after:bg-white after:rounded-r-full' 
        : 'text-indigo-100 hover:bg-indigo-700/50 hover:translate-x-2'
      }
    `}
  >
    <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
      {icon}
    </div>
    <span className={`font-medium tracking-wide ${isActive ? 'text-white' : 'text-indigo-50'}`}>{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleCollapse, onNavigate, currentView }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      title: "Main",
      items: [
        { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", view: "dashboard" },
        { icon: <Clock className="h-5 w-5" />, label: "Work in Progress", view: "in-progress" },
        { icon: <Package className="h-5 w-5" />, label: "Ready for Pickup", view: "pickups" },
      ]
    },
    {
      title: "Management",
      items: [
        { icon: <Users className="h-5 w-5" />, label: "Customers", view: "customers" },
        { icon: <Wrench className="h-5 w-5" />, label: "Services", view: "services" },
        { icon: <UserCircle className="h-5 w-5" />, label: "Staff", view: "staff" },
      ]
    },
    {
      title: "Inventory & Finance",
      items: [
        { icon: <Archive className="h-5 w-5" />, label: "Stock", view: "stock" },
        { icon: <DollarSign className="h-5 w-5" />, label: "Accounts", view: "accounts" },
        { icon: <ShoppingBag className="h-5 w-5" />, label: "Sale Items", view: "sale-items" },
      ]
    }
  ];

  const isActive = (view: string) => currentView === view;

  return (
    <div 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gradient-to-b from-indigo-600 to-indigo-700 text-white transition-all duration-300 ease-in-out flex flex-col`}
    >
      <div className="p-4 flex justify-between items-center">
        {!isCollapsed && <h1 className="text-xl font-bold">RepairPro</h1>}
        <button
          onClick={toggleCollapse}
          className="p-2 hover:bg-indigo-800 rounded-lg"
        >
          {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {navGroups.map((group, index) => (
          <div key={index} className="space-y-4">
            {!isCollapsed && <h2 className="text-xs font-semibold text-indigo-200 uppercase tracking-wider px-6 pb-2">{group.title}</h2>}
            {group.items.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`flex items-center px-4 py-3 text-indigo-100 hover:bg-indigo-700/50 transition-colors ${
                  isActive(item.view) ? 'bg-indigo-700 text-white shadow-lg translate-x-2 after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-8 after:bg-white after:rounded-r-full' : ''
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-8 border-t border-indigo-500/30 space-y-4 bg-indigo-700/20">
        <NavItem
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          onClick={() => onNavigate('account')}
          isActive={isActive('account')}
        />
        <button
          onClick={handleLogout}
          className="flex items-center space-x-4 px-6 py-4 rounded-lg text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;