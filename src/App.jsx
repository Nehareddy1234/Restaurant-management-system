import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth, ROLE_NAV } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Orders from './pages/Orders';
import Tables from './pages/Tables';
import Menu from './pages/Menu';
import Grocery from './pages/Grocery';
import History from './pages/History';
import PayLater from './pages/PayLater';
import Analytics from './pages/Analytics';
import Catering from './pages/Catering';
import Expenses from './pages/Expenses';
import GroceryInventory from './pages/GroceryInventory';
import GroceryPOS from './pages/GroceryPOS';
import GroceryHistory from './pages/GroceryHistory';
import GroceryAnalytics from './pages/GroceryAnalytics';
import GrocerySupplier from './pages/GrocerySupplier';
import Login from './pages/Login';
import CustomerMenu from './pages/CustomerMenu';
import { Menu as HamburgerIcon } from 'lucide-react';

// ─── Protected Route ─────────────────────────────────
function ProtectedRoute({ children, path }) {
  const { currentUser, hasAccess } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Customers always go to their menu
  if (currentUser.role === 'customer') {
    return <Navigate to="/customer-menu" replace />;
  }

  // Check if this role has access to the requested path
  if (path && !hasAccess(path)) {
    // Redirect to first allowed page for this role
    const fallback = ROLE_NAV[currentUser.role]?.[0] || '/';
    // Prevent infinite loop if somehow fallback is also not allowed or matches current path
    if (fallback === path) return children;
    return <Navigate to={fallback} replace />;
  }

  return children;
}

// ─── Main App Content ────────────────────────────────
function AppContent() {
  const { sidebarMinimized, sidebarOpen, toggleSidebarOpen, closeSidebar } = useApp();
  const { currentUser } = useAuth();

  // Not logged in — show login
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Customer — show their own menu, no sidebar
  if (currentUser.role === 'customer') {
    return (
      <Routes>
        <Route path="/customer-menu" element={<CustomerMenu />} />
        <Route path="*" element={<Navigate to="/customer-menu" replace />} />
      </Routes>
    );
  }

  // Staff — full app with sidebar
  return (
    <div className={'app-container ' + (sidebarMinimized ? 'sidebar-minimized' : '') + ' ' + (sidebarOpen ? 'sidebar-mobile-open' : '')}>
      {/* Mobile Header Bar */}
      <header className="mobile-top-bar">
        <button className="hamburger-btn" onClick={toggleSidebarOpen} aria-label="Open navigation menu">
          <HamburgerIcon size={24} />
        </button>
        <div className="mobile-brand-logo">NK</div>
        <span className="mobile-brand-title">Restaurant Management System</span>
      </header>

      {/* Mobile Backdrop */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar}></div>}

      <Sidebar />
      
      <main className="main-content">
        <Routes>
          <Route path="/"          element={<ProtectedRoute path="/"><Dashboard /></ProtectedRoute>} />
          <Route path="/pos"       element={<ProtectedRoute path="/pos"><POS /></ProtectedRoute>} />
          <Route path="/orders"    element={<ProtectedRoute path="/orders"><Orders /></ProtectedRoute>} />
          <Route path="/tables"    element={<ProtectedRoute path="/tables"><Tables /></ProtectedRoute>} />
          <Route path="/menu"      element={<ProtectedRoute path="/menu"><Menu /></ProtectedRoute>} />
          <Route path="/grocery"   element={<ProtectedRoute path="/grocery"><Grocery /></ProtectedRoute>} />
          <Route path="/history"   element={<ProtectedRoute path="/history"><History /></ProtectedRoute>} />
          <Route path="/pay-later" element={<ProtectedRoute path="/pay-later"><PayLater /></ProtectedRoute>} />
          <Route path="/expenses"  element={<ProtectedRoute path="/expenses"><Expenses /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute path="/analytics"><Analytics /></ProtectedRoute>} />
          
            <Route path="/catering"  element={<ProtectedRoute path="/catering"><Catering /></ProtectedRoute>} />
          <Route path="/store/pos"       element={<ProtectedRoute path="/store/pos"><GroceryPOS /></ProtectedRoute>} />
          <Route path="/store/inventory" element={<ProtectedRoute path="/store/inventory"><GroceryInventory /></ProtectedRoute>} />
          <Route path="/store/suppliers" element={<ProtectedRoute path="/store/suppliers"><GrocerySupplier /></ProtectedRoute>} />
          <Route path="/store/history"   element={<ProtectedRoute path="/store/history"><GroceryHistory /></ProtectedRoute>} />
          <Route path="/store/analytics" element={<ProtectedRoute path="/store/analytics"><GroceryAnalytics /></ProtectedRoute>} />

          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*"      element={<Navigate to={currentUser?.role === 'store_manager' ? '/store/pos' : '/'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <AppContent />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
