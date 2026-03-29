import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import StorePage from './pages/StorePage';
import CustomerPage from './pages/CustomerPage';
import DropPage from './pages/DropPage';
import PickupPage from './pages/PickupPage';
import BalancesPage from './pages/BalancesPage';
import MessagePage from './pages/MessagePage';
import OperationPage from './pages/OperationPage';
import OperationDetailsPage from './pages/OperationDetailsPage';
import SuppliesPage from './pages/SuppliesPage';
import SalesPage from './pages/SalesPage';
import SalesItems from './pages/SalesItems';
import TicketsPage from './pages/TicketsPage';
import QRCodesPage from './pages/QRCodesPage';
import MarketingPage from './pages/MarketingPage';
import ReportsPage from './pages/ReportsPage';
import BusinessTargetsPage from './pages/BusinessTargetsPage';
import StaffPage from './pages/StaffPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import MainMenu from './components/MainMenu';
import QuickActionButtons from './components/QuickActionButtons';
import ProtectedRoute from './components/ProtectedRoute';
import { CustomerProvider } from './contexts/CustomerContext';
import { OperationProvider } from './contexts/OperationContext';
import { AdminProvider } from './contexts/AdminContext';
import { CartProvider } from './contexts/CartContext';
import { ProductProvider } from './contexts/ProductContext';
import { ServiceProvider } from './contexts/ServiceContext';
import { StaffMessageProvider } from './contexts/StaffMessageContext';
import { RetailProductProvider } from './contexts/RetailProductContext';
import { ExpenseProvider } from './contexts/ExpenseContext';
import { useAuthStore } from './store/authStore';
import { Navigate } from 'react-router-dom';
import NoChargeDoOverPage from './pages/NoChargeDoOverPage';
import TicketSearchPage from './pages/TicketSearchPage';
import AssemblyPage from './pages/AssemblyPage';
import RackingPage from './pages/RackingPage';
import PickupOrderPage from './pages/PickupOrderPage';
import DeliveriesPage from './pages/DeliveriesPage';
import CodPaymentPage from './pages/CodPaymentPage';
import ProductCategoryManager from './pages/ProductCategoryManager';
import ExpensesPage from './pages/ExpensesPage';
import ReadyToPickPage from './pages/ReadyToPickPage';
import CommissionsPage from './pages/CommissionsPage';
import InvoicesPage from './pages/InvoicesPage';
import UnpaidBalancesPage from './pages/UnpaidBalancesPage';
import DiscountsPage from './pages/DiscountsPage';
import NewCustomersPage from './pages/NewCustomersPage';
import StockLevelsPage from './pages/StockLevelsPage';
import CustomerRankingsPage from './pages/CustomerRankingsPage';
import MostPerformingPage from './pages/MostPerformingPage';
import CreditListPage from './pages/CreditListPage';

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
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const initializing = useAuthStore(state => state.initializing);

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

  // Initialize authentication on app mount
  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth();
    };
    initializeAuth();
  }, [checkAuth]);

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

  // Show loading while checking authentication
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
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
                  <RetailProductProvider>
                    <ServiceProvider>
                      <StaffMessageProvider>
                        <ExpenseProvider>
                        <Routes>
                    {/* Root route - redirect based on authentication */}
                    <Route
                      path="/"
                      element={
                        isAuthenticated ? (
                          <Navigate to="/store" replace />
                        ) : (
                          <Navigate to="/login" replace />
                        )
                      }
                    />

                    {/* Login route - redirect if already authenticated */}
                    <Route
                      path="/login"
                      element={
                        isAuthenticated ? (
                          <Navigate to="/store" replace />
                        ) : (
                          <LoginPage />
                        )
                      }
                    />

                    {/* Main app routes with layout */}
                    <Route
                      path="/*"
                      element={
                        <Layout isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                      }
                    >
                      <Route path="store" element={<StorePage />} />
                      <Route path="customers" element={
                        <ProtectedRoute permission="view_customers">
                          <CustomerPage />
                        </ProtectedRoute>
                      } />
                      <Route path="drop" element={
                        <ProtectedRoute permission="create_drop">
                          <DropPage />
                        </ProtectedRoute>
                      } />
                      <Route path="pickup" element={
                        <ProtectedRoute permission="create_pickup">
                          <PickupPage />
                        </ProtectedRoute>
                      } />
                      <Route path="balances" element={<BalancesPage />} />
                      <Route path="operations/details/:id" element={<OperationDetailsPage />} />
                      <Route path="messages" element={
                        <ProtectedRoute permission="send_messages">
                          <MessagePage />
                        </ProtectedRoute>
                      } />
                      <Route path="operation" element={
                        <ProtectedRoute permission="view_operations">
                          <OperationPage />
                        </ProtectedRoute>
                      } />
                      <Route path="supplies" element={
                        <ProtectedRoute permission="manage_supplies" requiredRoles={['admin', 'manager']}>
                          <SuppliesPage />
                        </ProtectedRoute>
                      } />
                      <Route path="expenses" element={
                        <ProtectedRoute requiredRoles={['admin', 'manager', 'staff']}>
                          <ExpensesPage />
                        </ProtectedRoute>
                      } />
                      <Route path="sales" element={
                        <ProtectedRoute permission="view_sales">
                          <SalesPage />
                        </ProtectedRoute>
                      } />
                      <Route path="sales-items" element={
                        <ProtectedRoute permission="view_sales">
                          <SalesItems />
                        </ProtectedRoute>
                      } />
                      <Route path="manage-categories" element={<ProductCategoryManager />} />
                      <Route path="tickets" element={<TicketsPage />} />
                      <Route path="qrcodes" element={
                        <ProtectedRoute permission="view_qrcodes">
                          <QRCodesPage />
                        </ProtectedRoute>
                      } />
                      <Route path="marketing" element={
                        <ProtectedRoute permission="view_marketing">
                          <MarketingPage />
                        </ProtectedRoute>
                      } />
                      <Route path="reports" element={
                        <ProtectedRoute permission="view_reports" requiredRoles={['admin', 'manager']}>
                          <ReportsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="business-targets" element={
                        <ProtectedRoute permission="view_business_targets">
                          <BusinessTargetsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="staff" element={
                        <ProtectedRoute permission="manage_staff" requiredRoles={['admin', 'manager']}>
                          <StaffPage />
                        </ProtectedRoute>
                      } />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="admin" element={
                        <ProtectedRoute permission="manage_users" requiredRoles={['admin']}>
                          <AdminPage />
                        </ProtectedRoute>
                      } />
                      <Route path="no-charge-do-over" element={<NoChargeDoOverPage />} />
                      <Route path="ticket-search" element={<TicketSearchPage />} />
                      <Route path="assembly" element={<AssemblyPage />} />
                      <Route path="racking" element={<RackingPage />} />
                      <Route path="pickup-order" element={<PickupOrderPage />} />
                      <Route path="deliveries" element={<DeliveriesPage />} />
                      <Route path="cod-payment" element={<CodPaymentPage />} />
                      <Route path="ready-to-pick" element={<ReadyToPickPage />} />
                      <Route path="commissions" element={<CommissionsPage />} />
                      <Route path="unpaid-balances" element={<UnpaidBalancesPage />} />
                      <Route path="discounts" element={<DiscountsPage />} />
                      <Route path="new-customers" element={<NewCustomersPage />} />
                      <Route path="stock-levels" element={<StockLevelsPage />} />
                      <Route path="customer-rankings" element={<CustomerRankingsPage />} />
                      <Route path="most-performing" element={<MostPerformingPage />} />
                      <Route path="credit-list" element={<CreditListPage />} />
                      <Route path="invoices" element={
                        <ProtectedRoute requiredRoles={['admin', 'manager']}>
                          <InvoicesPage />
                        </ProtectedRoute>
                      } />
                    </Route>
                      </Routes>
                        </ExpenseProvider>
                      </StaffMessageProvider>
                    </ServiceProvider>
                  </RetailProductProvider>
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
