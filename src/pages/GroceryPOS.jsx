import {  useState  } from 'react';
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, SmartphoneNfc } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './GroceryPOS.css';

// Colorful category palette
const CATEGORY_COLORS = [
  { bg: '#fff3cd', text: '#856404', border: '#ffc107' },
  { bg: '#d1ecf1', text: '#0c5460', border: '#17a2b8' },
  { bg: '#d4edda', text: '#155724', border: '#28a745' },
  { bg: '#f8d7da', text: '#721c24', border: '#dc3545' },
  { bg: '#e2d9f3', text: '#432874', border: '#6f42c1' },
  { bg: '#fde8d8', text: '#7d3c10', border: '#fd7e14' },
  { bg: '#d6e4f7', text: '#0c2d6b', border: '#3b82f6' },
];

function getCatColor(index) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

function CategoryPill({ cat, idx, isActive, onClick }) {
  const color = getCatColor(idx);
  const shadow = isActive ? ('0 2px 8px ' + color.border + '88') : 'none';
  return (
    <button
      onClick={onClick}
      className="grocery-category-pill"
      style={{
        border: '2px solid ' + (isActive ? color.border : 'transparent'),
        background: isActive ? color.bg : '#f1f3f5',
        color: isActive ? color.text : '#6c757d',
        fontWeight: isActive ? 700 : 500,
        boxShadow: shadow,
        transform: isActive ? 'translateY(-2px)' : 'none',
      }}
    >
      {cat}
    </button>
  );
}

function ProductCard({ item, onAdd }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onAdd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="grocery-product-card"
      style={{
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 8px 20px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <img src={item.image} alt={item.name} className="grocery-product-image" />
      <div className="grocery-product-info">
        <h3 className="grocery-product-title">{item.name}</h3>
        <div className="grocery-product-footer">
          <span className="grocery-product-price">₹{item.price}</span>
          <span className={`grocery-product-stock-badge ${item.stock < 10 ? 'low-stock' : 'in-stock'}`}>
            Qty: {item.stock}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GroceryPOS() {
  const { storeInventory, checkoutStoreOrder } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'cart' on mobile viewports

  const categories = ['All', ...new Set(storeInventory.map(i => i.category))];

  const filteredInventory = storeInventory.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.stock > 0;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          const product = storeInventory.find(p => p.id === id);
          const newQty = item.quantity + delta;
          if (newQty > product.stock || newQty < 1) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      checkoutStoreOrder(cart, paymentMethod);
      setCart([]);
      setIsProcessing(false);
      setActiveTab('menu');
      alert('Transaction Successful!');
    }, 600);
  };

  return (
    <div className="grocery-pos-container">
      {/* Mobile Navigation Tabs */}
      <div className="grocery-mobile-tabs">
        <button 
          className={`grocery-mobile-tab ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Products
        </button>
        <button 
          className={`grocery-mobile-tab ${activeTab === 'cart' ? 'active' : ''}`}
          onClick={() => setActiveTab('cart')}
        >
          Checkout {cart.length > 0 && <span className="grocery-cart-badge" style={{ marginLeft: '0.4rem' }}>{cart.length}</span>}
        </button>
      </div>

      <div className={`grocery-layout ${activeTab === 'menu' ? 'show-menu' : 'show-cart'}`}>
        {/* Left Catalog Section */}
        <div className="grocery-catalog-section">
          {/* Search Bar */}
          <div className="grocery-search-bar">
            <Search size={20} color="#999" />
            <input
              type="text"
              placeholder="Scan barcode or search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="grocery-search-input"
              autoFocus
            />
          </div>

          {/* Category Pills */}
          <div className="grocery-category-tabs">
            {categories.map((cat, idx) => (
              <CategoryPill
                key={cat}
                cat={cat}
                idx={idx}
                isActive={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              />
            ))}
          </div>

          {/* Product Grid */}
          <div className="grocery-grid-scroll">
            <div className="grocery-grid">
              {filteredInventory.map(item => (
                <ProductCard key={item.id} item={item} onAdd={() => addToCart(item)} />
              ))}
              {filteredInventory.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No products available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="grocery-cart-panel">
          <div className="grocery-cart-header">
            <h2 className="grocery-cart-title">
              <ShoppingCart size={20} />
              Current Checkout
              {cart.length > 0 && (
                <span className="grocery-cart-badge">
                  {cart.length}
                </span>
              )}
            </h2>
          </div>

          <div className="grocery-cart-items">
            {cart.length === 0 ? (
              <div className="grocery-cart-empty">
                <ShoppingCart size={36} style={{ opacity: 0.2, margin: '0 auto 0.75rem auto' }} />
                <p>Tap products above to add them here.</p>
              </div>
            ) : (
              <ul className="grocery-cart-list">
                {cart.map(item => (
                  <li key={item.id} className="grocery-cart-item">
                    <img src={item.image} alt={item.name} className="grocery-cart-item-image" />
                    <div className="grocery-cart-item-info">
                      <h4 className="grocery-cart-item-name">{item.name}</h4>
                      <span className="grocery-cart-item-price">₹{item.price}</span>
                    </div>
                    <div className="grocery-cart-item-actions">
                      <button onClick={() => updateCartQty(item.id, -1)} className="grocery-cart-qty-btn">-</button>
                      <span className="grocery-cart-qty-val">{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="grocery-cart-qty-btn">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="grocery-cart-delete-btn">
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
          )}
          </div>

          {/* Payment + Checkout Footer */}
          <div className="grocery-cart-footer">
            <label className="grocery-payment-label">Payment Method</label>
            <div className="grocery-payment-methods">
              <button className={'btn ' + (paymentMethod === 'Cash' ? 'btn-primary' : 'btn-outline')} onClick={() => setPaymentMethod('Cash')} style={{ flex: 1, padding: '0.55rem', display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                <Banknote size={16} /> Cash
              </button>
              <button className={'btn ' + (paymentMethod === 'UPI' ? 'btn-primary' : 'btn-outline')} onClick={() => setPaymentMethod('UPI')} style={{ flex: 1, padding: '0.55rem', display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                <SmartphoneNfc size={16} /> UPI
              </button>
              <button className={'btn ' + (paymentMethod === 'Card' ? 'btn-primary' : 'btn-outline')} onClick={() => setPaymentMethod('Card')} style={{ flex: 1, padding: '0.55rem', display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                <CreditCard size={16} /> Card
              </button>
            </div>
            
            <div className="grocery-cart-total-row">
              <span className="grocery-cart-total-label">Total</span>
              <strong className="grocery-cart-total-value">₹{cartTotal.toLocaleString()}</strong>
            </div>
            
            <button
              className="btn btn-primary grocery-checkout-btn"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Pay ₹' + cartTotal.toLocaleString()}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Checkout Action Button (Mobile Products view only) */}
      {activeTab === 'menu' && cart.length > 0 && (
        <button className="grocery-mobile-floating-cart" onClick={() => setActiveTab('cart')}>
          <ShoppingCart size={20} />
          <span>View Checkout ({cart.length} items) • ₹{cartTotal.toLocaleString()}</span>
        </button>
      )}
    </div>
  );
}
