import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { PriceSummary } from '../components/CommonComponents.jsx';
import {
  addAddress,
  attachAddressToCart,
  deleteAddress,
  getAddresses,
  updateAddress,
} from '../services/api/addressService.js';

const EMPTY_ADDRESS = {
  houseFlat: '',
  appartment: '',
  landMark: '',
  houseType: '',
};

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

function toCheckoutAddress(address) {
  return {
    id: address.id,
    name: '',
    phone: '',
    line: address.houseFlat,
    street: address.appartment,
    area: address.landMark,
    city: '',
    pincode: '',
  };
}

function publishSelectedLocation(address) {
  const label = [address.city, address.area, address.appartment, address.landMark, address.houseFlat]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(', ') || 'Selected location';
  localStorage.setItem('locationLabel', label);
  window.dispatchEvent(new CustomEvent('location-updated', { detail: { label } }));
}

export function AddressPage({ go, setAddress, totals }) {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectingId, setSelectingId] = useState('');
  const [feedback, setFeedback] = useState(null);
  const requestInFlight = useRef(false);

  const loadAddresses = async () => {
    setLoading(true);

    try {
      const result = await getAddresses();
      setAddresses(result.addresses);
      if (result.addresses.length === 0) setFeedback(null);
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Unable to load addresses.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_ADDRESS);
    setEditingId('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (requestInFlight.current) return;

    const payload = {
      houseFlat: form.houseFlat.trim(),
      appartment: form.appartment.trim(),
      landMark: form.landMark.trim(),
      houseType: form.houseType.trim(),
    };

    if (!payload.houseFlat || !payload.appartment || !payload.landMark || !payload.houseType) {
      setFeedback({ type: 'error', message: 'Complete all address fields.' });
      return;
    }

    requestInFlight.current = true;
    setSaving(true);
    setFeedback(null);

    try {
      const result = editingId
        ? await updateAddress(editingId, payload)
        : await addAddress(payload);
      setFeedback({ type: 'success', message: result.message });
      resetForm();
      await loadAddresses();
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Unable to save address.' });
    } finally {
      requestInFlight.current = false;
      setSaving(false);
    }
  };

  const handleEdit = (address) => {
    setEditingId(address.id);
    setForm({
      houseFlat: address.houseFlat,
      appartment: address.appartment,
      landMark: address.landMark,
      houseType: address.houseType,
    });
    setFeedback(null);
  };

  const handleDelete = async (addressId) => {
    if (!addressId || requestInFlight.current) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete this address?')) return;

    requestInFlight.current = true;
    setFeedback(null);

    try {
      const result = await deleteAddress(addressId);
      if (editingId === addressId) resetForm();
      setFeedback({ type: 'success', message: result.message });
      await loadAddresses();
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Unable to delete address.' });
    } finally {
      requestInFlight.current = false;
    }
  };

  const handleSelect = async (address) => {
    if (!address.id || requestInFlight.current) return;

    requestInFlight.current = true;
    setSelectingId(address.id);
    setFeedback(null);

    try {
      const result = await attachAddressToCart(address.id);
      setAddress(toCheckoutAddress(address));
      publishSelectedLocation(address);
      setFeedback({ type: 'success', message: result.message });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Unable to select address.' });
    } finally {
      requestInFlight.current = false;
      setSelectingId('');
    }
  };

  return (
    <div className="animate-in">
      <BackButton />
      <section className="section checkout-grid">
        <div className="panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">YourTym checkout</p>
              <h2>Address</h2>
            </div>
            <button className="outline-button" type="button" onClick={resetForm}>
              <Plus size={16} /> New address
            </button>
          </div>

          {feedback && (
            <p
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}
            >
              {feedback.message}
            </p>
          )}

          {loading ? (
            <p>Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <p>No saved addresses found. Add an address to continue.</p>
          ) : (
            <div className="booking-grid">
              {addresses.map((address) => (
                <article className="booking-card" key={address.id}>
                  <h3>{address.houseType || 'Address'}</h3>
                  <p>{address.houseFlat}</p>
                  <p>{address.appartment}</p>
                  <p>{address.landMark}</p>
                  <div className="card-actions">
                    <button className="outline-button" type="button" onClick={() => handleSelect(address)} disabled={selectingId === address.id}>
                      {selectingId === address.id ? 'Selecting...' : 'Use this address'}
                    </button>
                    <button className="icon-button" type="button" aria-label="Edit address" onClick={() => handleEdit(address)}>
                      <Pencil size={16} />
                    </button>
                    <button className="icon-button" type="button" aria-label="Delete address" onClick={() => handleDelete(address.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <form className="form-grid mt-5" onSubmit={handleSave}>
            <label>
              House/Flat
              <input value={form.houseFlat} onChange={(event) => updateField('houseFlat', event.target.value)} />
            </label>
            <label>
              Apartment/Locality
              <input value={form.appartment} onChange={(event) => updateField('appartment', event.target.value)} />
            </label>
            <label>
              Landmark
              <input value={form.landMark} onChange={(event) => updateField('landMark', event.target.value)} />
            </label>
            <label>
              House type
              <input placeholder="home or Other" value={form.houseType} onChange={(event) => updateField('houseType', event.target.value)} />
            </label>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving address...' : editingId ? 'Update address' : 'Add address'}
            </button>
          </form>
        </div>
        <PriceSummary totals={totals} next={() => go('/summary')} label="Continue" />
      </section>
    </div>
  );
}
