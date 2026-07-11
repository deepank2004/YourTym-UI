import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PackageGrid } from '../components/CartComponents.jsx';
import { SectionTitle, PageHero } from '../components/CommonComponents.jsx';
import { images } from '../models/constants.js';
import { homeService, mapPackage } from '../services/api/homeService.js';

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

export function PackagesPage({ go, addItem }) {
  const [packages, setPackages] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  useEffect(() => { let active = true; homeService.packages().then((items) => { if (active) { setPackages(items.map(mapPackage)); setState(items.length ? 'success' : 'empty'); } }).catch((err) => { if (active) { setError(err.message); setState('error'); } }); return () => { active = false; }; }, []);
  return (
    <div className="animate-in">
      <BackButton />
      <PageHero
        eyebrow="Premium bundles"
        title="Packages"
        text="Save more with salon bundles designed for daily grooming, events and full-body care."
        image={images.spaWomen}
      />
      <section className="section">
        {state === 'loading' && <p>Loading packages…</p>}
        {state === 'error' && <p className="error-text">{error}</p>}
        {state === 'empty' && <p>No packages available.</p>}
        {state === 'success' && <PackageGrid go={go} addItem={addItem} packages={packages} />}
      </section>
    </div>
  );
}
