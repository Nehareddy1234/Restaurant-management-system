import {  useState  } from 'react';
import { Users, CheckCircle, Clock, Edit, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Tables.css';

export default function Tables() {
  const { tables, freeTable, updateTableStatus, menuItems, updateOrderItemQuantity } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const available = tables.filter(t => t.status === 'available').length;
  const occupied  = tables.filter(t => t.status === 'occupied').length;
  const reserved  = tables.filter(t => t.status === 'reserved').length;

  const handleSelect = (table) => {
    setSelected(prev => prev?.id === table.id ? null : table);
  };

  const handleFree = (id) => {
    freeTable(id);
    setSelected(null);
  };

  // keep selected in sync when global state updates
  const selectedLive = selected ? tables.find(t => t.id === selected.id) : null;

  return (
    <div className="tables-page">
      <div className="tables-content-area">
        <header className="tables-header">
          <div>
            <h1>Table Management</h1>
            <p className="text-muted">Live floor layout — click a table to manage it</p>
          </div>
          <div className="table-legend">
            <span className="legend-item available">Available ({available})</span>
            <span className="legend-item occupied">Occupied ({occupied})</span>
            <span className="legend-item reserved">Reserved ({reserved})</span>
          </div>
        </header>

        <div className="floor-layout">
          {tables.map(table => (
            <div
              key={table.id}
              className={`table-card ${table.status} ${selectedLive?.id === table.id ? 'selected' : ''}`}
              onClick={() => handleSelect(table)}
            >
              <div className="table-name">{table.name}</div>
              <div className="table-capacity">
                <Users size={14} />
                <span>{table.capacity} seats</span>
              </div>

              {table.status === 'occupied' && table.order && (
                <div className="table-order-info">
                  <span className="order-ref">#{table.order.orderNumber || table.order.id.slice(0, 8)}</span>
                  <span className="order-total">₹{table.order.total}</span>
                  <span className="order-items">
                    {table.order.itemList?.map(item => {
                      const parts = item.split(' x');
                      return `${parts[0]} (x${parts[1] || '1'})`;
                    }).join(', ') || `${table.order.items} items`}
                  </span>
                </div>
              )}
              {table.status === 'available' && (
                <div className="table-free-badge"><CheckCircle size={16} /> Free</div>
              )}
              {table.status === 'reserved' && (
                <div className="table-reserved-badge"><Clock size={16} /> Reserved</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedLive && <div className="table-detail-backdrop" onClick={() => setSelected(null)}></div>}

      {/* Detail Panel */}
      {selectedLive && (
        <div className="table-detail-panel card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0 }}>Table {selectedLive.name}</h3>
            <button
              onClick={() => setSelected(null)}
              style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', fontWeight: '500', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%' }}
            >
              &times;
            </button>
          </div>
          <p className="text-muted" style={{ fontSize: '0.825rem', margin: 0 }}>
            {selectedLive.capacity} seats &bull; Status: <strong style={{ textTransform: 'capitalize' }}>{selectedLive.status}</strong>
          </p>

          <div className="status-changer" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Change Status Manually</label>
            <select
              value={selectedLive.status}
              onChange={(e) => updateTableStatus(selectedLive.id, e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'white',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied (Manual)</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

          {selectedLive.status === 'occupied' && selectedLive.order && (
            <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="detail-row" style={{ padding: '0.35rem 0' }}><span>Order No.</span><strong>#{selectedLive.order.orderNumber || selectedLive.order.id.slice(0, 8)}</strong></div>
              
              <div style={{ margin: '0.25rem 0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>ITEMS &amp; QUANTITIES</span>
                <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {selectedLive.order.itemList?.map((item, idx) => {
                    const parts = item.split(' x');
                    const fullName = parts[0];
                    const qty = parseInt(parts[1] || '1', 10);
                    
                    const cleanName = fullName.replace(/\s*\([^)]+\)/g, '').trim();
                    const menuItem = menuItems.find(m => m.name === cleanName);
                    const isCombo = menuItem?.category === 'Combos';
                    
                    const rotiCount = (() => {
                      const m = fullName.match(/([+-]\d+)\s*Rotis?/i);
                      return m ? parseInt(m[1], 10) : 0;
                    })();
                    const curryCount = (() => {
                      const m = fullName.match(/([+-]\d+)\s*Curries?/i);
                      return m ? parseInt(m[1], 10) : 0;
                    })();
                    
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', padding: '0.35rem 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)', flex: 1, paddingRight: '0.5rem' }}>{cleanName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateOrderItemQuantity(selectedLive.order.id, cleanName, -1); }}
                              style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' }}
                            >
                              <Minus size={10} />
                            </button>
                            <span style={{ fontWeight: 700, minWidth: '12px', textAlign: 'center', fontSize: '0.8rem' }}>{qty}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateOrderItemQuantity(selectedLive.order.id, cleanName, 1); }}
                              style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' }}
                            >
                              <Plus size={10} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateOrderItemQuantity(selectedLive.order.id, cleanName, -qty); }}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '0.15rem' }}
                            >
                              <Trash2 size={12} color="var(--primary)" />
                            </button>
                          </div>
                        </div>
                        
                        {isCombo && (
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem', paddingLeft: '0.4rem', borderLeft: '2px solid var(--primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              <span>Roti:</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateOrderItemQuantity(selectedLive.order.id, cleanName, 0, 'Roti', -1); }}
                                style={{ border: 'none', background: '#e1e2e6', borderRadius: '3px', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                              >
                                -
                              </button>
                              <strong style={{ minWidth: '14px', textAlign: 'center', color: rotiCount !== 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                                {rotiCount > 0 ? `+${rotiCount}` : rotiCount}
                              </strong>
                              <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateOrderItemQuantity(selectedLive.order.id, cleanName, 0, 'Roti', 1); }}
                                style={{ border: 'none', background: '#e1e2e6', borderRadius: '3px', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                              >
                                +
                              </button>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              <span>Curry:</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateOrderItemQuantity(selectedLive.order.id, cleanName, 0, 'Curry', -1); }}
                                style={{ border: 'none', background: '#e1e2e6', borderRadius: '3px', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                              >
                                -
                              </button>
                              <strong style={{ minWidth: '14px', textAlign: 'center', color: curryCount !== 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                                {curryCount > 0 ? `+${curryCount}` : curryCount}
                              </strong>
                              <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); updateOrderItemQuantity(selectedLive.order.id, cleanName, 0, 'Curry', 1); }}
                                style={{ border: 'none', background: '#e1e2e6', borderRadius: '3px', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="detail-row" style={{ padding: '0.35rem 0' }}><span>Bill Total</span><strong>₹{selectedLive.order.total}</strong></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.5rem' }}
                  onClick={() => navigate(`/pos?edit=${encodeURIComponent(selectedLive.order.id)}`)}
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.5rem' }}
                  onClick={() => handleFree(selectedLive.id)}
                >
                  Pay &amp; Free
                </button>
              </div>
            </div>
          )}
          {selectedLive.status === 'available' && (
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              This table is currently free and available for seating.
            </p>
          )}
          {selectedLive.status === 'reserved' && (
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              This table has been reserved. Awaiting guest arrival.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
