import {  useState  } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ShoppingBasket } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Grocery.css';

export default function Grocery() {
  const { groceryItems, addGroceryItem, toggleGroceryItem, removeGroceryItem, clearPurchasedGrocery } = useApp();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const qty = quantity ? parseFloat(quantity) : 1;

    addGroceryItem(name.trim(), qty, unit);
    setName('');
    setQuantity('');
  };

  const purchasedCount = groceryItems.filter(item => item.purchased).length;

  return (
    <div className="grocery-page">
      <header className="grocery-header">
        <div>
          <h1>Grocery &amp; Ingredients List</h1>
          <p className="text-muted">Keep track of necessary ingredients to buy for the restaurant</p>
        </div>
      </header>

      <div className="grocery-content">
        {/* Left Side: Add Item Form */}
        <div className="grocery-form-container card">
          <h2>Add Ingredient</h2>
          <form onSubmit={handleSubmit} className="grocery-form">
            <div className="form-group">
              <label htmlFor="grocery-name">Ingredient Name *</label>
              <input
                id="grocery-name"
                type="text"
                placeholder="e.g. Fresh Paneer, Tomatoes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="grocery-qty">Quantity</label>
                <input
                  id="grocery-qty"
                  type="number"
                  placeholder="e.g. 5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="any"
                />
              </div>

              <div className="form-group">
                <label htmlFor="grocery-unit">Unit</label>
                <select
                  id="grocery-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="kg">kg</option>
                  <option value="grams">grams</option>
                  <option value="liters">liters</option>
                  <option value="ml">ml</option>
                  <option value="packets">packets</option>
                  <option value="pieces">pieces</option>
                  <option value="boxes">boxes</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary grocery-submit-btn">
              <Plus size={18} /> Add to List
            </button>
          </form>
        </div>

        {/* Right Side: Interactive List */}
        <div className="grocery-list-container card">
          <div className="list-header">
            <h2>Shopping List ({groceryItems.length})</h2>
            {purchasedCount > 0 && (
              <button className="btn btn-outline clear-btn" onClick={clearPurchasedGrocery}>
                Clear Purchased ({purchasedCount})
              </button>
            )}
          </div>

          <div className="grocery-items-list">
            {groceryItems.length === 0 ? (
              <div className="grocery-empty">
                <ShoppingBasket size={48} className="text-muted" />
                <p>Your shopping list is empty!</p>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Add items on the left to get started.</p>
              </div>
            ) : (
              groceryItems.map(item => (
                <div key={item.id} className={`grocery-item ${item.purchased ? 'purchased' : ''}`}>
                  <button
                    className="toggle-purchased-btn"
                    onClick={() => toggleGroceryItem(item.id)}
                    title={item.purchased ? 'Mark as Not Purchased' : 'Mark as Purchased'}
                  >
                    {item.purchased ? (
                      <CheckCircle2 size={22} color="var(--success)" />
                    ) : (
                      <Circle size={22} color="var(--border-color)" />
                    )}
                  </button>

                  <div className="grocery-item-info">
                    <span className="grocery-item-name">{item.name}</span>
                    <span className="grocery-item-qty">
                      {item.quantity} {item.unit}
                    </span>
                  </div>

                  <button
                    className="delete-grocery-btn"
                    onClick={() => removeGroceryItem(item.id)}
                    title="Remove from list"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
