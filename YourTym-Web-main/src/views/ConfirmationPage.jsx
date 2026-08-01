import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react';
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
  const hasCartItems = Array.isArray(cart) && cart.length > 0;
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => sessionStorage.getItem('checkoutDate') || '');
  const [selectedTime, setSelectedTime] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    if (!hasCartItems) {
      setSlots([]);
      setLoading(false);
      setSelectedDate('');
      setSelectedTime('');
      setValidationMessage('');
      sessionStorage.removeItem('checkoutDate');
      sessionStorage.removeItem('checkoutTime');
      return () => { active = false; };
    }
    setLoading(true);
    checkoutService.getSlots().then((result) => {
      if (active) { setSlots(result); setLoading(false); }
    }).catch((error) => {
      if (active) { setValidationMessage(error.message); setLoading(false); }
    });
    return () => { active = false; };
  }, [hasCartItems]);

  const handleDateChange = (value) => {
    setSelectedDate(value);
    sessionStorage.setItem('checkoutDate', value);
    setSelectedTime('');
    setValidationMessage('');
  };

  const slotValue = (slot) => typeof slot === 'string'
    ? slot
    : slot.startTime ?? slot.start_time ?? slot.slotStartTime ?? slot.fromTime ?? slot.timeFrom
      ?? slot.time ?? slot.slotTime ?? slot.timeSlot ?? slot.start ?? slot.from ?? slot.value ?? '';
  const slotLabel = (slot) => {
    if (typeof slot === 'string') return slot;
    const direct = [slot.label, slot.displayName, slot.name, slot.slotName, slot.title, slot.timeSlot, slot.time, slot.slotTime, slot.value]
      .find((value) => value !== undefined && value !== null && String(value).trim());
    if (direct) return direct;
    if (slot.startTime && slot.endTime) return `${slot.startTime} - ${slot.endTime}`;
    if (slot.slotStartTime && slot.slotEndTime) return `${slot.slotStartTime} - ${slot.slotEndTime}`;
    if (slot.fromTime && slot.toTime) return `${slot.fromTime} - ${slot.toTime}`;
    if (slot.timeFrom && slot.timeTo) return `${slot.timeFrom} - ${slot.timeTo}`;
    return slot.start ?? slot.from ?? '';
  };
  const slotDate = (slot) => typeof slot === 'string'
    ? ''
    : slot.date ?? slot.slotDate ?? slot.availableDate ?? slot.availableOn ?? slot.forDate ?? slot.day ?? '';
  const dateOnly = (value) => {
    const text = String(value || '').trim();
    const iso = text.match(/\d{4}-\d{2}-\d{2}/);
    if (iso) return iso[0];
    const dmy = text.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    return dmy ? `${dmy[3]}-${dmy[2]}-${dmy[1]}` : '';
  };
  const slotAvailableForDate = (slot) => {
    if (!selectedDate) return false;
    const value = slotDate(slot);
    if (!value) return true;
    if (dateOnly(value) === selectedDate) return true;
    const from = dateOnly(slot.dateFrom ?? slot.fromDate ?? slot.startDate ?? slot.start_date);
    const to = dateOnly(slot.dateTo ?? slot.toDate ?? slot.endDate ?? slot.end_date);
    return Boolean(from && to && selectedDate >= from && selectedDate <= to);
  };
  const slotIsAvailable = (slot) => {
    if (!slot || typeof slot === 'string') return true;
    if (slot.available === false || slot.isAvailable === false || slot.isBooked === true || slot.booked === true) return false;
    if (typeof slot.available === 'string' && slot.available.toLowerCase() === 'false') return false;
    if (typeof slot.isAvailable === 'string' && slot.isAvailable.toLowerCase() === 'false') return false;
    return true;
  };
  const visibleSlots = slots
    .filter(slotIsAvailable)
    .filter(slotAvailableForDate)
    .filter((slot) => slotLabel(slot))
    .filter((slot, index, all) => all.findIndex((candidate) => `${slotValue(candidate)}|${slotLabel(candidate)}` === `${slotValue(slot)}|${slotLabel(slot)}`) === index);
  const dateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const addDays = (value, amount) => {
    const date = new Date(`${value}T00:00:00`);
    date.setDate(date.getDate() + amount);
    return dateKey(date);
  };
  const dateOptions = (() => {
    const explicitDates = [...new Set(slots.map((slot) => dateOnly(slotDate(slot))).filter(Boolean))].sort();
    const rangeStarts = slots.map((slot) => dateOnly(slot.dateFrom ?? slot.fromDate ?? slot.startDate ?? slot.start_date)).filter(Boolean).sort();
    const rangeEnds = slots.map((slot) => dateOnly(slot.dateTo ?? slot.toDate ?? slot.endDate ?? slot.end_date)).filter(Boolean).sort();
    let values = explicitDates;
    if (values.length === 0) {
      const today = dateKey(new Date());
      const rangeStart = rangeStarts[0] || '';
      const rangeEnd = rangeEnds[rangeEnds.length - 1] || '';
      const start = selectedDate || (rangeStart && today < rangeStart ? rangeStart : (rangeEnd && today > rangeEnd ? rangeStart : today));
      values = [];
      for (let index = 0; index < 7; index += 1) {
        const value = addDays(start, index);
        if (rangeStart && value < rangeStart) continue;
        if (rangeEnd && value > rangeEnd) break;
        values.push(value);
      }
    }
    if (selectedDate && !values.includes(selectedDate)) values.unshift(selectedDate);
    return [...new Set(values)].slice(0, 14).map((value) => {
      const date = new Date(`${value}T00:00:00`);
      return {
        value,
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
        day: date.toLocaleDateString('en-US', { day: '2-digit' }),
      };
    });
  })();
  const slotTimeParts = (slot) => {
    const start = slot?.startTime ?? slot?.start_time ?? slot?.slotStartTime ?? slot?.fromTime ?? slot?.timeFrom ?? slot?.start ?? slot?.from;
    const end = slot?.endTime ?? slot?.end_time ?? slot?.slotEndTime ?? slot?.toTime ?? slot?.timeTo ?? slot?.end ?? slot?.to;
    if (start || end) return { start: start || slotLabel(slot), end: end || '' };
    const parts = String(slotLabel(slot)).split(/\s[-–]\s/);
    return { start: parts[0] || slotLabel(slot), end: parts[1] || '' };
  };
  const handleTimeClick = (slot) => {
    setSelectedTime(slotValue(slot));
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
    const startTime = slot.startTime ?? slot.start_time ?? slot.slotStartTime ?? slot.fromTime
      ?? slot.timeFrom ?? slot.start ?? slot.from ?? selectedTime;
    const endTime = slot.endTime ?? slot.end_time ?? slot.slotEndTime ?? slot.toTime
      ?? slot.timeTo ?? slot.end ?? slot.to ?? selectedTime;
    setSubmitting(true);
    checkoutService.selectDateTime(selectedDate, startTime, endTime).then(() => go('/address')).catch((error) => setValidationMessage(error.message)).finally(() => setSubmitting(false));
  };

  return (
    <div className="animate-in">
      <BackButton />
      <section className="section checkout-grid">
        <div>
          <SectionTitle title="Service Confirmation" />
          <CartList cart={cart} updateQty={updateQty} />
          {hasCartItems && <div className="panel mt-5">
            <div className="slot-section-heading">
              <CalendarDays size={19} aria-hidden="true" />
              <span>Select service date</span>
            </div>
            <div className="date-chip-row" role="group" aria-label="Select service date">
              {dateOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`date-chip ${selectedDate === option.value ? 'selected-date' : ''}`}
                  aria-pressed={selectedDate === option.value}
                  onClick={() => handleDateChange(option.value)}
                >
                  <span>{option.weekday}</span>
                  <strong>{option.day}</strong>
                </button>
              ))}
            </div>
            <div className="slot-section-heading time-slot-heading">
              <Clock3 size={19} aria-hidden="true" />
              <span>Select service time slot</span>
            </div>
            <div className="slot-grid">
              {loading && <p>Loading available slots…</p>}
              {!loading && !validationMessage && dateOptions.length === 0 && <p>No service dates are available.</p>}
              {!loading && !validationMessage && !selectedDate && dateOptions.length > 0 && <p>Select a date to see available slots.</p>}
              {!loading && !validationMessage && selectedDate && visibleSlots.length === 0 && <p>No available slots for the selected date.</p>}
              {visibleSlots.map((slot, index) => {
                const time = slotTimeParts(slot);
                return (
                  <button
                    type="button"
                    key={slot.id ?? `${slotValue(slot)}-${index}`}
                    className={selectedTime === slotValue(slot) ? 'selected-slot' : ''}
                    onClick={() => handleTimeClick(slot)}
                  >
                    <span className="slot-time-start">{time.start}</span>
                    {time.end && <span className="slot-time-end">{time.end}</span>}
                  </button>
                );
              })}
            </div>
            {validationMessage && <p className="coupon-error">{validationMessage}</p>}
          </div>}
        </div>
        <PriceSummary 
          totals={totals} 
          next={handleConfirmClick} 
          label="Confirm booking"
          disabled={!hasCartItems || !selectedDate || !selectedTime || submitting}
        />
      </section>
    </div>
  );
}
