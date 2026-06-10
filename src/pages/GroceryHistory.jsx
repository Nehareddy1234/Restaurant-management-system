import React, { useState } from 'react';
import { Search, DollarSign, ShoppingBag, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './History.css'; // Reuse History CSS

export default function GroceryHistory() {
  const { storeOrders } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredHistory = storeOrders.filter(order => {
    const idMatch = (order.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const numberMatch = order.orderNumber && order.orderNumber.toString().includes(searchQuery);
    return idMatch || numberMatch;
  });

  const totalRevenue = storeOrders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
  const totalOrders = storeOrders.length;

  return (
    <div className="history-page">
      <header className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Store Sales History</h1>
          <p className="text-muted">Review all completed retail grocery orders</p>
        </div>
      </header>

      {/* Summary Row */}
      <div className="history-summary-row">
        <div className="summary-card card">
          <div className="summary-icon" style={{ background: 'rgba(76, 209, 55, 0.1)', color: 'var(--success)' }}>
            <DollarSign size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Store Revenue</span>
            <strong className="summary-value">₹{totalRevenue.toLocaleString()}</strong>
          </div>
        </div>

        <div className="summary-card card">
          <div className="summary-icon" style={{ background: 'rgba(9, 132, 227, 0.1)', color: 'var(--primary)' }}>
            <ShoppingBag size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Store Orders</span>
            <strong className="summary-value">{totalOrders} Orders</strong>
          </div>
        </div>
      </div>

      <div className="history-content">
        {/* Table list */}
        <div className="history-list-card card">
          <div className="list-header">
            <h2>Retail Order Logs</h2>
            <div className="search-bar">
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder="Search by Order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="history-table-container">
            {filteredHistory.length === 0 ? (
              <p className="empty-msg">No historical retail orders match the search criteria.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date &amp; Time</th>
                    <th>Payment Method</th>
                    <th>Items Count</th>
                    <th>Total Bill</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(order => {
                    const dateObj = new Date(order.orderDate || order.createdAt || Date.now());
                    const dateStr = dateObj.toLocaleDateString();
                    const timeStr = dateObj.toLocaleTimeString();
                    return (
                    <tr key={order.id}>
                      <td><strong className="order-id">#{order.orderNumber}</strong> <span className="text-muted" style={{ fontSize: '0.75rem' }}>({order.id ? order.id.slice(0, 8) : ''})</span></td>
                      <td>
                        <div className="date-time">
                          <span>{dateStr}</span>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>at {timeStr}</span>
                        </div>
                      </td>
                      <td><span className="badge-cat">{order.paymentMethod}</span></td>
                      <td>{order.items?.length || 0} items</td>
                      <td><strong className="price-label">₹{order.totalAmount || order.total}</strong></td>
                      <td>
                        <button
                          className="btn btn-outline detail-btn"
                          onClick={() => setSelectedOrder({ ...order, dateStr, timeStr })}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Eye size={14} /> View Details
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Selected Order Detail Popup */}
        {selectedOrder && (
          <div className="order-detail-modal">
            <div className="modal-content card">
              <div className="modal-header">
                <h3>Order #{selectedOrder.orderNumber} <span className="text-muted" style={{ fontSize: '1rem', fontWeight: 'normal' }}>({selectedOrder.id.slice(0, 8)})</span> Details</h3>
                <button className="close-btn" onClick={() => setSelectedOrder(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span>Payment Method</span>
                  <span className="status-paid-badge">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="detail-row">
                  <span>Completed At</span>
                  <span>{selectedOrder.date} at {selectedOrder.time}</span>
                </div>

                <div className="item-breakdown" style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Items Purchased</h4>
                  <ul className="modal-items-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedOrder.items?.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>
                          {item.name || item.product?.name || 'Item'} x{item.quantity}
                          {item.buyingCost > 0 && <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>(Cost: ₹{item.buyingCost})</span>}
                        </span>
                        <strong>₹{item.price * item.quantity}</strong>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="detail-row total" style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <span>Grand Total</span>
                  <strong>₹{selectedOrder.totalAmount || selectedOrder.total}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
