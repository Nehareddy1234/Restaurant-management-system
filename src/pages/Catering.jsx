import {  useState  } from 'react';
import { DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Catering.css';

export default function Catering() {
  const { logOldSettlement } = useApp();
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customText, setCustomText] = useState('');
  const [orderDate, setOrderDate] = useState(''); // ISO date string
  const [deliveryDate, setDeliveryDate] = useState(''); // ISO date string
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !amount || !orderDate) return;
    setIsSubmitting(true);
    try {
      await logOldSettlement(customerName.trim(), Number(amount), 'Catering', {
        customText,
        orderDate,
        deliveryDate,
      });
      alert('Catering payment recorded and added to history.');
      setCustomerName('');
      setAmount('');
      setCustomText('');
      setOrderDate('');
      setDeliveryDate('');
    } catch (err) {
      alert(`Failed to record catering payment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="catering-page">
      <header className="catering-header card">
        <DollarSign size={20} />
        <div>
          <span>Catering Service</span>
          <strong>Record Received Payments</strong>
        </div>
      </header>

      <div className="catering-form-card card">
        <form onSubmit={handleSubmit} className="catering-form">
           <div className="form-group">
             <label>Customer Name</label>
             <input
               type="text"
               required
               placeholder="e.g., Rahul"
               value={customerName}
               onChange={(e) => setCustomerName(e.target.value)}
             />
           </div>
           <div className="form-group">
             <label>Amount Received (₹)</label>
             <input
               type="number"
               required
               min="1"
               placeholder="0"
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
             />
           </div>
           <div className="form-group">
             <label>Custom Text</label>
             <textarea
               value={customText}
               onChange={(e) => setCustomText(e.target.value)}
               placeholder="Enter any notes"
               rows={2}
             />
           </div>
           <div className="form-group">
             <label>Order Date</label>
             <input
               type="date"
               required
               value={orderDate}
               onChange={(e) => setOrderDate(e.target.value)}
             />
           </div>
           <div className="form-group">
             <label>Delivery Date</label>
             <input
               type="date"
               value={deliveryDate}
               onChange={(e) => setDeliveryDate(e.target.value)}
             />
           </div>
           <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
             {isSubmitting ? 'Recording...' : 'Add Record'}
           </button>
        </form>
      </div>
    </div>
  );
}
