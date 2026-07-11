import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PriceSummary } from '../components/CommonComponents.jsx';
import { FormatService } from '../services/FormatService.js';
import { orderService } from '../services/api/orderService.js';

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

export function SummaryPage({ go, cart, address, totals }) {
  const [transactionId, setTransactionId] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  React.useEffect(() => { if (!address?.id) go('/address'); }, [address, go]);
  const confirmOrder = async () => {
    if (!address?.id) return go('/address');
    if (!sessionStorage.getItem('checkoutDate') || !sessionStorage.getItem('checkoutTime')) return go('/confirmation');
    if (!transactionId.trim()) return setStatus('Enter the payment transaction ID after completing payment.');
    if (submitting) return;
    setSubmitting(true); setStatus('Preparing your order…');
    try {
      const prepared = await orderService.checkout();
      const code = prepared?.orderCode ?? prepared?.data?.orderCode ?? prepared?.order?.orderCode;
      if (!code) throw new Error('Checkout did not return an order code.');
      const result = await orderService.place(code, { paymentStatus: 'Paid', paymentMode: 'Upi', transctionId: transactionId.trim() });
      const id = result?.orderId ?? result?.data?.orderId ?? result?.order?._id ?? code;
      setOrderId(String(id)); setStatus('Order confirmed.'); sessionStorage.setItem('lastOrderId', String(id)); go('/success');
    } catch (error) { setStatus(error.message || 'Unable to create order.'); } finally { setSubmitting(false); }
  };
  return (
    <div className="animate-in">
      <BackButton />
      <section className="section checkout-grid">
        <div className="panel">
          <h2>Booking Summary</h2>
          <div className="info-box">
            <h3>Customer details</h3>
            <p>
              {address.name} · {address.phone}
            </p>
            <p>
              {address.line}, {address.area}, {address.city} - {address.pincode}
            </p>
          </div>
          <div className="info-box">
            <h3>Services booked</h3>
            {cart.map((item) => (
              <p key={item.id}>
                {item.name} x {item.qty}
                <span>{FormatService.formatPrice(item.price * item.qty)}</span>
              </p>
            ))}
          </div>
          <div className="info-box"><h3>Online payment</h3><input className="field" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="Payment transaction ID" /><p className="muted">Complete payment using the supported payment provider, then enter its transaction ID.</p></div>
          {status && <p className="error-text">{status}</p>}
        </div>
        <PriceSummary totals={totals} next={confirmOrder} label={submitting ? 'Creating order…' : 'Confirm booking'} disabled={submitting} />
      </section>
    </div>
  );
}
