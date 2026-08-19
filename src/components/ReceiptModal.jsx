import {  useEffect, useState  } from 'react';


/**
 * ReceiptModal displays order details and triggers the browser print dialog.
 * Props:
 *   - order: { items: [], total: number, table?: string, customerName?: string, date?: string }
 *   - onClose: () => void
 */
export default function ReceiptModal({ order, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState(order.total);
  const balance = amountTendered - order.total;

  // Open print dialog when the modal appears
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (value) => `₹${Number(value).toFixed(0)}`;

  const handleRawBTPrint = () => {
    let text = `Restaurant Management System\n`;
    text += `--------------------------------\n`;
    text += `Date: ${order.date || new Date().toLocaleString()}\n`;
    if (order.table) text += `Table: ${order.table}\n`;
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
    text += `TOTAL:`.padEnd(20, ' ') + `Rs${order.total}`.padStart(12, ' ') + `\n`;
    text += `Paid via:`.padEnd(20, ' ') + `${paymentMethod}`.padStart(12, ' ') + `\n`;
    if (paymentMethod === 'Cash') {
      text += `Received:`.padEnd(20, ' ') + `Rs${amountTendered}`.padStart(12, ' ') + `\n`;
      text += `Balance:`.padEnd(20, ' ') + `Rs${balance}`.padStart(12, ' ') + `\n`;
    }
    text += `--------------------------------\n`;
    text += `     Thank you for visiting!    \n\n\n`;

    window.location.href = `rawbt:${encodeURIComponent(text)}`;
  };

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-header">
          <h2>Restaurant Management System</h2>
          <p>{order.date || new Date().toLocaleString()}</p>
          {order.table && <p>Table: {order.table}</p>}
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
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <h3>Total: {formatCurrency(order.total)}</h3>
            <p style={{ margin: '4px 0' }}>Paid via: {paymentMethod}</p>
            {paymentMethod === 'Cash' && (
              <>
                <p style={{ margin: '4px 0' }}>Received: {formatCurrency(amountTendered)}</p>
                <p style={{ margin: '4px 0' }}>Balance: {formatCurrency(balance)}</p>
              </>
            )}
          </div>
          <div className="receipt-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ marginRight: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px' }}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
              </select>
              {paymentMethod === 'Cash' && (
                <input 
                  type="number" 
                  value={amountTendered} 
                  onChange={e => setAmountTendered(Number(e.target.value))}
                  style={{ padding: '0.4rem', width: '80px', borderRadius: '4px', border: '1px solid #ccc' }}
                  min={order.total}
                />
              )}
            </div>
            <button className="btn btn-secondary" onClick={() => window.print()}>Standard Print</button>
            <button className="btn btn-secondary" style={{ background: '#3498db', color: '#fff' }} onClick={handleRawBTPrint}>RawBT Print</button>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
