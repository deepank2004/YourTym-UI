import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { OffersStrip, CouponCard } from '../components/OffersReviews.jsx';
import { PageHero } from '../components/CommonComponents.jsx';
import { ServiceDataService } from '../services/ServiceDataService.js';
import { images } from '../models/constants.js';
import { staticContentService } from '../services/api/staticContentService.js';

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

export function OffersPage({ go }) {
  const fallbackOffers = ServiceDataService.getOffers();
  const [offers, setOffers] = useState(fallbackOffers);
  useEffect(() => { let active = true; staticContentService.offers().then((value) => { const rows = Array.isArray(value) ? value : value?.offers ?? value?.data ?? []; if (active && rows.length) setOffers(rows.map((offer, index) => ({ code: offer.code ?? offer.couponCode ?? offer.name ?? `OFFER-${index + 1}`, description: offer.description ?? offer.title ?? offer.offer ?? 'Special savings available on selected services.' }))); }).catch(() => {}); return () => { active = false; }; }, []);

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
          {offers.map((offer, i) => { const code = typeof offer === 'string' ? offer : offer.code; return (
            <CouponCard
              key={code}
              code={code}
              description={typeof offer === 'string' ? (i % 2 ? 'Save 30% on selected packages this week.' : 'Flat 20% off on your next salon booking.') : offer.description}
            />
          ); })}
        </div>
      </section>
    </div>
  );
}
