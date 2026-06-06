import React, { useState } from 'react';
import { CreditCard, Search, CheckCircle, Clock, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './PayLater.css';

export default function PayLater() {
  const { orderHistory, settlePayLaterOrder, logOldSettlement } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [settlingOrderId, setSettlingOrderId] = useState(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [oldName, setOldName] = useState('');
  const [oldAmount, setOldAmount] = useState('');
  const [oldMethod, setOldMethod] = useState('Cash');
  const [isLogging, setIsLogging] = useState(false);

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

  const handleLogOld = async (e) => {
    e.preventDefault();
    if (!oldName.trim() || !oldAmount || isLogging) return;
    setIsLogging(true);
    try {
      await logOldSettlement(oldName, Number(oldAmount), oldMethod);
      setShowAddForm(false);
      setOldName('');
      setOldAmount('');
      setOldMethod('Cash');
      // Optional: a non-blocking toast would be better, but alert works
      alert('Old settlement logged successfully! It has been added to today\'s revenue.');
    } catch (err) {
      alert(`Could not log settlement: ${err.message}`);
    } finally {
      setIsLogging(false);
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
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-bar">
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder="Search by name, order, or table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? <X size={18} /> : <Plus size={18} />}
              {showAddForm ? 'Close Form' : 'Log Old Settlement'}
            </button>
          </div>
        </div>

        {showAddForm && (
          <form className="old-settlement-form" onSubmit={handleLogOld}>
            <div className="form-group">
              <label>Customer Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Rahul"
                value={oldName}
                onChange={e => setOldName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Amount Received (₹)</label>
              <input 
                type="number" 
                required 
                min="1"
                placeholder="0"
                value={oldAmount}
                onChange={e => setOldAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={oldMethod} onChange={e => setOldMethod(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLogging} style={{ alignSelf: 'flex-end', height: '42px' }}>
              {isLogging ? 'Logging...' : 'Log Payment'}
            </button>
          </form>
        )}

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
