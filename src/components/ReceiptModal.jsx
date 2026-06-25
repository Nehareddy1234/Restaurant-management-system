import React, { useEffect } from 'react';


/**
 * ReceiptModal displays order details and triggers the browser print dialog.
 * Props:
 *   - order: { items: [], total: number, table?: string, customerName?: string, date?: string }
 *   - onClose: () => void
 */
export default function ReceiptModal({ order, onClose }) {
  // Open print dialog when the modal appears
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (value) => `₹${Number(value).toFixed(0)}`;

  const handleRawBTPrint = () => {
    let text = `     Neha's Kitchen\n`;
    text += `--------------------------------\n`;
    text += `Date: ${order.date || new Date().toLocaleString()}\n`;
    if (order.table) text += `Table: ${order.table}\n`;
    if (order.customerName) text += `Customer: ${order.customerName}\n`;
    text += `--------------------------------\n`;
    text += `Item            Qty       Total\n`;
    text += `--------------------------------\n`;
    
    order.items.forEach(it => {
      let name = it.name.substring(0, 15).padEnd(15, ' ');
      let qty = String(it.quantity).padStart(3, ' ');
      let priceVal = (it.price + (it.addOns?.Roti || 0) * 15) * it.quantity;
      let total = `Rs${priceVal}`.padStart(10, ' ');
      text += `${name} ${qty}   ${total}\n`;
    });
    
    text += `--------------------------------\n`;
    text += `TOTAL: Rs${order.total}\n`;
    text += `--------------------------------\n`;
    text += `     Thank you for visiting!    \n\n\n`;

    window.location.href = `rawbt:${encodeURIComponent(text)}`;
  };

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-header">
          <h2>Neha's Kitchen</h2>
          <p>{order.date || new Date().toLocaleString()}</p>
          {order.table && <p>Table: {order.table}</p>}
          {order.customerName && <p>Customer: {order.customerName}</p>}
        </div>
        <hr />
        <div className="receipt-body">
          <table className="receipt-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, idx) => (
                <tr key={idx}>
                  <td>{it.name}</td>
                  <td>{it.quantity}</td>
                  <td>{formatCurrency(it.price)}</td>
                  <td>{formatCurrency((it.price + (it.addOns?.Roti || 0) * 15) * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <hr />
        <div className="receipt-footer">
          <h3>Total: {formatCurrency(order.total)}</h3>
          <div className="receipt-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => window.print()}>Standard Print</button>
            <button className="btn btn-secondary" style={{ background: '#3498db', color: '#fff' }} onClick={handleRawBTPrint}>RawBT Print</button>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
