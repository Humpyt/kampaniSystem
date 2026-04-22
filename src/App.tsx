import { useState, useEffect, lazy, Suspense } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import StorePage from './pages/StorePage';
import DropPage from './pages/DropPage';
import PickupPage from './pages/PickupPage';
import OperationPage from './pages/OperationPage';
import OperationDetailsPage from './pages/OperationDetailsPage';
import TicketsPage from './pages/TicketsPage';
import NotificationsPage from './pages/NotificationsPage';
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

// Lazy load pages for better performance
const CustomerPage = lazy(() => import('./pages/CustomerPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const BusinessTargetsPage = lazy(() => import('./pages/BusinessTargetsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const PickedItemsPage = lazy(() => import('./pages/PickedItemsPage'));
const BalancesPage = lazy(() => import('./pages/BalancesPage'));
const SalesItems = lazy(() => import('./pages/SalesItems'));
const NoChargeDoOverPage = lazy(() => import('./pages/NoChargeDoOverPage'));
const TicketSearchPage = lazy(() => import('./pages/TicketSearchPage'));
const AssemblyPage = lazy(() => import('./pages/AssemblyPage'));
const RackingPage = lazy(() => import('./pages/RackingPage'));
const PickupOrderPage = lazy(() => import('./pages/PickupOrderPage'));
const DeliveriesPage = lazy(() => import('./pages/DeliveriesPage'));
const CodPaymentPage = lazy(() => import('./pages/CodPaymentPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const ProductCategoryManager = lazy(() => import('./pages/ProductCategoryManager'));
const ReadyToPickPage = lazy(() => import('./pages/ReadyToPickPage'));
const DiscountsPage = lazy(() => import('./pages/DiscountsPage'));
const NewCustomersPage = lazy(() => import('./pages/NewCustomersPage'));
const StockLevelsPage = lazy(() => import('./pages/StockLevelsPage'));
const CustomerRankingsPage = lazy(() => import('./pages/CustomerRankingsPage'));
const MostPerformingPage = lazy(() => import('./pages/MostPerformingPage'));
const CreditListPage = lazy(() => import('./pages/CreditListPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
  </div>
);

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
        className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-r-md hover:bg-gray-700 focus:outline-none z-50"
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

// Creative fix: Instantly check localStorage for token (synchronous)
const getInitialAuth = () => {
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('auth_user');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.id && user?.role) {
        return { token, user, isAuthenticated: true };
      }
    } catch {
      // Invalid user data
    }
  }
  return { token: null, user: null, isAuthenticated: false };
};

function App() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [initialAuth] = useState(getInitialAuth);
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const initializing = useAuthStore(state => state.initializing);
  // Use initialAuth only while auth is being verified; after checkAuth completes, use live state
  const isStoreAuthenticated = initializing ? initialAuth.isAuthenticated : isAuthenticated;

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

  // Initialize authentication in background (non-blocking)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">You're Offline</h2>
          <p className="text-gray-400">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  // Show login page IMMEDIATELY if no token or on login route
  const isLoginPage = location.pathname === '/login';

  if (!initialAuth.isAuthenticated && !isAuthenticated) {
    // If we're still on login page route, show it immediately
    if (isLoginPage) {
      return <LoginPage />;
    }
    // For other routes without auth, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Show login page if explicitly logged out
  if (!isStoreAuthenticated) {
    return <Navigate to="/login" replace />;
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
                        isStoreAuthenticated ? (
                          <Navigate to="/store" replace />
                        ) : (
                          <Navigate to="/login" replace />
                        )
                      }
                    />

                    {/* Login route */}
                    <Route
                      path="/login"
                      element={
                        isStoreAuthenticated ? (
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
                          <Suspense fallback={<PageLoader />}>
                            <CustomerPage />
                          </Suspense>
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
                      <Route path="picked-items" element={
                        <ProtectedRoute permission="create_pickup">
                          <Suspense fallback={<PageLoader />}>
                            <PickedItemsPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="balances" element={
                        <Suspense fallback={<PageLoader />}>
                          <BalancesPage />
                        </Suspense>
                      } />
                      <Route path="operations/details/:id" element={<OperationDetailsPage />} />
                      <Route path="operation" element={
                        <ProtectedRoute permission="view_operations">
                          <OperationPage />
                        </ProtectedRoute>
                      } />
                      <Route path="expenses" element={
                        <ProtectedRoute requiredRoles={['admin', 'manager', 'staff']}>
                          <Suspense fallback={<PageLoader />}>
                            <ExpensesPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="sales" element={
                        <ProtectedRoute permission="view_sales">
                          <Suspense fallback={<PageLoader />}>
                            <SalesPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="sales-items" element={
                        <ProtectedRoute permission="view_sales">
                          <Suspense fallback={<PageLoader />}>
                            <SalesItems />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="manage-categories" element={
                        <Suspense fallback={<PageLoader />}>
                          <ProductCategoryManager />
                        </Suspense>
                      } />
                      <Route path="tickets" element={<TicketsPage />} />
                      <Route path="reports" element={
                        <ProtectedRoute permission="view_reports" requiredRoles={['admin', 'manager']}>
                          <Suspense fallback={<PageLoader />}>
                            <ReportsPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="business-targets" element={
                        <ProtectedRoute permission="view_business_targets">
                          <Suspense fallback={<PageLoader />}>
                            <BusinessTargetsPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="admin" element={
                        <ProtectedRoute permission="manage_users" requiredRoles={['admin']}>
                          <Suspense fallback={<PageLoader />}>
                            <AdminPage />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="no-charge-do-over" element={
                        <Suspense fallback={<PageLoader />}>
                          <NoChargeDoOverPage />
                        </Suspense>
                      } />
                      <Route path="ticket-search" element={
                        <Suspense fallback={<PageLoader />}>
                          <TicketSearchPage />
                        </Suspense>
                      } />
                      <Route path="assembly" element={
                        <Suspense fallback={<PageLoader />}>
                          <AssemblyPage />
                        </Suspense>
                      } />
                      <Route path="racking" element={
                        <Suspense fallback={<PageLoader />}>
                          <RackingPage />
                        </Suspense>
                      } />
                      <Route path="pickup-order" element={
                        <Suspense fallback={<PageLoader />}>
                          <PickupOrderPage />
                        </Suspense>
                      } />
                      <Route path="deliveries" element={
                        <Suspense fallback={<PageLoader />}>
                          <DeliveriesPage />
                        </Suspense>
                      } />
                      <Route path="cod-payment" element={
                        <Suspense fallback={<PageLoader />}>
                          <CodPaymentPage />
                        </Suspense>
                      } />
                      <Route path="policy" element={
                        <Suspense fallback={<PageLoader />}>
                          <PolicyPage />
                        </Suspense>
                      } />
                      <Route path="ready-to-pick" element={
                        <Suspense fallback={<PageLoader />}>
                          <ReadyToPickPage />
                        </Suspense>
                      } />
                      <Route path="discounts" element={
                        <Suspense fallback={<PageLoader />}>
                          <DiscountsPage />
                        </Suspense>
                      } />
                      <Route path="new-customers" element={
                        <Suspense fallback={<PageLoader />}>
                          <NewCustomersPage />
                        </Suspense>
                      } />
                      <Route path="stock-levels" element={
                        <Suspense fallback={<PageLoader />}>
                          <StockLevelsPage />
                        </Suspense>
                      } />
                      <Route path="customer-rankings" element={
                        <Suspense fallback={<PageLoader />}>
                          <CustomerRankingsPage />
                        </Suspense>
                      } />
                      <Route path="most-performing" element={
                        <Suspense fallback={<PageLoader />}>
                          <MostPerformingPage />
                        </Suspense>
                      } />
                      <Route path="credit-list" element={
                        <Suspense fallback={<PageLoader />}>
                          <CreditListPage />
                        </Suspense>
                      } />
                      <Route path="invoices" element={
                        <ProtectedRoute requiredRoles={['admin', 'manager']}>
                          <Suspense fallback={<PageLoader />}>
                            <InvoicesPage />
                          </Suspense>
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
  return <App />;
}

export default AppWithProviders;
