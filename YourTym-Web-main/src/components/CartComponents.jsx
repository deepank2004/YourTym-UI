import React from 'react';
import { Minus, Plus, PackageCheck, Clock } from 'lucide-react';
import { FormatService } from '../services/FormatService.js';
import { groupPackageServices } from '../services/api/homeService.js';

export function CartList({ cart, updateQty }) {
  return (
    <div className="panel">
      <h2>Cart</h2>
      {cart.map((item) => (
        <div className="cart-row" key={item.id}>
          <div>
            <h3>{item.name}</h3>
            <p>
              {item.duration} min · {item.brand || 'YourTym package'}
            </p>
            <div className="qty">
              <button onClick={() => updateQty(item.id, -1)}>
                <Minus size={15} />
              </button>
              <span>{item.qty}</span>
              <button onClick={() => updateQty(item.id, 1)}>
                <Plus size={15} />
              </button>
            </div>
          </div>
          <b>{FormatService.formatPrice(item.price * item.qty)}</b>
        </div>
      ))}
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
