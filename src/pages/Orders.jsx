import { useState } from 'react';
import { ChefHat, CheckCircle, Clock, Printer, Edit, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ReceiptModal from '../components/ReceiptModal.jsx';
import './Orders.css';

const statusConfig = {
  Preparing: { bg: 'rgba(253,203,110,0.2)', color: '#e17055', icon: <Clock size={14} /> },
  Ready:     { bg: 'rgba(0,184,148,0.15)',  color: '#00b894', icon: <CheckCircle size={14} /> },
};

export default function Orders() {
  const { activeOrders, markOrderReady, closeOrder, deleteOrder, refreshData, menuItems } = useApp();
  const [dialogOrderId, setDialogOrderId] = useState(null);
  const [closingOrderId, setClosingOrderId] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const navigate = useNavigate();

  const handleCloseOrder = async (orderId, paymentMethod) => {
    if (closingOrderId) return;

    setClosingOrderId(orderId);
    try {
      await closeOrder(orderId, paymentMethod);
      setDialogOrderId(null);
    } catch (err) {
      alert(`Could not close order: ${err.message}`);
    } finally {
      setClosingOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to permanently delete this order?')) {
      try {
        await deleteOrder(orderId);
      } catch (err) {
        alert(`Could not delete order: ${err.message}`);
      }
    }
  };

  const handlePrintReceipt = (order) => {
    const reconstructedCart = [];
    if (order.items && order.items.length > 0) {
      order.items.forEach(oi => {
        const menuItem = menuItems.find(item => item.id === oi.menuItemId);
        if (menuItem) {
          reconstructedCart.push({
            ...menuItem,
            quantity: oi.quantity,
            addOns: oi.addOns || {}
          });
        }
      });
    } else {
      (order.itemList || []).forEach(itemStr => {
        const match = itemStr.match(/(.+) x(\d+)$/);
        if (match) {
          const fullName = match[1];
          const qty = parseInt(match[2], 10);
          const cleanName = fullName.replace(/\s*\([^)]+\)/g, '').trim();
          const menuItem = menuItems.find(item => item.name === cleanName);
          if (menuItem) {
            reconstructedCart.push({ ...menuItem, quantity: qty });
          } else {
            reconstructedCart.push({ name: cleanName, quantity: qty, price: 0 });
          }
        }
      });
    }

    setReceiptData({
      items: reconstructedCart,
      total: order.total,
      table: order.table,
      customerName: order.customerName,
      date: order.time,
      orderId: order.id
    });
    setShowReceipt(true);
  };

  return (
    <div className="orders-page">
      {showReceipt && receiptData && (
        <ReceiptModal
          order={receiptData}
          onClose={() => setShowReceipt(false)}
        />
      )}
      <header className="orders-header">
        <div>
          <h1>Active Orders</h1>
          <p className="text-muted">{activeOrders.length} order{activeOrders.length !== 1 ? 's' : ''} currently in progress</p>
        </div>
        <button className="btn btn-icon" onClick={refreshData} title="Refresh orders">
          <RefreshCw size={20} />
        </button>
      </header>

      {activeOrders.length === 0 ? (
        <div className="orders-empty">
          <ChefHat size={56} color="var(--border-color)" />
          <h3>No active orders</h3>
          <p className="text-muted">All orders have been served. Well done!</p>
        </div>
      ) : (
        <div className="orders-grid">
          {activeOrders.map(order => {
            const sc = statusConfig[order.status] || { bg: '#eee', color: '#666', icon: null };
            return (
              <div key={order.id} className="order-card card">
                <div className="order-card-header">
                  <div>
                    <span className="order-id">#{order.orderNumber}</span> <span className="text-muted" style={{ fontSize: '0.7rem' }}>({order.id.slice(0, 8)})</span>
                    <span className="order-table">{order.table}</span>
                    {order.customerName && <span className="order-customer">{order.customerName}</span>}
                  </div>
                  <span className="order-status-badge" style={{ background: sc.bg, color: sc.color }}>
                    {sc.icon} {order.status}
                  </span>
                </div>

                <div className="order-items-list">
                  {(order.itemList || []).map((item, i) => (
                    <div key={i} className="order-item-row">{item}</div>
                  ))}
                </div>

                <div className="order-card-footer">
                  <span className="order-time text-muted">{order.time}</span>
                  <span className="order-total">₹{order.total}</span>
                </div>

                <div className="order-actions">
                  <button className="btn btn-outline" onClick={() => navigate(`/pos?edit=${encodeURIComponent(order.id)}`)}>
                    <Edit size={15} /> Edit
                  </button>
                  <button className="btn btn-outline" style={{ color: '#d63031', borderColor: '#d63031' }} onClick={() => handleDeleteOrder(order.id)}>
                    <Trash2 size={15} /> Delete
                  </button>

                  {order.status === 'Preparing' && (
                    <button className="btn btn-outline" onClick={() => markOrderReady(order.id)}>
                      <CheckCircle size={15} /> Mark Ready
                    </button>
                  )}
                  {order.status === 'Ready' && (
                      <>
                        <button className="btn btn-primary" onClick={() => setDialogOrderId(order.id)}>
                          <Printer size={15} /> Bill & Close
                        </button>
                    <button className="btn btn-outline" onClick={() => handlePrintReceipt(order)}>
                      <Printer size={15} /> Print Receipt
                    </button>
                        {dialogOrderId === order.id && (
                          <div className="payment-dialog">
                            <button className="btn btn-primary" disabled={closingOrderId === order.id} onClick={() => handleCloseOrder(order.id, 'Cash')}>
                              {closingOrderId === order.id ? 'Closing...' : 'Cash'}
                            </button>
                            <button className="btn btn-primary" disabled={closingOrderId === order.id} onClick={() => handleCloseOrder(order.id, 'UPI')}>
                              UPI
                            </button>
                            <button className="btn btn-primary" disabled={closingOrderId === order.id} onClick={() => handleCloseOrder(order.id, 'Card')}>
                              Card
                            </button>
                            <button className="btn btn-outline" disabled={closingOrderId === order.id} onClick={() => handleCloseOrder(order.id, 'Pay Later')}>
                              Pay Later
                            </button>
                            <button className="btn btn-outline" disabled={closingOrderId === order.id} onClick={() => setDialogOrderId(null)}>
                              Cancel
                            </button>
                          </div>
                        )}
                      </>
                )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
