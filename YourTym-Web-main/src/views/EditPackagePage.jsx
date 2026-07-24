import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock, PackageCheck, Star } from 'lucide-react';
import { FormatService } from '../services/FormatService.js';
import { cartService } from '../services/api/cartService.js';

function readPackage() {
  try {
    const value = JSON.parse(sessionStorage.getItem('selectedPackageForEdit') || 'null');
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

function BackButton() {
  return (
    <button className="back-button" type="button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

export function EditPackagePage({ go }) {
  const [pkg] = useState(readPackage);
  const options = useMemo(() => (Array.isArray(pkg?.includedServices) ? pkg.includedServices : []).filter((service) => service?.id), [pkg]);
  const initialSelected = useMemo(() => {
    const selected = Array.isArray(pkg?.selectedServices) ? pkg.selectedServices.map(String) : [];
    return new Set(selected.length ? selected : options.map((service) => String(service.id)));
  }, [options, pkg]);
  const [selected, setSelected] = useState(initialSelected);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const chosen = options.filter((service) => selected.has(String(service.id)));
  const selectedValue = chosen.reduce((sum, service) => sum + (Number(service.price) || 0), 0);
  const selectedDuration = chosen.reduce((sum, service) => sum + (Number(service.duration) || 0), 0);

  const toggle = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      const key = String(id);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const savePackage = async () => {
    if (saving || !pkg?.packageId || selected.size === 0) return;
    setSaving(true);
    setError('');
    const packageId = String(pkg.packageId);
    const selectedServices = [...selected];
    try {
      if (/edit/i.test(String(pkg.packageType || ''))) {
        await cartService.addEditedPackage(packageId, 1);
        await cartService.updateEditedPackage(packageId, selectedServices, []);
      } else if (/custom/i.test(String(pkg.packageType || ''))) {
        await cartService.addCustomPackage(packageId, 1);
        await cartService.updateCustomPackage(packageId, selectedServices, []);
      } else {
        await cartService.addPackage(packageId, 1);
      }
      try { sessionStorage.removeItem('selectedPackageForEdit'); } catch { /* optional */ }
      go('/cart');
    } catch (requestError) {
      setError(requestError.message || 'Unable to update this package. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in">
      <BackButton />
      {!pkg ? (
        <section className="section"><div className="panel"><h2>Select a package to edit</h2><button className="outline-button" type="button" onClick={() => go('/packages')}>View packages</button></div></section>
      ) : (
        <section className="section edit-package-layout">
          <div className="edit-package-content">
            <div className="edit-package-heading">
              <div><p className="eyebrow">Customize your package</p><h1>{pkg.name}</h1></div>
              <div className="edit-package-meta"><span><PackageCheck size={16} /> {pkg.packageType || 'PACKAGE'}</span><span><Star size={15} fill="currentColor" /> {Number(pkg.rating || 4.9).toFixed(1)}</span></div>
            </div>
            {pkg.description && <p className="edit-package-description">{pkg.description}</p>}
            <div className="custom-panel">
              <div className="edit-package-section-heading"><div><p className="eyebrow">Included services</p><h2>Make it yours</h2></div><span>{chosen.length} selected</span></div>
              {options.length === 0 ? <p className="muted">This package has no editable services.</p> : <div className="edit-package-options">
                {options.map((service) => {
                  const checked = selected.has(String(service.id));
                  return <label key={service.id} className={`edit-package-option${checked ? ' is-selected' : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(service.id)} />
                    {service.image ? <img src={service.image} alt="" loading="lazy" /> : <span className="image-placeholder" aria-hidden="true" />}
                    <span className="edit-package-option-copy"><b>{service.name}</b><small>{service.subCategory || service.category || 'Included service'}</small>{service.description && <em>{service.description}</em>}</span>
                    <span className="edit-package-option-price">{service.price ? FormatService.formatPrice(service.price) : 'Included'}</span>
                  </label>;
                })}
              </div>}
            </div>
          </div>
          <aside className="summary-card sticky-card edit-package-summary">
            <h3>Package summary</h3>
            <div className="edit-package-summary-name"><b>{pkg.name}</b><span>{pkg.packageType || 'PACKAGE'}</span></div>
            <p>Selected services <span>{chosen.length}</span></p>
            <p><Clock size={15} /> Estimated duration <span>{selectedDuration || pkg.duration || 0} min</span></p>
            <p>Included service value <span>{FormatService.formatPrice(selectedValue)}</span></p>
            <hr />
            <p className="total">Package price <span>{pkg.hasPrice === false ? 'Calculated at checkout' : FormatService.formatPrice(pkg.price)}</span></p>
            {error && <p className="error-text edit-package-error">{error}</p>}
            <button className="primary-button w-full justify-center" type="button" disabled={saving || selected.size === 0} onClick={savePackage}>{saving ? 'Updating package…' : 'Add package to cart'}</button>
            <small className="edit-package-note"><Check size={14} /> You can change these services before adding.</small>
          </aside>
        </section>
      )}
    </div>
  );
}
