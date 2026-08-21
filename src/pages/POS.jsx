import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Package, Move } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp, FALLBACK_FOOD_IMAGE } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './POS.css';

export default function POS() {
  const { tables, menuItems, placeOrder, activeOrders, updateOrder, foodCategories, reorderMenuItems } = useApp();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canSetCustomerName = ['admin', 'account_manager'].includes(currentUser?.role);

  const categories = ['All', ...foodCategories.map(c => c.name)];

  let editOrderId = searchParams.get('edit');
  if (!editOrderId) {
    const match = window.location.href.match(/[?&]edit=([^&]+)/);
    if (match) {
      editOrderId = decodeURIComponent(match[1]);
    }
  }

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadedOrderId, setLoadedOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parcelCharge, setParcelCharge] = useState('');

  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [reorderedItems, setReorderedItems] = useState([]);

  const effectiveItems = isRearrangeMode ? reorderedItems : menuItems;

  // Load existing order when editOrderId changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editOrderId) {
      if (loadedOrderId !== editOrderId) {
        const order = activeOrders.find(o => o.id === editOrderId);
        if (order) {
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
                }
              }
            });
          }
          setCart(reconstructedCart);
          setCustomerName(order.customerName || '');

          if (order.table && order.table.startsWith('Table ')) {
            const tableName = order.table.replace('Table ', '');
            const matchingTable = tables.find(t => t.name === tableName);
            setSelectedTable(matchingTable ? String(matchingTable.id) : '');
          } else {
            setSelectedTable('');
          }
          setLoadedOrderId(editOrderId);
          setActiveTab('menu');
        }
      }
    } else if (loadedOrderId) {
      setCart([]);
      setSelectedTable('');
      setCustomerName('');
      setLoadedOrderId(null);
    }
  }, [editOrderId, activeOrders, menuItems, loadedOrderId, tables]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const availableTables = tables.filter(t => t.status === 'available' || (editOrderId && t.order?.id === editOrderId));
  const enabledItems = effectiveItems.filter(item => item.enabled);

  const filteredItems = enabledItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const getCartQuantity = (itemId) => {
    const item = cart.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev
      .map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0)
    );
  };

  const updateAddOn = (id, type, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const currentAddOns = item.addOns || {};
        const currentVal = currentAddOns[type] || 0;
        const newVal = currentVal + delta;
        return {
          ...item,
          addOns: { ...currentAddOns, [type]: newVal }
        };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const getAddOnTotal = (item) => ((item.addOns?.Roti || 0) * 15);
  const subtotal = cart.reduce((sum, item) => sum + (item.price + getAddOnTotal(item)) * item.quantity, 0);
  const parsedParcelCharge = Number(parcelCharge) || 0;
  const total = subtotal + parsedParcelCharge;

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    const tableId = selectedTable ? parseInt(selectedTable) : null;
    setIsSubmitting(true);

    try {
      if (editOrderId) {
        await updateOrder(editOrderId, cart, tableId, canSetCustomerName ? customerName : undefined, parsedParcelCharge);
      } else {
        await placeOrder(cart, tableId, 'Cash', canSetCustomerName ? customerName : '', parsedParcelCharge);
      }
    } catch (err) {
      alert(`Could not place order: ${err.message}`);
      setIsSubmitting(false);
      return;
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate('/orders');
    }, 1500);

    // Reset form state
    setCart([]);
    setSelectedTable('');
    setCustomerName('');
    setParcelCharge('');
    setLoadedOrderId(null);
    setSearchParams({});
    setActiveTab('menu');
    setIsSubmitting(false);
  };

  const handleCancelEdit = () => {
    setSearchParams({});
    setCart([]);
    setSelectedTable('');
    setCustomerName('');
    setParcelCharge('');
    setLoadedOrderId(null);
    setActiveTab('menu');
  };

  return (
    <div className={`pos-container ${activeTab === 'menu' ? 'show-menu' : 'show-cart'}`}>
      {showSuccess && (
        <div className="order-success-toast">
          {editOrderId ? '✅ Order updated! Redirecting to Active Orders…' : '✅ Order placed! Redirecting to Active Orders…'}
        </div>
      )}

      {/* Mobile Tab Navigation */}
      <div className="pos-mobile-tabs">
        <button 
          className={`pos-mobile-tab ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Menu
        </button>
        <button 
          className={`pos-mobile-tab ${activeTab === 'cart' ? 'active' : ''}`}
          onClick={() => setActiveTab('cart')}
        >
          Current Order {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
        </button>
      </div>

      {/* Menu Section */}
      <div className="pos-menu">
        <header className="pos-header">
          <div>
            <h1>{editOrderId ? `Edit Order ${editOrderId}` : 'New Order'}</h1>
            <p className="text-muted">{editOrderId ? 'Modify items in this active order' : 'Select items to add to the order'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {canSetCustomerName && (
              <button 
                className={`btn ${isRearrangeMode ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}
                onClick={() => {
                  if (!isRearrangeMode) {
                    setReorderedItems(menuItems);
                  }
                  setIsRearrangeMode(!isRearrangeMode);
                }}
                title="Toggle Rearrange Mode"
              >
                <Move size={18} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{isRearrangeMode ? 'Done' : 'Rearrange'}</span>
              </button>
            )}
            <div className="search-bar">
            <Search size={20} className="text-muted" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            </div>
          </div>
        </header>

        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className={`menu-card card ${draggedItemId === item.id ? 'dragging' : ''} ${isRearrangeMode ? 'rearrange-mode' : ''}`}
              onClick={() => !isRearrangeMode && addToCart(item)}
              draggable={isRearrangeMode}
              onDragStart={(e) => {
                if (!isRearrangeMode) return;
                setDraggedItemId(item.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isRearrangeMode || !draggedItemId || draggedItemId === item.id) return;
                const draggedIndex = effectiveItems.findIndex(i => i.id === draggedItemId);
                const targetIndex = effectiveItems.findIndex(i => i.id === item.id);
                if (draggedIndex !== -1 && targetIndex !== -1) {
                  const newItems = [...effectiveItems];
                  const [removed] = newItems.splice(draggedIndex, 1);
                  newItems.splice(targetIndex, 0, removed);
                  setReorderedItems(newItems);
                }
              }}
              onDrop={async (e) => {
                if (!isRearrangeMode) return;
                e.preventDefault();
                setDraggedItemId(null);
                try {
                  await reorderMenuItems(effectiveItems);
                } catch (err) {
                  alert(`Failed to save new order: ${err.message}`);
                }
              }}
              onDragEnd={() => {
                setDraggedItemId(null);
              }}
            >
              <div className="menu-card-image" style={{ position: 'relative', padding: 0, overflow: 'hidden' }}>
                <img 
                  src={item.image && item.image.trim() ? item.image : FALLBACK_FOOD_IMAGE} 
                  alt={item.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'; }}
                />
                {getCartQuantity(item.id) > 0 && (
                  <span className="menu-item-qty-badge" style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2 }}>{getCartQuantity(item.id)}</span>
                )}
              </div>
              <div className="menu-card-content">
                <h3>{item.name}</h3>
                <div className="menu-card-footer">
                  <span className="price">₹{item.price}</span>
                  {!isRearrangeMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="add-btn"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="pos-cart">
        <div className="cart-header">
          <h2>Current Order</h2>
          <span className="cart-count">{cart.length} items</span>
        </div>

        {/* Table Selector */}
        <div className="table-selector">
          <label htmlFor="table-select">Assign Table</label>
          <select
            id="table-select"
            value={selectedTable}
            onChange={e => setSelectedTable(e.target.value)}
          >
            <option value="">Takeaway / No Table</option>
            {availableTables.map(t => (
              <option key={t.id} value={t.id}>Table {t.name} ({t.capacity} seats)</option>
            ))}
          </select>
        </div>

        {canSetCustomerName && (
          <div className="customer-name-selector">
            <label htmlFor="customer-name">Customer Name</label>
            <input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Optional name for this order"
              maxLength={80}
            />
          </div>
        )}

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart size={48} color="var(--border-color)" />
              <p>Your cart is empty</p>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Click a dish to add it</p>
            </div>
          ) : (
            cart.map(item => {
              const itemTotalPrice = (item.price + getAddOnTotal(item)) * item.quantity;
              
              return (
                <div key={item.id} className="cart-item" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div className="cart-item-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</h4>
                      <span className="cart-item-price" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                        ₹{itemTotalPrice.toFixed(0)}
                      </span>
                    </div>
                    <div className="cart-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateQuantity(item.id, -1); }} className="qty-btn"><Minus size={12} /></button>
                      <span className="qty" style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateQuantity(item.id, 1); }} className="qty-btn"><Plus size={12} /></button>
                      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeFromCart(item.id); }} className="delete-btn"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {(item.name.toLowerCase().includes('combo') || item.name.toLowerCase().includes('thali') || item.name.toLowerCase().includes('roti')) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem', background: 'var(--bg-color)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Extra / Less Roti (±₹15)</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateAddOn(item.id, 'Roti', -1); }} className="qty-btn" style={{ padding: '2px 4px' }}><Minus size={10} /></button>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '12px', textAlign: 'center' }}>{item.addOns?.Roti || 0}</span>
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateAddOn(item.id, 'Roti', 1); }} className="qty-btn" style={{ padding: '2px 4px' }}><Plus size={10} /></button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="cart-summary">
          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
          <div className="parcel-charge-input-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={15} />
              <label htmlFor="parcel-charge-input" style={{ cursor: 'pointer' }}>Parcel Charge</label>
            </div>
            <input
              id="parcel-charge-input"
              type="number"
              min="0"
              placeholder="0"
              value={parcelCharge}
              onChange={(e) => setParcelCharge(e.target.value)}
            />
          </div>
          <div className="summary-row total"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.25rem' }}>
            {editOrderId && (
              <button
                className="btn btn-outline"
                style={{ flex: 1, padding: '0.875rem', borderRadius: '10px' }}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
            <button
              className="btn btn-primary checkout-btn"
              style={editOrderId ? { flex: 2, marginTop: 0 } : {}}
              disabled={cart.length === 0 || isSubmitting}
              onClick={handlePlaceOrder}
            >
              {isSubmitting ? 'Saving...' : (editOrderId ? 'Update Order' : 'Place Order')}
            </button>
          </div>
        </div>
      </div>

      {/* Floating View Cart Button (Mobile Only) */}
      {activeTab === 'menu' && cart.length > 0 && (
        <button className="floating-cart-btn" onClick={() => setActiveTab('cart')}>
          <ShoppingCart size={20} />
          <span>View Order ({cart.length} items) • ₹{total.toFixed(0)}</span>
        </button>
      )}
    </div>
  );
}
