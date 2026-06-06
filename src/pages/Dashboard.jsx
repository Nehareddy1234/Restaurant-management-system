import React, { useState } from 'react';
import { TrendingUp, ShoppingBag, Users, ArrowUpRight, ChefHat, Key, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const statusBadge = (status) => {
  const map = {
    Preparing: { bg: 'rgba(253,203,110,0.2)', color: '#e17055' },
    Ready:     { bg: 'rgba(0,184,148,0.15)',  color: '#00b894' },
    Paid:      { bg: 'rgba(99,110,114,0.12)', color: '#636e72' },
  };
  const s = map[status] || map.Paid;
  return <span className="status-badge" style={{ background: s.bg, color: s.color }}>{status}</span>;
};

const getIstDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
};

export default function Dashboard() {
  const { tables, activeOrders, orderHistory } = useApp();
  const { currentUser, employees } = useAuth();
  const navigate = useNavigate();

  const [visiblePasswords, setVisiblePasswords] = useState({});

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isAdmin = currentUser?.role === 'admin';
  const occupied  = tables.filter(t => t.status === 'occupied').length;
  const total     = tables.length;
  const todayKey = getIstDateKey();
  const todayRevenue = orderHistory
    .filter(order => order.paymentStatus !== 'Pending')
    .filter(order => getIstDateKey(order.createdAt) === todayKey)
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  const stats = [
    { label: "Today's Revenue",  value: `₹${todayRevenue.toLocaleString()}`, change: '', icon: <TrendingUp size={22} />, color: '#e84118' },
    { label: 'Active Orders',    value: activeOrders.length, change: '', icon: <ShoppingBag size={22} />, color: '#0097e6' },
    { label: 'Tables Occupied',  value: `${occupied}/${total}`, change: '', icon: <Users size={22} />, color: '#8c7ae6' },
  ];

  // Combine active and recent history for the table preview
  const recentOrders = [
    ...activeOrders.slice(0, 3),
    ...orderHistory.slice(0, 2),
  ].slice(0, 5);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="header-brand">
          <ChefHat size={28} color="var(--primary)" />
          <span>Neha's Kitchen</span>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card card">
            <div className="stat-icon" style={{ background: `${stat.color}18`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <h2 className="stat-value">{stat.value}</h2>
              {stat.change && (
                <span className="stat-change">
                  <ArrowUpRight size={14} /> {stat.change} from yesterday
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="recent-section card">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => navigate('/orders')}
          >
            View All
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0', fontSize: '0.9rem' }}>
            No orders yet. <button className="link-btn" onClick={() => navigate('/pos')}>Create one →</button>
          </p>
        ) : (
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order No.</th>
                  <th>Table</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td><strong>#{order.orderNumber}</strong> <span className="text-muted" style={{ fontSize: '0.75rem' }}>({order.id.slice(0, 8)})</span></td>
                    <td>{order.table}</td>
                    <td>{order.itemList?.length ?? '—'} items</td>
                    <td><strong>₹{order.total}</strong></td>
                    <td>{statusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Credentials Directory (Admin only) */}
      {isAdmin && (
        <div className="recent-section card" style={{ marginTop: '1.5rem' }}>
          <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={20} color="var(--primary)" />
            <h2>Employee Credentials Directory</h2>
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            View system usernames and passwords for active staff accounts.
          </p>
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>System Role</th>
                  <th>Username</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                {employees?.map(emp => (
                  <tr key={emp.id}>
                    <td><strong>{emp.displayName}</strong></td>
                    <td>
                      <span className="badge-cat" style={{ background: emp.role === 'admin' ? 'rgba(232,65,24,0.12)' : emp.role === 'account_manager' ? 'rgba(140,122,230,0.12)' : 'rgba(9,132,227,0.12)', color: emp.role === 'admin' ? '#e84118' : emp.role === 'account_manager' ? '#8c7ae6' : '#0984e3' }}>
                        {emp.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td><code>{emp.username}</code></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <code style={{ background: '#f5f6fa', padding: '0.2rem 0.4rem', borderRadius: '6px', fontSize: '0.9rem', color: '#2f3542' }}>
                          {visiblePasswords[emp.id] ? emp.password : '••••••••'}
                        </code>
                        <button
                          onClick={() => togglePasswordVisibility(emp.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a4b0be', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
                          title={visiblePasswords[emp.id] ? "Hide Password" : "Show Password"}
                        >
                          {visiblePasswords[emp.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

