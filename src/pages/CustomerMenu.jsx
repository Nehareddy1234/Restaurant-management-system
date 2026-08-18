import { useState } from 'react';
import { ShoppingCart, Search, Minus, Plus, Trash2, Banknote, CreditCard, SmartphoneNfc, CheckCircle2, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './CustomerMenu.css';

export default function CustomerMenu() {
  const { menuItems, placeOrder, foodCategories } = useApp();
  const { currentUser, logout } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Dine-In');
  const [tableNo, setTableNo] = useState(currentUser?.displayName || 'Table');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'cart' on mobile viewports
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['All', ...(foodCategories || []).map(c => c.name)];

  const filteredItems = menuItems.filter(item => {
    if (item.enabled === false) return false;
    if (item.availableOnline === false) return false;
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c)
    );
  };

  const removeItem = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    // Format cart items for placeOrder function
    const cartForOrder = cart.map(c => ({
      id: c.id,
      name: c.name,
      price: c.price,
      category: c.category || 'Other',
      quantity: c.qty,
      addOns: { Roti: 0, Curry: 0 },
    }));

    // For Dine-In try to parse table number, else null for Takeaway
    const tableIdMatch = orderType === 'Dine-In' ? tableNo.match(/\d+/) : null;
    const tableId = tableIdMatch ? parseInt(tableIdMatch[0], 10) : null;

    let placedOrderId;
    try {
      placedOrderId = await placeOrder(cartForOrder, tableId, paymentMethod);
    } catch (err) {
      alert(`Could not place order: ${err.message}`);
      setIsSubmitting(false);
      return;
    }
    setOrderId(placedOrderId ? `#${String(placedOrderId).slice(-8)}` : '#ORD-CUST');
    setCart([]);
    setOrderPlaced(true);
    setActiveTab('menu');
    setIsSubmitting(false);
  };

  if (orderPlaced) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem 2rem', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '80px', height: '80px', background: '#eafaf1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <CheckCircle2 size={44} color="#28a745" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 0.5rem 0' }}>Order Placed!</h2>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>Your order <strong>{orderId}</strong> has been sent to the kitchen.</p>
          <p style={{ color: '#adb5bd', fontSize: '0.85rem', marginBottom: '2rem' }}>A waiter will serve you shortly. 🍽️</p>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 700, borderRadius: '12px', marginBottom: '0.5rem' }}
            onClick={() => setOrderPlaced(false)}
          >
            Order More
          </button>
          <button
            className="btn btn-outline"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 700, borderRadius: '12px', color: '#dc3545', borderColor: '#dc3545' }}
            onClick={logout}
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-menu-container">
      {/* Top Bar */}
      <header className="customer-header">
        <div className="customer-brand">
          <span className="customer-brand-icon">🍽️</span>
          <div>
            <h1 className="customer-brand-title">Restaurant Management System</h1>
            <p className="customer-brand-welcome">Welcome, {currentUser?.displayName}</p>
          </div>
        </div>

        <div className="customer-header-actions">
          <div className="customer-cart-badge-btn" onClick={() => setActiveTab('cart')}>
            <ShoppingCart size={20} />
            <span style={{ fontWeight: 700 }}>Cart</span>
            {cartCount > 0 && (
              <span className="customer-cart-count">{cartCount}</span>
            )}
          </div>

          <button onClick={logout} className="customer-logout-btn">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Mobile Navigation Tabs */}
      <div className="customer-mobile-tabs">
        <button 
          className={`customer-mobile-tab ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Menu
        </button>
        <button 
          className={`customer-mobile-tab ${activeTab === 'cart' ? 'active' : ''}`}
          onClick={() => setActiveTab('cart')}
        >
          Current Order {cartCount > 0 && <span className="customer-cart-count" style={{ marginLeft: '0.4rem' }}>{cartCount}</span>}
        </button>
      </div>

      <div className={`customer-layout ${activeTab === 'menu' ? 'show-menu' : 'show-cart'}`}>
        {/* Menu Section */}
        <div className="customer-menu-section">
          {/* Search */}
          <div className="customer-search-bar">
            <Search size={18} color="#adb5bd" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="customer-search-input"
            />
          </div>

          {/* Category Tabs */}
          <div className="customer-category-tabs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`customer-category-tab ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="customer-grid-scroll">
            <div className="customer-grid">
              {filteredItems.map(item => (
                <div key={item.id} className="customer-dish-card">
                  {item.image ? (
                    <div 
                      className="customer-dish-image" 
                      style={{ backgroundImage: `url("${item.image}"), url("https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=200&h=200")` }}
                    />
                  ) : (
                    <div className="customer-dish-image-placeholder">
                      🍛
                    </div>
                  )}
                  <div className="customer-dish-info">
                    <h3 className="customer-dish-name">{item.name}</h3>
                    <span className="customer-dish-category">{item.category}</span>
                    <div className="customer-dish-footer">
                      <strong className="customer-dish-price">₹{item.price}</strong>
                      <button
                        onClick={() => addToCart(item)}
                        className="customer-dish-add-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Panel */}
        <div className="customer-cart-panel">
          <div className="customer-cart-header">
            <ShoppingCart size={20} color="#e84118" />
            <h2 className="customer-cart-title">Your Order</h2>
          </div>

          {/* Order Type */}
          <div className="customer-cart-type-selector">
            <div className="customer-cart-type-buttons">
              {['Dine-In', 'Takeaway'].map(type => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`customer-cart-type-btn ${orderType === type ? 'active' : ''}`}
                >{type}</button>
              ))}
            </div>
            {orderType === 'Dine-In' && (
              <input
                type="text"
                value={tableNo}
                onChange={e => setTableNo(e.target.value)}
                placeholder="Table number / name"
                className="customer-cart-table-input"
              />
            )}
          </div>

          {/* Cart Items */}
          <div className="customer-cart-items">
            {cart.length === 0 ? (
              <div className="customer-cart-empty">
                <ShoppingCart size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>Tap + to add items</p>
              </div>
            ) : (
              <div className="customer-cart-list">
                {cart.map(item => (
                  <div key={item.id} className="customer-cart-item">
                    <div className="customer-cart-item-info">
                      <p className="customer-cart-item-name">{item.name}</p>
                      <p className="customer-cart-item-price">₹{item.price * item.qty}</p>
                    </div>
                    <div className="customer-cart-item-actions">
                      <button onClick={() => updateQty(item.id, -1)} className="customer-cart-qty-btn"><Minus size={12} /></button>
                      <span className="customer-cart-item-qty">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="customer-cart-qty-btn"><Plus size={12} /></button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="customer-cart-item-delete"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment + Total + CTA */}
          <div className="customer-cart-footer">
            <p className="customer-payment-title">PAYMENT</p>
            <div className="customer-payment-methods">
              {[
                { id: 'Cash', icon: <Banknote size={14} /> },
                { id: 'UPI', icon: <SmartphoneNfc size={14} /> },
                { id: 'Card', icon: <CreditCard size={14} /> },
              ].map(({ id, icon }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  className={`customer-payment-btn ${paymentMethod === id ? 'active' : ''}`}
                >
                  {icon} {id}
                </button>
              ))}
            </div>

            <div className="customer-cart-total-row">
              <span className="customer-cart-total-label">Total</span>
              <strong className="customer-cart-total-value">₹{cartTotal.toLocaleString()}</strong>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || isSubmitting}
              className="customer-cart-checkout-btn"
            >
              {isSubmitting ? 'Saving...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Checkout Button (Mobile Menu Tab Only) */}
      {activeTab === 'menu' && cartCount > 0 && (
        <button className="customer-mobile-floating-cart" onClick={() => setActiveTab('cart')}>
          <ShoppingCart size={20} />
          <span>View Order ({cartCount} items) • ₹{cartTotal.toLocaleString()}</span>
        </button>
      )}
    </div>
  );
}
