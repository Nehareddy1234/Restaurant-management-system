import React, { useState } from 'react';
import { CreditCard, Search, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './PayLater.css';

export default function PayLater() {
  const { orderHistory, settlePayLaterOrder } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [settlingOrderId, setSettlingOrderId] = useState(null);

  const payLaterOrders = orderHistory
    .filter(order => order.paymentStatus === 'Pending')
    .filter(order => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        String(order.orderNumber || '').includes(query) ||
        String(order.id || '').toLowerCase().includes(query) ||
        String(order.customerName || '').toLowerCase().includes(query) ||
        String(order.table || '').toLowerCase().includes(query)
      );
    });

  const pendingTotal = payLaterOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  const handleSettle = async (orderId, paymentMethod) => {
    if (settlingOrderId) return;
    setSettlingOrderId(orderId);
    try {
      await settlePayLaterOrder(orderId, paymentMethod);
    } catch (err) {
      alert(`Could not update payment: ${err.message}`);
    } finally {
      setSettlingOrderId(null);
    }
  };

  return (
    <div className="pay-later-page">
      <header className="pay-later-header">
        <div>
          <h1>Pay Later</h1>
          <p className="text-muted">Track closed orders that still need payment</p>
        </div>
        <div className="pay-later-summary card">
          <CreditCard size={20} />
          <div>
            <span>Pending Amount</span>
            <strong>₹{pendingTotal.toLocaleString()}</strong>
          </div>
        </div>
      </header>

      <div className="pay-later-card card">
        <div className="pay-later-toolbar">
          <h2>Pending Payments</h2>
          <div className="search-bar">
            <Search size={18} className="text-muted" />
            <input
              type="text"
              placeholder="Search by name, order, or table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {payLaterOrders.length === 0 ? (
          <div className="pay-later-empty">
            <CheckCircle size={46} color="var(--success)" />
            <h3>No pending pay later orders</h3>
            <p className="text-muted">Orders closed with Pay Later will appear here.</p>
          </div>
        ) : (
          <div className="pay-later-table-wrap">
            <table className="pay-later-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Order ID</th>
                  <th>Ordered</th>
                  <th>Amount Due</th>
                  <th>How They Pay</th>
                  <th>Settle</th>
                </tr>
              </thead>
              <tbody>
                {payLaterOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.customerName || 'Unnamed'}</strong>
                      <span className="pay-later-subtext">{order.table}</span>
                    </td>
                    <td>
                      <strong>#{order.orderNumber}</strong>
                      <span className="pay-later-subtext">{order.id.slice(0, 8)}</span>
                    </td>
                    <td>
                      <span>{order.date || '-'}</span>
                      <span className="pay-later-subtext">{order.time || ''}</span>
                    </td>
                    <td><strong className="pay-later-amount">₹{Number(order.total || 0).toLocaleString()}</strong></td>
                    <td>
                      <span className="pay-later-status"><Clock size={14} /> Pay Later</span>
                    </td>
                    <td>
                      <div className="pay-later-actions">
                        {['Cash', 'UPI', 'Card'].map(method => (
                          <button
                            key={method}
                            className="btn btn-primary"
                            disabled={settlingOrderId === order.id}
                            onClick={() => handleSettle(order.id, method)}
                          >
                            {settlingOrderId === order.id ? 'Saving...' : method}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
