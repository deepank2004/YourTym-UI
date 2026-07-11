import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { SectionTitle } from '../components/CommonComponents.jsx';
import { ServiceDataService } from '../services/ServiceDataService.js';
import { FormatService } from '../services/FormatService.js';

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

export function EditPackagePage({ go, addItem }) {
  const womenServices = ServiceDataService.getWomenServices();
  const menServices = ServiceDataService.getMenServices();
  const options = [...womenServices.slice(0, 5), menServices[6]];
  const [selected, setSelected] = useState([options[0].id, options[3].id]);

  const chosen = options.filter((item) => selected.includes(item.id));
  const total = chosen.reduce((sum, item) => sum + item.price, 0);
  const duration = chosen.reduce((sum, item) => sum + item.duration, 0);

  const toggle = (id) =>
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  return (
    <div className="animate-in">
      <BackButton />
      <section className="section checkout-grid">
        <div>
          <SectionTitle title="Edit Package" />
          <div className="custom-panel">
            <h3>Choose services</h3>
            <div className="edit-list">
              {options.map((item) => (
                <label key={item.id} className="check-row">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                  <span>
                    <b>{item.name}</b>
                    <small>{item.description}</small>
                  </span>
                  <em>{FormatService.formatPrice(item.price)}</em>
                </label>
              ))}
            </div>
          </div>
        </div>
        <aside className="summary-card sticky-card">
          <h3>Selected Summary</h3>
          {chosen.map((item) => (
            <p key={item.id}>
              {item.name}
              <span>{FormatService.formatPrice(item.price)}</span>
            </p>
          ))}
          <hr />
          <p>
            Total duration <span>{duration} min</span>
          </p>
          <p>
            Total price <span>{FormatService.formatPrice(total)}</span>
          </p>
          <button
            className="primary-button w-full justify-center"
            onClick={() => {
              chosen.forEach(addItem);
              go('/cart');
            }}
          >
            Continue Booking
          </button>
        </aside>
      </section>
    </div>
  );
}
