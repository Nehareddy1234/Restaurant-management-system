import {  useState  } from 'react';
import { Plus, Trash2, Check, AlertCircle, Edit, Tag, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Menu.css';

const CATEGORY_PALETTE = [
  { bg: '#ffeef8', border: '#f8b4d9', text: '#c2185b', dot: '#e91e8c' },
  { bg: '#fff3e0', border: '#ffcc80', text: '#e65100', dot: '#ff6d00' },
  { bg: '#e8f5e9', border: '#a5d6a7', text: '#2e7d32', dot: '#43a047' },
  { bg: '#e3f2fd', border: '#90caf9', text: '#1565c0', dot: '#1e88e5' },
  { bg: '#ede7f6', border: '#ce93d8', text: '#6a1b9a', dot: '#8e24aa' },
  { bg: '#fff8e1', border: '#ffe082', text: '#f57f17', dot: '#fdd835' },
  { bg: '#e0f7fa', border: '#80deea', text: '#00695c', dot: '#00acc1' },
  { bg: '#fce4ec', border: '#f48fb1', text: '#880e4f', dot: '#e91e63' },
  { bg: '#f3e5f5', border: '#ce93d8', text: '#4a148c', dot: '#9c27b0' },
  { bg: '#e8f5e9', border: '#80cbc4', text: '#004d40', dot: '#26a69a' },
];

export default function Menu() {
  const { menuItems, addMenuItem, removeMenuItem, toggleMenuItemEnabled, toggleMenuItemOnline, updateMenuItem, foodCategories, addFoodCategory, removeFoodCategory } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(foodCategories?.[0]?.name || '');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [catError, setCatError] = useState('');

  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (catName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: prev[catName] === undefined ? false : !prev[catName]
    }));
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleStartEdit = (item) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(String(item.price));
    setImage(item.image || '');
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setName('');
    setCategory(foodCategories?.[0]?.name || '');
    setPrice('');
    setImage('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) { setError('Item name is required.'); return; }
    if (!price || parseFloat(price) <= 0) { setError('Please enter a valid price greater than 0.'); return; }
    const imageUrl = image.trim() || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=200&h=200';
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, { name: name.trim(), category, price: parseFloat(price), image: imageUrl });
        setEditingItem(null);
        setSuccess('Menu item updated successfully!');
      } else {
        await addMenuItem({ name: name.trim(), category, price: parseFloat(price), image: imageUrl });
        setSuccess('Menu item added successfully!');
      }
      setName(''); setPrice(''); setImage('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to save item: ${err.message}`);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    try {
      await addFoodCategory(newCategoryName);
      setNewCategoryName('');
    } catch (err) {
      setCatError(err.message);
    }
  };

  const getPalette = (index) => CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];

  return (
    <div className="menu-management-page">
      <header className="menu-management-header">
        <div>
          <h1>Menu Management</h1>
          <p className="text-muted">Manage restaurant dishes, add new items, or enable/disable them</p>
        </div>
      </header>

      <div className="menu-management-content">
        <div className="menu-sidebar">
          {/* Add / Edit Form */}
          <div className="add-item-card card">
            <h2>{editingItem ? 'Edit Dish' : 'Add New Dish'}</h2>
            <form onSubmit={handleSubmit} className="add-item-form">
              {error && <div className="form-error"><AlertCircle size={16} /><span>{error}</span></div>}
              {success && <div className="form-success"><Check size={16} /><span>{success}</span></div>}

              <div className="form-group">
                <label htmlFor="item-name">Dish Name *</label>
                <input id="item-name" type="text" placeholder="e.g. Garlic Naan" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="item-category">Category *</label>
                  <select id="item-category" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">Select a category</option>
                    {foodCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="item-price">Price (₹) *</label>
                  <input id="item-price" type="number" placeholder="e.g. 50" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="item-image">Image URL (Optional)</label>
                <input id="item-image" type="url" placeholder="https://example.com/dish.jpg" value={image} onChange={e => setImage(e.target.value)} />
                <span className="helper-text">Leaves default placeholder if empty</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary submit-btn" style={{ flex: 1, marginTop: 0 }}>
                  {editingItem ? <Check size={18} /> : <Plus size={18} />} {editingItem ? 'Save Changes' : 'Add to Menu'}
                </button>
                {editingItem && (
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={handleCancelEdit}>Cancel</button>
                )}
              </div>
            </form>
          </div>

          {/* Category Manager Card */}
          <div className="category-manager-card card">
            <div className="cat-card-header">
              <Tag size={17} />
              <h2>Manage Food Categories</h2>
            </div>
            
            <div className="cat-card-body">
              <form onSubmit={handleAddCategory} className="cat-add-form">
                <div className="cat-input-wrapper">
                  <Plus size={15} className="cat-input-icon" />
                  <input
                    type="text"
                    placeholder="New category name…"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    required
                    className="cat-input"
                  />
                </div>
                <button type="submit" className="cat-add-btn">
                  Add
                </button>
              </form>

              {catError && (
                <div className="cat-error-msg">
                  <AlertCircle size={14} /> {catError}
                </div>
              )}

              <div className="cat-pills-grid">
                {foodCategories.length === 0 ? (
                  <p className="cat-empty-text">No categories yet.</p>
                ) : (
                  foodCategories.map((cat, index) => {
                    const palette = getPalette(index);
                    return (
                      <div
                        key={cat.id}
                        className="cat-pill"
                        style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
                      >
                        <span className="cat-pill-dot" style={{ background: palette.dot }} />
                        <span className="cat-pill-name">{cat.name}</span>
                        <button
                          type="button"
                          className="cat-pill-delete"
                          style={{ color: palette.text }}
                          onClick={() => { if (window.confirm(`Delete category "${cat.name}"?`)) removeFoodCategory(cat.id); }}
                          title={`Delete ${cat.name}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dishes Accordion List */}
        <div className="items-list-card card">
          <h2>Current Dishes ({menuItems.length})</h2>
          <div className="items-accordion-container">
            {menuItems.length === 0 ? (
              <p className="empty-msg">No dishes in the menu. Add one above!</p>
            ) : (
              <div className="accordion-list">
                {Object.entries(groupedItems).map(([catName, items]) => {
                  const isExpanded = expandedCategories[catName] !== false; // default expanded
                  const outOfStockCount = items.filter(i => !i.enabled || !i.availableOnline).length;
                  return (
                    <div key={catName} className="accordion-group">
                      <div className="accordion-header" onClick={() => toggleCategory(catName)}>
                        <div className="accordion-header-info">
                          <h3>{catName} <span className="cat-count">{items.length}</span></h3>
                          {outOfStockCount > 0 && (
                            <span className="out-of-stock-alert">
                              {outOfStockCount} out of {items.length} items are offline/disabled
                            </span>
                          )}
                        </div>
                        <div className="accordion-icon">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="accordion-content">
                          {items.map(item => (
                            <div key={item.id} className="accordion-item-row">
                              <div className="accordion-item-main">
                                <div className="accordion-item-veg-icon">
                                  {/* Dummy veg icon placeholder, replace with actual logic if present */}
                                  <div className="veg-indicator"><div className="dot"></div></div>
                                </div>
                                <div className="accordion-item-details">
                                  <span className="dish-name">{item.name}</span>
                                  {(!item.enabled || !item.availableOnline) ? (
                                    <span className="dish-status out-stock">Unavailable</span>
                                  ) : (
                                    <span className="dish-status in-stock">In stock</span>
                                  )}
                                  <span className="dish-price">₹{item.price}</span>
                                </div>
                              </div>
                              <div className="accordion-item-actions">
                                <div className="toggle-group" title="POS Status (Restaurant)">
                                  <span className="toggle-label">POS</span>
                                  <button className={`switch-btn ${item.enabled ? 'on' : 'off'}`} onClick={() => toggleMenuItemEnabled(item.id)}>
                                    <div className="switch-thumb"></div>
                                  </button>
                                </div>
                                <div className="toggle-group" title="Online Status (Customer App)">
                                  <span className="toggle-label">Online</span>
                                  <button className={`switch-btn ${item.availableOnline ? 'on' : 'off'}`} onClick={() => toggleMenuItemOnline(item.id)}>
                                    <div className="switch-thumb"></div>
                                  </button>
                                </div>
                                <div className="item-action-btns">
                                  <button className="icon-btn edit-btn" onClick={() => handleStartEdit(item)} title="Edit"><Edit size={16} /></button>
                                  <button className="icon-btn delete-btn" title="Delete" onClick={async () => {
                                    if (window.confirm(`Delete ${item.name}?`)) {
                                      try { await removeMenuItem(item.id); } catch (err) { setError(`Failed: ${err.message}`); }
                                    }
                                  }}><Trash2 size={16} /></button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
