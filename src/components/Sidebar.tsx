import { ShoppingBag, LayoutDashboard, Users, Settings, LogOut, Wrench, Clock, UserCircle, DollarSign, Package, Archive } from 'lucide-react';

interface SidebarProps {
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

export function Sidebar({ onNavigate, currentView }: SidebarProps) {
  const isActive = (view: string) => currentView === view;

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
      ]
    }
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-indigo-600 to-indigo-700 text-white min-h-screen flex flex-col shadow-xl">
      <div className="p-8 border-b border-indigo-500/30">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-white/10 rounded-lg">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">RepairPro</h1>
        </div>
      </div>

      <nav className="flex-1 py-8 space-y-10 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent">
        {navGroups.map((group, index) => (
          <div key={index} className="space-y-4">
            <h2 className="text-xs font-semibold text-indigo-200 uppercase tracking-wider px-6 pb-2">
              {group.title}
            </h2>
            {group.items.map((item) => (
              <NavItem
                key={item.view}
                icon={item.icon}
                label={item.label}
                onClick={() => onNavigate(item.view)}
                isActive={isActive(item.view)}
              />
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
        <button className="flex items-center space-x-4 px-6 py-4 rounded-lg text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-colors w-full">
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;