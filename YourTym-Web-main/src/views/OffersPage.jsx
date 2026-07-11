import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { OffersStrip, CouponCard } from '../components/OffersReviews.jsx';
import { PageHero } from '../components/CommonComponents.jsx';
import { ServiceDataService } from '../services/ServiceDataService.js';
import { images } from '../models/constants.js';

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

export function OffersPage({ go }) {
  const offers = ServiceDataService.getOffers();

  return (
    <div className="animate-in">
      <BackButton />
      <PageHero
        eyebrow="Limited time"
        title="Offers"
        text="Luxury salon care with seasonal savings, combo deals and first booking rewards."
        image={images.womenSkin}
      />
      <section className="section">
        <OffersStrip go={go} />
        <div className="offer-grid">
          {offers.map((code, i) => (
            <CouponCard
              key={code}
              code={code}
              description={
                i % 2
                  ? 'Save 30% on selected packages this week.'
                  : 'Flat 20% off on your next salon booking.'
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
