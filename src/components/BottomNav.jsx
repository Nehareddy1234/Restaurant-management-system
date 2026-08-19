
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ListOrdered,
  Grid,
  Menu as MenuIcon,
  ShoppingBag,
  History,
  BarChart3,
  Store,
  PackageSearch,
  Utensils,
  LogOut,
  User,
  DollarSign,
  CreditCard,
  Truck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './BottomNav.css';

const ALL_RESTAURANT_NAV = [
  { path: '/',          icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { path: '/pos',       icon: <ShoppingCart size={18} />,    label: 'New Order' },
  { path: '/orders',    icon: <ListOrdered size={18} />,     label: 'Orders' },
  { path: '/tables',    icon: <Grid size={18} />,            label: 'Tables' },
  { path: '/menu',      icon: <MenuIcon size={18} />,        label: 'Menu' },
  { path: '/grocery',   icon: <ShoppingBag size={18} />,     label: 'Shopping' },
  { path: '/history',   icon: <History size={18} />,         label: 'History' },
  { path: '/pay-later', icon: <CreditCard size={18} />,      label: 'Pay Later' },
  { path: '/expenses',  icon: <DollarSign size={18} />,      label: 'Expenses' },
  { path: '/catering',  icon: <DollarSign size={18} />,      label: 'Catering' },
  { path: '/analytics', icon: <BarChart3 size={18} />,       label: 'Analytics' },
];

const ALL_GROCERY_NAV = [
  { path: '/store/pos',       icon: <ShoppingCart size={18} />,   label: 'Store POS' },
  { path: '/store/inventory', icon: <PackageSearch size={18} />,  label: 'Inventory' },
  { path: '/store/suppliers', icon: <Truck size={18} />,          label: 'Suppliers' },
  { path: '/store/history',   icon: <History size={18} />,        label: 'History' },
  { path: '/store/analytics', icon: <BarChart3 size={18} />,      label: 'Analytics' },
];

const ROLE_COLORS = {
  admin:           '#e84118',
  account_manager: '#6f42c1',
  waiter:          '#17a2b8',
  store_manager:   '#e67e22',
  customer:        '#28a745',
};

const ROLE_LABELS = {
  admin:           'Admin',
  account_manager: 'Accounts',
  waiter:          'Waiter',
  store_manager:   'Store Mgr',
  customer:        'Customer',
};

export default function BottomNav() {
  const { appMode, setAppMode } = useApp();
  const { currentUser, logout, hasAccess } = useAuth();

  const role      = currentUser?.role || 'admin';
  const roleColor = ROLE_COLORS[role] || '#e84118';
  const roleLabel = ROLE_LABELS[role]  || role;

  const restaurantNavItems = ALL_RESTAURANT_NAV.filter(item => hasAccess(item.path));
  const groceryNavItems    = ALL_GROCERY_NAV.filter(item => hasAccess(item.path));
  const activeNavItems     = (appMode === 'restaurant' && role !== 'store_manager')
    ? restaurantNavItems
    : groceryNavItems;

  return (
    <nav className="pill-nav-wrapper">
      {/* ── Brand + user bar ── */}
      <div className="pill-nav-brand">
        <div className="pill-nav-brand-left">
          <div className="pill-nav-logo">NK</div>
          <span className="pill-nav-title">Restaurant Management System</span>
        </div>

        <div className="pill-nav-brand-right">
          {/* User chip */}
          <div
            className="pill-nav-user-chip"
            style={{ borderColor: roleColor + '40' }}
          >
            <div
              className="pill-nav-avatar"
              style={{ background: roleColor }}
            >
              {currentUser?.avatar || <User size={12} />}
            </div>
            <span className="pill-nav-user-name">{currentUser?.displayName}</span>
            <span
              className="pill-nav-role-label"
              style={{ background: roleColor + '18', color: roleColor }}
            >
              {roleLabel}
            </span>
          </div>

          {/* Logout */}
          <button className="pill-nav-logout-btn" onClick={logout}>
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ── Mode switcher ── */}
      {role !== 'customer' && (
        <div className="pill-nav-mode-row">
          {role !== 'store_manager' && (
            <button
              className={`pill-mode-btn${appMode === 'restaurant' ? ' active' : ''}`}
              onClick={() => setAppMode('restaurant')}
            >
              <Utensils size={14} />
              Restaurant
            </button>
          )}
          <button
            className={`pill-mode-btn${appMode === 'grocery' ? ' active' : ''}`}
            onClick={() => setAppMode('grocery')}
          >
            <Store size={14} />
            Grocery Store
          </button>
        </div>
      )}

      {/* ── Main pill nav items ── */}
      <div className="pill-nav-scroll-track">
        {activeNavItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `pill-nav-item${isActive ? ' active' : ''}`}
            end={item.path === '/'}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
