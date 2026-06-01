import React, { useState } from 'react';
import { Search, Calendar, DollarSign, ShoppingBag, Eye, Printer, FileText, Banknote, Smartphone, Edit3, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './History.css';

export default function History() {
  const { orderHistory, tables, correctHistoricalOrder, dataErrors } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    total: '',
    paymentMethod: 'Cash',
    customerName: '',
    tableId: '',
    paidAt: '',
  });
  const [editError, setEditError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [dateFilter, setDateFilter] = useState('All');

  const formatDateKey = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    return year && month && day ? `${year}-${month}-${day}` : null;
  };

  const getOrderDateKey = (order) => {
    const timestampKey = formatDateKey(order.createdAt);
    if (timestampKey) return timestampKey;

    const dateStr = order.date;
    if (!dateStr || dateStr === 'Today') {
      return formatDateKey(new Date());
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    const match = String(dateStr).match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?(?:\s+(\d{4}))?$/);
    if (match) {
      const monthMap = {
        jan: '01', january: '01',
        feb: '02', february: '02',
        mar: '03', march: '03',
        apr: '04', april: '04',
        may: '05',
        jun: '06', june: '06',
        jul: '07', july: '07',
        aug: '08', august: '08',
        sep: '09', sept: '09', september: '09',
        oct: '10', october: '10',
        nov: '11', november: '11',
        dec: '12', december: '12',
      };
      const day = match[1].padStart(2, '0');
      const month = monthMap[match[2].toLowerCase()];
      const year = match[3] || formatDateKey(new Date()).slice(0, 4);
      if (month) return `${year}-${month}-${day}`;
    }

    return dateStr;
  };

  const filteredByDate = dateFilter === 'All' 
    ? orderHistory 
    : orderHistory.filter(o => getOrderDateKey(o) === dateFilter);

  const filteredHistory = filteredByDate
    .filter(order => {
      const matchesId = order.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesNumber = order.orderNumber ? String(order.orderNumber).includes(searchQuery) : false;
      const matchesTable = (order.table || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCustomer = (order.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesId || matchesNumber || matchesTable || matchesCustomer;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const getOrderTotal = (order) => Number(order.total) || 0;
  const getPaymentMethod = (order) => order.paymentMethod || 'Cash';
  const isPaidOrder = (order) => order.paymentStatus !== 'Pending';

  const formatDateTimeInput = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      hourCycle: 'h23',
    }).formatToParts(date);

    const getPart = (type) => parts.find(part => part.type === type)?.value;
    return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
  };

  const openEditOrder = (order) => {
    setEditingOrder(order);
    setEditForm({
      total: String(order.total ?? 0),
      paymentMethod: order.paymentMethod || 'Cash',
      customerName: order.customerName || '',
      tableId: order.tableId ? String(order.tableId) : '',
      paidAt: formatDateTimeInput(order.paidAt || order.createdAt),
    });
    setEditError('');
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveOrderEdit = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    const total = Number(editForm.total);
    if (!Number.isFinite(total) || total < 0) {
      setEditError('Enter a valid total amount.');
      return;
    }
    if (!editForm.paidAt) {
      setEditError('Choose the completed date and time.');
      return;
    }

    setIsSavingEdit(true);
    setEditError('');

    try {
      const updated = await correctHistoricalOrder(editingOrder.id, {
        total,
        paymentMethod: editForm.paymentMethod,
        customerName: editForm.customerName,
        tableId: editForm.tableId ? Number(editForm.tableId) : null,
        paidAt: `${editForm.paidAt}:00+05:30`,
      });
      setEditingOrder(null);
      setSelectedOrder(prev => prev?.id === updated.id ? updated : prev);
    } catch (err) {
      setEditError(err.message || 'Failed to update order.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const paidFilteredByDate = filteredByDate.filter(isPaidOrder);
  const totalRevenue = paidFilteredByDate.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const totalOrders = filteredByDate.length;
  const cashTotal = paidFilteredByDate.reduce((sum, order) => sum + (getPaymentMethod(order) === 'Cash' ? getOrderTotal(order) : 0), 0);
  const upiTotal = paidFilteredByDate.reduce((sum, order) => sum + (getPaymentMethod(order) === 'UPI' ? getOrderTotal(order) : 0), 0);

  const [showEODModal, setShowEODModal] = useState(false);

  // Calculate dish counts for EOD report
  const eodDishCounts = {};
  paidFilteredByDate.forEach(order => {
    order.itemList?.forEach(itemStr => {
      const parts = itemStr.split(' x');
      const namePart = parts[0].replace(/\s*\([^)]+\)/g, '').trim();
      const qty = parseInt(parts[1] || '1', 10);
      
      eodDishCounts[namePart] = (eodDishCounts[namePart] || 0) + qty;
    });
  });

  const sortedEODDishes = Object.entries(eodDishCounts).sort((a,b) => b[1] - a[1]);

  return (
    <div className="history-page">
      <header className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Order History</h1>
          <p className="text-muted">Review completed orders, pending payments, and paid history</p>
        </div>
        <div className="date-filter-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg, #fff)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Calendar size={18} className="text-muted" />
          <input 
            type="date"
            value={dateFilter === 'All' ? '' : dateFilter}
            onChange={(e) => setDateFilter(e.target.value || 'All')}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}
          />
          <button 
            className={`btn ${dateFilter === 'All' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
            onClick={() => setDateFilter('All')}
          >
            Till Date
          </button>
          <button 
            className="btn btn-primary" 
            style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            onClick={() => setShowEODModal(true)}
          >
            <FileText size={16} />
            EOD Report
          </button>
        </div>
      </header>

      {/* Summary Row */}
      <div className="history-summary-row">
        <div className="summary-card card">
          <div className="summary-icon" style={{ background: 'rgba(76, 209, 55, 0.1)', color: 'var(--success)' }}>
            <DollarSign size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Paid Revenue</span>
            <strong className="summary-value">₹{totalRevenue.toLocaleString()}</strong>
          </div>
        </div>

        <div className="summary-card card">
          <div className="summary-icon" style={{ background: 'rgba(9, 132, 227, 0.1)', color: 'var(--primary)' }}>
            <ShoppingBag size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Completed Orders</span>
            <strong className="summary-value">{totalOrders} Orders</strong>
          </div>
        </div>

        <div className="summary-card card">
          <div className="summary-icon" style={{ background: 'rgba(39, 174, 96, 0.1)', color: '#27ae60' }}>
            <Banknote size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Cash Collected</span>
            <strong className="summary-value">₹{cashTotal.toLocaleString()}</strong>
          </div>
        </div>

        <div className="summary-card card">
          <div className="summary-icon" style={{ background: 'rgba(108, 92, 231, 0.1)', color: '#6c5ce7' }}>
            <Smartphone size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total UPI Collected</span>
            <strong className="summary-value">₹{upiTotal.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <div className="history-content">
        {dataErrors?.orders && (
          <div className="history-load-error card">
            Orders could not be loaded: {dataErrors.orders}
          </div>
        )}

        {/* Table list */}
        <div className="history-list-card card">
          <div className="list-header">
            <h2>Order Logs</h2>
            <div className="search-bar">
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder="Search by Order No. or Table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="history-table-container">
            {filteredHistory.length === 0 ? (
              <p className="empty-msg">No historical orders match the search criteria.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Order No.</th>
                    <th>Ordered</th>
                    <th>Paid</th>
                    <th>Name</th>
                    <th>Table</th>
                    <th>Items Count</th>
                    <th>Total Bill</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(order => (
                    <tr key={order.id}>
                      <td><strong className="order-id">#{order.orderNumber}</strong> <span className="text-muted" style={{ fontSize: '0.75rem' }}>({order.id.slice(0, 8)})</span></td>
                      <td>
                        <div className="date-time">
                          <span>{order.date || 'Today'}</span>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{order.time}</span>
                        </div>
                      </td>
                      <td>
                        {order.paymentStatus === 'Pending' ? (
                          <span className="status-paid-badge pending">Pending</span>
                        ) : (
                          <div className="date-time">
                            <span>{order.paidDate || order.date || '-'}</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{order.paidTime || order.closedAt}</span>
                          </div>
                        )}
                      </td>
                      <td>{order.customerName || <span className="text-muted">-</span>}</td>
                      <td><span className="table-badge">{order.table}</span></td>
                      <td>{order.itemList?.length || 0} items</td>
                      <td><strong className="price-label">₹{order.total}</strong></td>
                      <td>{order.paymentStatus === 'Pending' ? 'Pay Later' : (order.paymentMethod || 'Cash')}</td>
                      <td>
                        <div className="history-actions">
                          <button
                            className="btn btn-outline detail-btn"
                            onClick={() => setSelectedOrder(order)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            className="btn btn-outline detail-btn"
                            onClick={() => openEditOrder(order)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Selected Order Detail Sidebar / Popup */}
        {selectedOrder && (
          <div className="order-detail-modal">
            <div className="modal-content card">
              <div className="modal-header">
                <h3>Order #{selectedOrder.orderNumber} <span className="text-muted" style={{ fontSize: '1rem', fontWeight: 'normal' }}>({selectedOrder.id.slice(0, 8)})</span> Details</h3>
                <button className="close-btn" onClick={() => setSelectedOrder(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span>Payment Method</span>
                  <span className={`status-paid-badge ${selectedOrder.paymentStatus === 'Pending' ? 'pending' : ''}`}>
                    {selectedOrder.paymentStatus === 'Pending' ? 'Pay Later' : (selectedOrder.paymentMethod || 'Cash')}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Customer Name</span>
                  <strong>{selectedOrder.customerName || '-'}</strong>
                </div>
                <div className="detail-row">
                  <span>Table/Type</span>
                  <strong>{selectedOrder.table}</strong>
                </div>
                <div className="detail-row">
                  <span>Ordered At</span>
                  <span>{selectedOrder.date || 'Today'} at {selectedOrder.time}</span>
                </div>
                <div className="detail-row">
                  <span>Paid At</span>
                  <span>{selectedOrder.paymentStatus === 'Pending' ? 'Pending' : `${selectedOrder.paidDate || selectedOrder.date || 'Today'} at ${selectedOrder.paidTime || selectedOrder.closedAt}`}</span>
                </div>

                <div className="item-breakdown" style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Dishes Ordered</h4>
                  <ul className="modal-items-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedOrder.itemList?.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="detail-row total" style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <span>Grand Total</span>
                  <strong>₹{selectedOrder.total}</strong>
                </div>

                <div className="modal-actions" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={() => openEditOrder(selectedOrder)} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <Edit3 size={16} /> Edit Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingOrder && (
          <div className="order-detail-modal">
            <div className="modal-content card history-edit-modal">
              <div className="modal-header">
                <h3>Edit Order #{editingOrder.orderNumber}</h3>
                <button className="close-btn" onClick={() => setEditingOrder(null)}>&times;</button>
              </div>
              <form className="history-edit-form" onSubmit={handleSaveOrderEdit}>
                {editError && <div className="history-edit-error">{editError}</div>}

                <div className="form-group">
                  <label>Total Bill</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.total}
                    onChange={(e) => handleEditFormChange('total', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => handleEditFormChange('customerName', e.target.value)}
                    placeholder="Optional name for this order"
                    maxLength={80}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) => handleEditFormChange('paymentMethod', e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Table/Type</label>
                    <select
                      value={editForm.tableId}
                      onChange={(e) => handleEditFormChange('tableId', e.target.value)}
                    >
                      <option value="">Takeaway</option>
                      {tables.map(table => (
                        <option key={table.id} value={table.id}>Table {table.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Completed At</label>
                  <input
                    type="datetime-local"
                    value={editForm.paidAt}
                    onChange={(e) => handleEditFormChange('paidAt', e.target.value)}
                  />
                </div>

                <div className="modal-actions history-edit-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setEditingOrder(null)} disabled={isSavingEdit}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSavingEdit}>
                    <Save size={16} /> {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EOD Report Modal */}
        {showEODModal && (
          <div className="order-detail-modal">
            <div className="modal-content card" style={{ maxWidth: '500px', width: '90%' }}>
              <div className="modal-header">
                <h3>End of Day Report</h3>
                <span className="badge-cat" style={{ marginLeft: '1rem' }}>{dateFilter === 'All' ? 'All-Time' : dateFilter}</span>
                <button className="close-btn" onClick={() => setShowEODModal(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span>Total Revenue Collected</span>
                  <strong style={{ color: 'var(--success)', fontSize: '1.1rem' }}>₹{totalRevenue.toLocaleString()}</strong>
                </div>
                <div className="detail-row">
                  <span>Total Cash Collected</span>
                  <strong>₹{cashTotal.toLocaleString()}</strong>
                </div>
                <div className="detail-row">
                  <span>Total UPI Collected</span>
                  <strong>₹{upiTotal.toLocaleString()}</strong>
                </div>
                <div className="detail-row">
                  <span>Total Orders Processed</span>
                  <strong>{totalOrders}</strong>
                </div>

                <div className="item-breakdown" style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>Dish Quantities Sold</h4>
                  {sortedEODDishes.length === 0 ? (
                    <p className="text-muted">No dishes sold for this date.</p>
                  ) : (
                    <ul className="modal-items-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                      {sortedEODDishes.map(([dish, qty], idx) => (
                        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', padding: '0.4rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                          <span style={{ fontWeight: 500 }}>{dish}</span>
                          <strong>x{qty}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={() => setShowEODModal(false)}>Close</button>
                  <button className="btn btn-primary" onClick={() => { alert('Printing End of Day Report to thermal printer...'); setShowEODModal(false); }} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <Printer size={16} /> Print Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
