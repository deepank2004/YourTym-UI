import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard.jsx';
import { PageHero } from '../components/CommonComponents.jsx';
import { categoryService } from '../services/api/categoryService.js';
import { images } from '../models/constants.js';

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

export function ServicesPage({ gender, addItem }) {
  const heroImage = gender === 'Women' ? images.womenSalon : images.menSalon;
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('search') || '');
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  useEffect(() => { let active = true; setState('loading'); setError(''); const timer = setTimeout(() => categoryService.listServices({ search }).then((result) => { if (active) { setItems(result); setState(result.length ? 'success' : 'empty'); } }).catch((err) => { if (active) { setError(err.message); setState('error'); } }), 250); return () => { active = false; clearTimeout(timer); }; }, [search]);

  return (
    <div className="animate-in">
      <BackButton />
      <PageHero
        eyebrow={`Salon for ${gender}`}
        title={`${gender} Services`}
        text={`Premium ${gender.toLowerCase()} salon services with branded products, trained professionals and doorstep convenience.`}
        image={heroImage}
      />
      <section className="section">
        <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services" aria-label="Search services" />
        {state === 'loading' && <p className="muted">Loading services…</p>}
        {state === 'error' && <p className="error-text">{error}</p>}
        {state === 'empty' && <p className="muted">No services found.</p>}
        {state === 'success' && <div className="service-grid">
          {items.map((service) => (
            <ServiceCard key={service.id} service={service} addItem={addItem} />
          ))}
        </div>}
      </section>
    </div>
  );
}
