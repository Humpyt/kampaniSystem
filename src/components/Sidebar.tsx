import { ShoppingBag, LayoutDashboard, Users, Settings, LogOut, Wrench, Clock, UserCircle, DollarSign, Package, Archive } from 'lucide-react';

interface SidebarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export function Sidebar({ onNavigate, currentView }: SidebarProps) {
  const isActive = (view: string) => 
    currentView === view ? 'bg-indigo-700' : '';

  return (
    <div className="w-64 bg-indigo-600 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-indigo-500">
        <div className="flex items-center space-x-3">
          <ShoppingBag className="h-8 w-8" />
          <h1 className="text-2xl font-bold">RepairPro</h1>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full text-left ${isActive('dashboard')}`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => onNavigate('in-progress')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full text-left ${isActive('in-progress')}`}
          >
            <Clock className="h-5 w-5" />
            <span>Work in Progress</span>
          </button>
          <button 
            onClick={() => onNavigate('pickups')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full text-left ${isActive('pickups')}`}
          >
            <Package className="h-5 w-5" />
            <span>Ready for Pickup</span>
          </button>
          <button 
            onClick={() => onNavigate('customers')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full text-left ${isActive('customers')}`}
          >
            <Users className="h-5 w-5" />
            <span>Customers</span>
          </button>
          <button 
            onClick={() => onNavigate('services')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full text-left ${isActive('services')}`}
          >
            <Wrench className="h-5 w-5" />
            <span>Services</span>
          </button>
          <button 
            onClick={() => onNavigate('staff')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full text-left ${isActive('staff')}`}
          >
            <UserCircle className="h-5 w-5" />
            <span>Staff</span>
          </button>
          <button 
            onClick={() => onNavigate('stock')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full text-left ${isActive('stock')}`}
          >
            <Archive className="h-5 w-5" />
            <span>Stock</span>
          </button>
          <button 
            onClick={() => onNavigate('accounts')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full text-left ${isActive('accounts')}`}
          >
            <DollarSign className="h-5 w-5" />
            <span>Accounts</span>
          </button>
          <button 
            onClick={() => onNavigate('sales')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full text-left ${isActive('sales')}`}
          >
            <DollarSign className="h-5 w-5" />
            <span>Sales Overview</span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-indigo-500">
        <button 
          onClick={() => onNavigate('account')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full text-left ${isActive('account')}`}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
        <button className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full mt-2">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;