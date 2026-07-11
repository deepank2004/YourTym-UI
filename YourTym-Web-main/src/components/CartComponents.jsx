import React from 'react';
import { Minus, Plus, PackageCheck, Clock } from 'lucide-react';
import { FormatService } from '../services/FormatService.js';

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
              <p>{pkg.description}</p>
              <div className="my-4 flex items-center justify-between">
                <span className="duration">
                  <Clock size={15} /> {pkg.duration} min
                </span>
                <span>
                  <b>{FormatService.formatPrice(pkg.price)}</b>{' '}
                  <s>{FormatService.formatPrice(pkg.original)}</s>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="secondary-button small">View Details</button>
                <button className="outline-button small" onClick={() => go('/edit-package')}>
                  Edit Package
                </button>
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
