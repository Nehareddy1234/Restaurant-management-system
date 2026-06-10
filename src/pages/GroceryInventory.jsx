import React, { useState } from 'react';
import { PackageSearch, Plus, Search, Trash2, Edit2, PackagePlus, PackageMinus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Menu.css'; // Reusing Menu CSS for layout consistency

export default function GroceryInventory() {
  const { storeInventory, addStoreItem, updateStoreItemStock } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add new item state
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Staples');
  const [price, setPrice] = useState('');
  const [buyingCost, setBuyingCost] = useState('');
  const [stock, setStock] = useState('');

  const filteredInventory = storeInventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.barcode.includes(searchQuery) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!name || !price || !stock) return;

    addStoreItem({
      name,
      barcode: barcode || Date.now().toString(),
      category,
      price: parseFloat(price),
      buyingCost: parseFloat(buyingCost) || 0,
      stock: parseInt(stock, 10),
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'
    });

    setName('');
    setBarcode('');
    setPrice('');
    setBuyingCost('');
    setStock('');
  };

  const categories = [...new Set(storeInventory.map(i => i.category))];

  return (
    <div className="menu-page">
      <header className="menu-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Store Inventory</h1>
          <p className="text-muted">Manage grocery products, stock levels, and pricing</p>
        </div>
        <div className="search-bar" style={{ background: '#fff', padding: '0.5rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-color)' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search by name or barcode..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none' }}
          />
        </div>
      </header>

      <div className="menu-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="menu-grid card" style={{ display: 'block', padding: '1rem', overflowY: 'auto' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Current Stock ({storeInventory.length} items)</h2>
          
          <table className="history-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Item</th>
                <th>Barcode/SKU</th>
                <th>Category</th>
                <th>Buying Cost</th>
                <th>Selling Price</th>
                <th>Profit Margin</th>
                <th>Stock Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0' }}>
                    <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                    <strong style={{ fontSize: '0.95rem' }}>{item.name}</strong>
                  </td>
                  <td className="text-muted">{item.barcode}</td>
                  <td><span className="badge-cat">{item.category}</span></td>
                  <td><strong>₹{item.buyingCost || 0}</strong></td>
                  <td><strong>₹{item.price}</strong></td>
                  <td>
                    <span style={{ color: item.price > (item.buyingCost || 0) ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {item.buyingCost ? (((item.price - item.buyingCost) / item.buyingCost) * 100).toFixed(1) : 100}%
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input 
                        type="number" 
                        value={item.stock} 
                        min="0"
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          updateStoreItemStock(item.id, isNaN(val) ? 0 : val, item.buyingCost);
                        }}
                        style={{
                          width: '70px',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          outline: 'none',
                          color: item.stock < (item.lowStockThreshold || 10) ? '#fff' : 'var(--text-main)',
                          background: item.stock < (item.lowStockThreshold || 10) ? 'var(--danger)' : '#fff',
                        }}
                      />
                      {item.stock < (item.lowStockThreshold || 10) && (
                        <span style={{ marginLeft: '0.5rem', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}>Low Stock</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No products found. Add some or change your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Product Form — Below Stock Table */}
        <div className="add-menu-item card" style={{ padding: '1.5rem', background: 'linear-gradient(to bottom, #ffffff, #fcfcfc)', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ background: 'var(--primary)', color: '#fff', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackagePlus size={18} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Add New Product</h2>
          </div>

          <form onSubmit={handleAddItem} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Product Name</label>
              <input type="text" placeholder="e.g. Basmati Rice 5kg" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Barcode / SKU <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
              <input type="text" placeholder="Scan or type barcode" value={barcode} onChange={e => setBarcode(e.target.value)} style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none', background: 'var(--bg-color)' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Category</label>
              <input type="text" placeholder="e.g. Staples, Dairy" value={category} onChange={e => setCategory(e.target.value)} required list="grocery-categories" style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none' }} />
              <datalist id="grocery-categories">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Buying Cost (₹)</label>
              <input type="number" min="0" placeholder="0.00" value={buyingCost} onChange={e => setBuyingCost(e.target.value)} style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Selling Price (₹)</label>
              <input type="number" min="0" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} required style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Initial Qty</label>
              <input type="number" min="0" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} required style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, borderRadius: '8px', boxShadow: '0 4px 12px rgba(232, 65, 24, 0.2)' }}>
                <Plus size={20} /> Add to Inventory
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
