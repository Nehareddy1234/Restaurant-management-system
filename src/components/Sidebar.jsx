import React from 'react';
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
  ChevronLeft,
  ChevronRight,
  Store,
  PackageSearch,
  Utensils,
  LogOut,
  User,
  DollarSign,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const ALL_RESTAURANT_NAV = [
  { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { path: '/pos', icon: <ShoppingCart size={20} />, label: 'New Order' },
  { path: '/orders', icon: <ListOrdered size={20} />, label: 'Active Orders' },
  { path: '/tables', icon: <Grid size={20} />, label: 'Tables' },
  { path: '/menu', icon: <MenuIcon size={20} />, label: 'Menu' },
  { path: '/grocery', icon: <ShoppingBag size={20} />, label: 'Shopping List' },
  { path: '/history', icon: <History size={20} />, label: 'History' },
  { path: '/pay-later', icon: <CreditCard size={20} />, label: 'Pay Later' },
  { path: '/expenses', icon: <DollarSign size={20} />, label: 'Expenses' },
  { path: '/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
];

const ALL_GROCERY_NAV = [
  { path: '/store/pos', icon: <ShoppingCart size={20} />, label: 'Store POS' },
  { path: '/store/inventory', icon: <PackageSearch size={20} />, label: 'Inventory' },
  { path: '/store/history', icon: <History size={20} />, label: 'Sales History' },
  { path: '/store/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
];

const ROLE_COLORS = {
  admin: '#e84118',
  account_manager: '#6f42c1',
  waiter: '#17a2b8',
  customer: '#28a745',
};

const ROLE_LABELS = {
  admin: 'Admin',
  account_manager: 'Accounts',
  waiter: 'Waiter',
  customer: 'Customer',
};

export default function Sidebar() {
  const { sidebarMinimized, toggleSidebarMinimized, closeSidebar, appMode, setAppMode } = useApp();
  const { currentUser, logout, hasAccess } = useAuth();

  const role = currentUser?.role || 'admin';
  const isAdmin = role === 'admin';

  // Filter nav items by role access
  const restaurantNavItems = ALL_RESTAURANT_NAV.filter(item => hasAccess(item.path));
  const groceryNavItems = ALL_GROCERY_NAV.filter(item => hasAccess(item.path));

  const activeNavItems = appMode === 'restaurant' ? restaurantNavItems : groceryNavItems;
  const roleColor = ROLE_COLORS[role] || '#e84118';
  const roleLabel = ROLE_LABELS[role] || role;

  return (
    <aside className={`sidebar ${sidebarMinimized ? 'minimized' : ''}`}>
      <div className="sidebar-header" style={{ paddingBottom: '0.5rem', borderBottom: 'none' }}>
        <div className="logo-placeholder">NK</div>
        {!sidebarMinimized && <h2>Neha's Kitchen</h2>}
        <button 
          className="sidebar-toggle-btn" 
          onClick={toggleSidebarMinimized}
          title={sidebarMinimized ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarMinimized ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* User Badge */}
      {!sidebarMinimized && (
        <div style={{ margin: '0 1rem 0.75rem 1rem', padding: '0.6rem 0.75rem', borderRadius: '10px', background: roleColor + '15', border: '1px solid ' + roleColor + '30', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: roleColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
            {currentUser?.avatar || <User size={14} />}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.displayName}</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: roleColor, fontWeight: 600 }}>{roleLabel}</p>
          </div>
        </div>
      )}

      {/* Mode Switcher — shown for non-customer roles */}
      {role !== 'customer' && (
        <div className="mode-switcher" style={{ padding: '0 1rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <button 
            className={'btn ' + (appMode === 'restaurant' ? 'btn-primary' : 'btn-outline')}
            onClick={() => setAppMode('restaurant')}
            style={{ width: '100%', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: sidebarMinimized ? 'center' : 'flex-start', gap: '0.5rem', padding: '0.5rem' }}
            title="Restaurant Mode"
          >
            <Utensils size={18} /> {!sidebarMinimized && 'Restaurant'}
          </button>
          <button 
            className={'btn ' + (appMode === 'grocery' ? 'btn-primary' : 'btn-outline')}
            onClick={() => setAppMode('grocery')}
            style={{ width: '100%', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: sidebarMinimized ? 'center' : 'flex-start', gap: '0.5rem', padding: '0.5rem' }}
            title="Grocery Store Mode"
          >
            <Store size={18} /> {!sidebarMinimized && 'Grocery Store'}
          </button>
        </div>
      )}
      
      <nav className="sidebar-nav">
        {activeNavItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => 'nav-item ' + (isActive ? 'active' : '')}
            onClick={closeSidebar}
            title={sidebarMinimized ? item.label : ''}
          >
            <div className="nav-icon-wrapper">{item.icon}</div>
            {!sidebarMinimized && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="nav-item settings-btn" 
          title={sidebarMinimized ? 'Logout' : ''}
          onClick={logout}
          style={{ color: '#e84118', width: '100%' }}
        >
          <div className="nav-icon-wrapper"><LogOut size={20} /></div>
          {!sidebarMinimized && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
