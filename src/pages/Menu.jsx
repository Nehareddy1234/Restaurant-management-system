import React, { useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Check, AlertCircle, Edit } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Menu.css';

const CATEGORIES = ['Combos', 'Curries', 'Rotis', 'Rice', 'Drinks', 'Uggani', 'Idli', 'Breakfast'];

export default function Menu() {
  const { menuItems, addMenuItem, removeMenuItem, toggleMenuItemEnabled, updateMenuItem } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingItem, setEditingItem] = useState(null);

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
    setCategory(CATEGORIES[0]);
    setPrice('');
    setImage('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError('Please enter a valid price greater than 0.');
      return;
    }

    // Default image if none provided
    const imageUrl = image.trim() || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=200&h=200';

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, {
          name: name.trim(),
          category,
          price: parseFloat(price),
          image: imageUrl
        });
        setEditingItem(null);
        setSuccess('Menu item updated successfully!');
      } else {
        await addMenuItem({
          name: name.trim(),
          category,
          price: parseFloat(price),
          image: imageUrl
        });
        setSuccess('Menu item added successfully!');
      }
      setName('');
      setPrice('');
      setImage('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to save item: ${err.message}`);
    }
  };

  return (
    <div className="menu-management-page">
      <header className="menu-management-header">
        <div>
          <h1>Menu Management</h1>
          <p className="text-muted">Manage restaurant dishes, add new items, or enable/disable them</p>
        </div>
      </header>

      <div className="menu-management-content">
        {/* Add Item Form */}
        <div className="add-item-card card">
          <h2>{editingItem ? 'Edit Dish' : 'Add New Dish'}</h2>
          <form onSubmit={handleSubmit} className="add-item-form">
            {error && (
              <div className="form-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="form-success">
                <Check size={16} />
                <span>{success}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="item-name">Dish Name *</label>
              <input
                id="item-name"
                type="text"
                placeholder="e.g. Garlic Naan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="item-category">Category *</label>
                <select
                  id="item-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="item-price">Price (₹) *</label>
                <input
                  id="item-price"
                  type="number"
                  placeholder="e.g. 50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="item-image">Image URL (Optional)</label>
              <input
                id="item-image"
                type="url"
                placeholder="https://example.com/dish.jpg"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
              <span className="helper-text">Leaves default placeholder if empty</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary submit-btn" style={{ flex: 1, marginTop: 0 }}>
                {editingItem ? <Check size={18} /> : <Plus size={18} />} {editingItem ? 'Save Changes' : 'Add to Menu'}
              </button>
              {editingItem && (
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Menu Items List */}
        <div className="items-list-card card">
          <h2>Current Dishes ({menuItems.length})</h2>
          <div className="items-table-container">
            {menuItems.length === 0 ? (
              <p className="empty-msg">No dishes in the menu. Add one above!</p>
            ) : (
              <>
                {/* Desktop Table View */}
                <table className="menu-items-table desktop-table">
                  <thead>
                    <tr>
                      <th>Dish</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map(item => (
                      <tr key={item.id} className={item.enabled ? '' : 'item-disabled'}>
                        <td>
                          <div className="table-dish-info">
                            <div className="dish-img" style={{ backgroundImage: `url("${item.image}"), url("https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=200&h=200")` }}></div>
                            <div className="dish-details">
                              <span className="dish-name">{item.name}</span>
                              <span className="dish-mobile-category">{item.category}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="dish-category-badge">{item.category}</span>
                        </td>
                        <td>
                          <strong className="dish-price">₹{item.price}</strong>
                        </td>
                        <td>
                          <button
                            className={`status-toggle-btn ${item.enabled ? 'enabled' : 'disabled'}`}
                            onClick={() => toggleMenuItemEnabled(item.id)}
                            title={item.enabled ? 'Click to Disable' : 'Click to Enable'}
                          >
                            {item.enabled ? (
                              <>
                                <ToggleRight size={24} color="var(--success)" />
                                <span className="status-text">Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={24} color="var(--text-muted)" />
                                <span className="status-text">Disabled</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td>
                          <div className="dish-actions">
                          <button
                            className="edit-dish-btn"
                            onClick={() => handleStartEdit(item)}
                            title="Edit Dish"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="delete-dish-btn"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                                try {
                                  await removeMenuItem(item.id);
                                } catch (err) {
                                  setError(`Failed to remove item: ${err.message}`);
                                }
                              }
                            }}
                            title="Remove from Menu"
                          >
                            <Trash2 size={16} />
                          </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Mobile Card View */}
                <div className="mobile-items-list">
                  {menuItems.map(item => (
                    <div key={item.id} className={`mobile-item-card ${item.enabled ? '' : 'item-disabled'}`}>
                      <div className="mobile-item-header">
                        <div className="mobile-item-info">
                          <span className="dish-name">{item.name}</span>
                          <span className="dish-category-badge">{item.category}</span>
                        </div>
                        <strong className="dish-price">₹{item.price}</strong>
                      </div>
                      <div className="mobile-item-actions">
                        <button
                          className={`status-toggle-btn ${item.enabled ? 'enabled' : 'disabled'}`}
                          onClick={() => toggleMenuItemEnabled(item.id)}
                          title={item.enabled ? 'Click to Disable' : 'Click to Enable'}
                        >
                          {item.enabled ? (
                            <ToggleRight size={20} color="var(--success)" />
                          ) : (
                            <ToggleLeft size={20} color="var(--text-muted)" />
                          )}
                        </button>
                        <button
                          className="edit-dish-btn"
                          onClick={() => handleStartEdit(item)}
                          title="Edit Dish"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="delete-dish-btn"
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                              try {
                                await removeMenuItem(item.id);
                              } catch (err) {
                                setError(`Failed to remove item: ${err.message}`);
                              }
                            }
                          }}
                          title="Remove from Menu"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
