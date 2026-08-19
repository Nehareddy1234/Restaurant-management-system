import {  useState  } from 'react';
import { Search, Plus, Truck, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './History.css'; 

export default function GrocerySupplier() {
  const { supplierOrders, storeInventory, placeSupplierOrder, updateSupplierOrder } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [cart, setCart] = useState([]);

  // New Item State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyingCost, setBuyingCost] = useState('');

  const filteredOrders = supplierOrders.filter(order => 
    order.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = () => {
    if (!selectedProductId || !quantity || !buyingCost) return;
    const product = storeInventory.find(p => p.id === selectedProductId);
    if (!product) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id 
          ? { ...item, quantity: item.quantity + parseInt(quantity), buyingCost: parseFloat(buyingCost) }
          : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        quantity: parseInt(quantity), 
        buyingCost: parseFloat(buyingCost) 
      }];
    });

    setSelectedProductId('');
    setQuantity('');
    setBuyingCost('');
  };

  const handlePlaceOrder = () => {
    if (!selectedSupplier || cart.length === 0) return;
    placeSupplierOrder(selectedSupplier, cart);
    setShowAddModal(false);
    setSelectedSupplier('');
    setCart([]);
  };

  const totalUnpaid = supplierOrders
    .filter(o => o.paymentStatus !== 'Paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="history-page">
      <header className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Supplier Orders</h1>
          <p className="text-muted">Manage inventory orders and payments with suppliers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> New Order
        </button>
      </header>

      <div className="history-summary-row">
        <div className="summary-card card">
          <div className="summary-icon" style={{ background: 'rgba(9, 132, 227, 0.1)', color: 'var(--primary)' }}>
            <Truck size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Orders placed</span>
            <strong className="summary-value">{supplierOrders.length}</strong>
          </div>
        </div>
        <div className="summary-card card">
          <div className="summary-icon" style={{ background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger)' }}>
            <DollarSign size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Unpaid Amount</span>
            <strong className="summary-value">₹{totalUnpaid.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <div className="history-content">
        <div className="history-list-card card">
          <div className="list-header">
            <h2>Order History</h2>
            <div className="search-bar">
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder="Search Supplier or Order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="history-table-container">
            {filteredOrders.length === 0 ? (
              <p className="empty-msg">No supplier orders found.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Order ID / Date</th>
                    <th>Supplier</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const d = new Date(order.orderDate || '');
                    return (
                      <tr key={order.id}>
                        <td>
                          <strong className="order-id">#{order.id.slice(0, 8)}</strong>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{d.toLocaleDateString()}</div>
                        </td>
                        <td><strong>{order.supplierName}</strong></td>
                        <td><strong className="price-label">₹{order.totalAmount}</strong></td>
                        <td>
                          <span className={order.status === 'Received' ? 'badge-cat' : 'badge-cat'} style={{ background: order.status === 'Received' ? 'rgba(76, 209, 55, 0.1)' : 'rgba(253, 203, 110, 0.2)', color: order.status === 'Received' ? 'var(--success)' : '#e1b12c' }}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <span className={order.paymentStatus === 'Paid' ? 'badge-cat' : 'badge-cat'} style={{ background: order.paymentStatus === 'Paid' ? 'rgba(76, 209, 55, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: order.paymentStatus === 'Paid' ? 'var(--success)' : 'var(--danger)' }}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {order.status !== 'Received' && (
                              <button className="btn btn-outline" onClick={() => updateSupplierOrder(order.id, { status: 'Received' })} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                                Mark Received
                              </button>
                            )}
                            {order.paymentStatus !== 'Paid' && (
                              <button className="btn btn-outline" onClick={() => updateSupplierOrder(order.id, { paymentStatus: 'Paid' })} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="order-detail-modal">
          <div className="modal-content card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Create Supplier Order</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Supplier Name</label>
                <input type="text" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} placeholder="e.g. Metro Wholesale" style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end', marginBottom: '1rem', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px' }}>
                <div className="form-group">
                  <label>Product</label>
                  <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <option value="">Select Item...</option>
                    {storeInventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Qty</label>
                  <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                </div>
                <div className="form-group">
                  <label>Cost/Unit</label>
                  <input type="number" min="0" value={buyingCost} onChange={e => setBuyingCost(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                </div>
                <button className="btn btn-primary" onClick={handleAddToCart} style={{ padding: '0.7rem' }}>Add</button>
              </div>

              {cart.length > 0 && (
                <div className="item-breakdown" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4>Order Items</h4>
                  <ul className="modal-items-list" style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {cart.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>{item.name} x{item.quantity} (@ ₹{item.buyingCost}/ea)</span>
                        <strong>₹{item.buyingCost * item.quantity}</strong>
                      </li>
                    ))}
                  </ul>
                  <div className="detail-row total" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <span>Grand Total</span>
                    <strong>₹{cart.reduce((sum, item) => sum + (item.buyingCost * item.quantity), 0)}</strong>
                  </div>
                </div>
              )}

              <button className="btn btn-primary" onClick={handlePlaceOrder} disabled={!selectedSupplier || cart.length === 0} style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}>
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
