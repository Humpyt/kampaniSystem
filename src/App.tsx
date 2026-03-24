import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Routes, Route, Outlet } from 'react-router-dom';
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
import NotificationsPage from './pages/NotificationsPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import MainMenu from './components/MainMenu';
import RightSidebar from './components/RightSidebar';
import QuickActionButtons from './components/QuickActionButtons';
import ProtectedRoute from './components/ProtectedRoute';
import { CustomerProvider } from './contexts/CustomerContext';
import { OperationProvider } from './contexts/OperationContext';
import { AdminProvider } from './contexts/AdminContext';
import { CartProvider } from './contexts/CartContext';
import { ProductProvider } from './contexts/ProductContext';
import HoldQuickDropPage from './pages/HoldQuickDropPage';
import NoChargeDoOverPage from './pages/NoChargeDoOverPage';
import TicketSearchPage from './pages/TicketSearchPage';
import AssemblyPage from './pages/AssemblyPage';
import RackingPage from './pages/RackingPage';
import PickupOrderPage from './pages/PickupOrderPage';
import DeliveriesPage from './pages/DeliveriesPage';
import CodPaymentPage from './pages/CodPaymentPage';
import SaleItemsPage from './pages/SaleItemsPage';
import ProductCategoryManager from './pages/ProductCategoryManager';

const Layout = ({ isSidebarCollapsed, toggleSidebar }: { isSidebarCollapsed: boolean; toggleSidebar: () => void }) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`bg-gray-900 text-white transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <MainMenu isCollapsed={isSidebarCollapsed} />
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-r-md hover:bg-gray-700 focus:outline-none"
      >
        {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden pr-[80px]">
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
        <QuickActionButtons />
      </div>
    </div>
  );
};

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">You're Offline</h2>
          <p className="text-gray-400">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-800 text-white">
        <CustomerProvider>
          <OperationProvider>
            <AdminProvider>
              <CartProvider>
                <ProductProvider>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <Layout isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                      }
                    >
                      <Route index element={<StorePage />} />
                      <Route path="login" element={<LoginPage />} />
                      <Route path="customers" element={<CustomerPage />} />
                      <Route path="drop" element={<DropPage />} />
                      <Route path="pickup" element={<PickupPage />} />
                      <Route path="messages" element={<MessagePage />} />
                      <Route path="operation" element={<OperationPage />} />
                      <Route path="supplies" element={<SuppliesPage />} />
                      <Route path="sales" element={<SalesPage />} />
                      <Route path="sales-items" element={<SalesItems />} />
                      <Route path="manage-categories" element={<ProductCategoryManager />} />
                      <Route path="tickets" element={<TicketsPage />} />
                      <Route path="qrcodes" element={<QRCodesPage />} />
                      <Route path="marketing" element={<MarketingPage />} />
                      <Route path="reports" element={<ReportsPage />} />
                      <Route path="staff" element={
                        <ProtectedRoute requiredRoles={['admin', 'manager']}>
                          <StaffPage />
                        </ProtectedRoute>
                      } />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="admin" element={
                        <ProtectedRoute requiredRoles={['admin']}>
                          <AdminPage />
                        </ProtectedRoute>
                      } />
                      <Route path="hold-quick-drop" element={<HoldQuickDropPage />} />
                      <Route path="no-charge-do-over" element={<NoChargeDoOverPage />} />
                      <Route path="ticket-search" element={<TicketSearchPage />} />
                      <Route path="assembly" element={<AssemblyPage />} />
                      <Route path="racking" element={<RackingPage />} />
                      <Route path="pickup-order" element={<PickupOrderPage />} />
                      <Route path="deliveries" element={<DeliveriesPage />} />
                      <Route path="cod-payment" element={<CodPaymentPage />} />
                      <Route path="sale-items" element={<SaleItemsPage />} />
                    </Route>
                  </Routes>
                </ProductProvider>
              </CartProvider>
            </AdminProvider>
          </OperationProvider>
        </CustomerProvider>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }} />
      </div>
    </ErrorBoundary>
  );
}

function AppWithProviders() {
  return (
    <App />
  );
}

export default AppWithProviders;
