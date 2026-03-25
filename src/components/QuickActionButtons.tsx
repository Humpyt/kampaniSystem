import { useNavigate } from 'react-router-dom';
import { LogOut, Package, ShoppingBag, ArrowDownToLine } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const QuickActionButtons = () => {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
      {/* Drop Button */}
      <button
        onClick={() => navigate('/drop')}
        className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-colors"
      >
        <ArrowDownToLine size={24} />
        <span className="text-sm">Drop</span>
      </button>

      {/* Pickup Button */}
      <button
        onClick={() => navigate('/pickup')}
        className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-colors"
      >
        <Package size={24} />
        <span className="text-sm">Pickup</span>
      </button>

      {/* Sales Items Button */}
      <button
        onClick={() => navigate('/sales')}
        className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-colors"
      >
        <ShoppingBag size={24} />
        <span className="text-sm">Sales</span>
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-colors mt-auto"
      >
        <LogOut size={24} />
        <span className="text-sm">Logout</span>
      </button>
    </div>
  );
};

export default QuickActionButtons;
