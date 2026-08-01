import React, { useState } from 'react';
import { Minus, Plus, PackageCheck, Clock } from 'lucide-react';
import { FormatService } from '../services/FormatService.js';
import { groupPackageServices } from '../services/api/homeService.js';

function plainText(value) {
  if (!value) return '';
  if (typeof value !== 'string') return String(value);
  const element = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (!element) return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  element.innerHTML = value;
  return (element.textContent || element.innerText || '').replace(/\s+/g, ' ').trim();
}

function CartImage({ item }) {
  const [failed, setFailed] = useState(false);
  if (!item.image || failed) {
    return <div className="cart-thumb cart-thumb-placeholder" aria-label="Image unavailable">{item.isPackage ? 'Package' : 'Service'}</div>;
  }
  return <img className="cart-thumb" src={item.image} alt={item.name} onError={() => setFailed(true)} />;
}

export function CartList({ cart, updateQty }) {
  const [pending, setPending] = useState(new Set());

  const changeQuantity = async (item, delta) => {
    if (pending.has(item.id)) return;
    setPending((current) => new Set(current).add(item.id));
    try {
      await updateQty(item.id, delta);
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  };

  return (
    <div className="panel">
      <h2>Cart</h2>
      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty. Add a service or package to continue.</p>
        </div>
      ) : cart.map((item) => {
        const description = plainText(item.description);
        const original = Number(item.original) || 0;
        const updating = pending.has(item.id);
        return (
          <div className="cart-row" key={item.id}>
            <div className="cart-main">
              <CartImage item={item} />
              <div className="cart-details">
                <span className="cart-kind">{item.isPackage ? 'Package' : 'Service'}</span>
                <h3>{item.name}</h3>
                <p className="cart-meta">
                  {item.duration ? `${item.duration} min` : 'Duration at checkout'} · {item.brand || item.categoryName || 'YourTym'}
                </p>
                {description && <p className="cart-description">{description}</p>}
                {item.subCategoryName && <p className="cart-subcategory">{item.subCategoryName}</p>}
                <div className="qty" aria-label={`Quantity for ${item.name}`}>
                  <button type="button" aria-label={`Remove one ${item.name} from cart`} disabled={updating || item.qty <= 0} onClick={() => changeQuantity(item, -1)}>
                    <Minus size={15} />
                  </button>
                  <span>{item.qty}</span>
                  <button type="button" aria-label={`Increase ${item.name} quantity`} disabled={updating || item.qty >= 99} onClick={() => changeQuantity(item, 1)}>
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>
            <div className="cart-price">
              <b>{FormatService.formatPrice(item.price * item.qty)}</b>
              {original > item.price && <s>{FormatService.formatPrice(original * item.qty)}</s>}
              <span>{FormatService.formatPrice(item.price)} each</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PackageGrid({ go, addItem, compact, packages }) {
  const editPackage = (pkg) => {
    try { sessionStorage.setItem('selectedPackageForEdit', JSON.stringify(pkg)); } catch { /* session storage is optional */ }
    go('/edit-package');
  };
  return (
    <div className="package-grid">
      {packages
        .slice(0, compact ? 3 : packages.length)
        .map((pkg) => (
          <article className="package-card" key={pkg.id}>
            {pkg.image ? <img src={pkg.image} alt={pkg.name} /> : <div className="image-placeholder" aria-label={`${pkg.name} image unavailable`} />}
            <div className="p-5">
              <div className="label">
                <PackageCheck size={14} /> PACKAGE
              </div>
              <h3>{pkg.name}</h3>
              {pkg.includedServices?.length > 0 && <ul className="package-card-included-list">
                {groupPackageServices(pkg.includedServices).slice(0, 4).map((service, index) => <li key={service.id || `${pkg.id}-service-${index}`}><b>{service.subCategory || service.category || 'Service'}:</b> {service.name}</li>)}
              </ul>}
              <div className="my-4 flex items-center justify-between">
                <span className="duration">
                  <Clock size={15} /> {pkg.duration} min
                </span>
                <span>
                  <b>{pkg.hasPrice === false ? 'Price at checkout' : FormatService.formatPrice(pkg.price)}</b>{' '}
                  {pkg.hasPrice !== false && <s>{FormatService.formatPrice(pkg.original)}</s>}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pkg.isEditable && <button className="outline-button small" onClick={() => editPackage(pkg)}>
                  Edit your package
                </button>}
                <button className="add-button" onClick={() => addItem(pkg)}>
                  Add to Cart
                </button>
              </div>
            </div>
          </article>
        ))}
    </div>
  );
}
