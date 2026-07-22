import React, { useEffect, useState } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard.jsx';
import { categoryService } from '../services/api/categoryService.js';
import { images } from '../models/constants.js';

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

function itemId(service, index) {
  return String(service?.id ?? service?._id ?? `service-${index}`);
}

export function ServicesPage({ gender, addItem }) {
  const heroImage = gender === 'Women' ? images.womenSalon : images.menSalon;
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('search') || '');
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setState('loading');
    setError('');
    const timer = setTimeout(() => {
      categoryService.listServices({ search })
        .then((result) => {
          if (!active) return;
          setItems(result);
          setState(result.length ? 'success' : 'empty');
        })
        .catch((err) => {
          if (!active) return;
          setError(err.message || 'Unable to load services.');
          setState('error');
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const scrollToService = (service, index) => {
    document.getElementById(`service-${itemId(service, index)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="animate-in services-page">
      <BackButton />

      <section className="section services-page-layout">
        <div className="services-page-sidebar">
          <p className="eyebrow">Salon for {gender} (Luxe)</p>
          <h1>Salon for {gender} (Luxe)</h1>
          <div className="services-page-rating" aria-label="4.83 out of 5 stars">
            <Star size={18} fill="currentColor" />
            <span>4.83</span>
            <u>(7.8 M bookings)</u>
          </div>

          <div className="services-page-selector">
            <div className="services-page-selector-heading">
              <b>Select a service</b>
              <span />
            </div>
            {state === 'loading' && <p className="muted">Loading services…</p>}
            {state === 'error' && <p className="error-text">{error}</p>}
            {state === 'empty' && <p className="muted">No services found.</p>}
            {state === 'success' && (
              <div className="services-page-selector-grid">
                {items.slice(0, 12).map((service, index) => (
                  <button
                    className="services-page-selector-card"
                    key={itemId(service, index)}
                    type="button"
                    onClick={() => scrollToService(service, index)}
                  >
                    {service.image ? <img src={service.image} alt="" /> : <span className="image-placeholder" aria-hidden="true" />}
                    <span>{service.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="services-page-hero-media">
          <img src={heroImage} alt={`${gender} salon service`} />
          <span>Premium care at home</span>
        </div>
      </section>

      <section className="section services-page-results">
        <div className="services-page-results-heading">
          <div>
            <p className="eyebrow">YourTym curated</p>
            <h2>{gender} services</h2>
          </div>
          <input
            className="field"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search services"
            aria-label="Search services"
          />
        </div>

        {state === 'loading' && <p className="muted">Loading services…</p>}
        {state === 'error' && <p className="error-text">{error}</p>}
        {state === 'empty' && <p className="muted">No services found.</p>}
        {state === 'success' && (
          <div className="service-grid">
            {items.map((service, index) => (
              <div key={itemId(service, index)} id={`service-${itemId(service, index)}`} className="services-page-result-item">
                <ServiceCard service={service} addItem={addItem} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
