import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CartList } from '../components/CartComponents.jsx';
import { SectionTitle, PriceSummary } from '../components/CommonComponents.jsx';
import { checkoutService } from '../services/api/checkoutService.js';

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

export function ConfirmationPage({ go, cart, updateQty, totals }) {
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => sessionStorage.getItem('checkoutDate') || '');
  const [selectedTime, setSelectedTime] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; checkoutService.getSlots().then((result) => { if (active) { setSlots(result); setLoading(false); } }).catch((error) => { if (active) { setValidationMessage(error.message); setLoading(false); } }); return () => { active = false; }; }, []);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    sessionStorage.setItem('checkoutDate', e.target.value);
    setSelectedTime('');
    setValidationMessage('');
  };

  const handleTimeClick = (slot) => {
    setSelectedTime(slot.startTime ?? slot.time ?? slot);
    sessionStorage.setItem('checkoutTime', JSON.stringify(slot));
    setValidationMessage('');
  };

  const handleConfirmClick = () => {
    if (!selectedDate || !selectedTime) {
      const missing = [];
      if (!selectedDate) missing.push('date');
      if (!selectedTime) missing.push('time');
      setValidationMessage(`Please select both date and ${missing.join(' and ')}.`);
      return;
    }
    const slot = JSON.parse(sessionStorage.getItem('checkoutTime') || '{}');
    setSubmitting(true);
    checkoutService.selectDateTime(selectedDate, slot.startTime ?? selectedTime, slot.endTime ?? selectedTime).then(() => go('/address')).catch((error) => setValidationMessage(error.message)).finally(() => setSubmitting(false));
  };

  return (
    <div className="animate-in">
      <BackButton />
      <section className="section checkout-grid">
        <div>
          <SectionTitle title="Service Confirmation" />
          <CartList cart={cart} updateQty={updateQty} />
          <div className="panel mt-5">
            <h3>Select date & time</h3>
            <input 
              className="field" 
              type="date" 
              value={selectedDate}
              onChange={handleDateChange}
            />
            <div className="slot-grid">
              {loading && <p>Loading available slots…</p>}
              {slots.map((slot, index) => (
                <button 
                  key={slot.id ?? `${slot.startTime ?? slot.time}-${index}`}
                  className={selectedTime === (slot.startTime ?? slot.time ?? slot) ? 'selected-slot' : ''}
                  onClick={() => handleTimeClick(slot)}
                >
                  {slot.label ?? slot.time ?? `${slot.startTime ?? ''} - ${slot.endTime ?? ''}`}
                </button>
              ))}
            </div>
            {validationMessage && <p className="coupon-error">{validationMessage}</p>}
          </div>
        </div>
        <PriceSummary 
          totals={totals} 
          next={handleConfirmClick} 
          label="Confirm booking"
          disabled={!selectedDate || !selectedTime || submitting}
        />
      </section>
    </div>
  );
}
