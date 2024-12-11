import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import StorePage from './pages/StorePage';
import CustomerPage from './pages/CustomerPage';
import DropPage from './pages/DropPage';
import PickupPage from './pages/PickupPage';
import MessagePage from './pages/MessagePage';
import OperationPage from './pages/OperationPage';
import SuppliesPage from './pages/SuppliesPage';
import SalesPage from './pages/SalesPage';
import SalesItems from './pages/SalesItems';
import TicketsPage from './pages/TicketsPage';
import QRCodesPage from './pages/QRCodesPage';
import MarketingPage from './pages/MarketingPage';
import ReportsPage from './pages/ReportsPage';
import StaffPage from './pages/StaffPage';
import AdminPage from './pages/AdminPage';
import MainMenu from './components/MainMenu';
import RightSidebar from './components/RightSidebar';
import { CustomerProvider } from './contexts/CustomerContext';
import { OperationProvider } from './contexts/OperationContext';
import { AdminProvider } from './contexts/AdminContext';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleMenuClick = (view: string) => {
    navigate(`/${view}`);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
        },
      }} />
      <div className="flex">
        {/* Left Sidebar */}
        <div className={`${isSidebarCollapsed ? 'w-16' : 'w-72'} min-h-screen bg-gray-900 p-4 relative transition-all duration-300`}>
          {/* Toggle Button */}
          <button 
            onClick={toggleSidebar}
            className="absolute -right-3 top-8 bg-gray-700 rounded-full p-1 hover:bg-gray-600 z-10"
          >
            {isSidebarCollapsed ? 
              <ChevronRight className="h-4 w-4" /> : 
              <ChevronLeft className="h-4 w-4" />
            }
          </button>

          <div className={`mb-8 ${isSidebarCollapsed ? 'text-center' : ''}`}>
            <div className={`text-2xl font-bold text-white flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2'}`}>
              {!isSidebarCollapsed && <span className="text-emerald-500">Repair</span>}
              <span className={isSidebarCollapsed ? 'text-emerald-500' : ''}>
                {isSidebarCollapsed ? 'R' : 'PRO'}
              </span>
            </div>
          </div>

          <MainMenu 
            onMenuClick={handleMenuClick} 
            isCollapsed={isSidebarCollapsed}
            currentView={window.location.pathname}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-h-screen overflow-auto">
          <CustomerProvider>
            <OperationProvider>
              <AdminProvider>
                <Routes>
                  <Route path="/" element={<StorePage />} />
                  <Route path="/customers" element={<CustomerPage />} />
                  <Route path="/drop" element={<DropPage />} />
                  <Route path="/pickup" element={<PickupPage />} />
                  <Route path="/messages" element={<MessagePage />} />
                  <Route path="/operations" element={<OperationPage />} />
                  <Route path="/supplies" element={<SuppliesPage />} />
                  <Route path="/sales" element={<SalesPage />} />
                  <Route path="/sales-items" element={<SalesItems />} />
                  <Route path="/tickets" element={<TicketsPage />} />
                  <Route path="/qrcodes" element={<QRCodesPage />} />
                  <Route path="/marketing" element={<MarketingPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/staff" element={<StaffPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </AdminProvider>
            </OperationProvider>
          </CustomerProvider>
        </div>

        {/* Right Sidebar */}
        <div className="w-48 min-h-screen bg-gray-900">
          <RightSidebar collapsed={isSidebarCollapsed} />
          <button
            onClick={toggleSidebar}
            className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md"
          >
            {isSidebarCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppWithProviders() {
  return (
    <App />
  );
}

export default AppWithProviders;