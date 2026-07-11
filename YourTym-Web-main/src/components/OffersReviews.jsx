import React from 'react';
import { Gift, Star } from 'lucide-react';
import { ORANGE } from '../models/constants.js';

export function OffersStrip({ go }) {
  return (
    <div className="offers-strip">
      <div>
        <p className="eyebrow">Only this week</p>
        <h2>Book any package and get a free threading add-on</h2>
      </div>
      <button className="primary-button" onClick={() => go('/packages')}>
        Explore Packages
      </button>
    </div>
  );
}

export function CouponCard({ code, description }) {
  return (
    <article className="coupon">
      <Gift color={ORANGE} />
      <h3>{code}</h3>
      <p>{description}</p>
      <button className="outline-button">Apply Coupon</button>
    </article>
  );
}

export function Reviews({ reviews }) {
  return (
    <section className="section">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">YourTym curated</p>
          <h2 className="section-title">Reviews</h2>
        </div>
      </div>
      <div className="review-grid">
        {reviews.map((review, i) => (
          <article className="review" key={i}>
            <div>
              {Array.from({ length: 5 }).map((_, n) => (
                <Star key={n} size={15} fill={ORANGE} color={ORANGE} />
              ))}
            </div>
            <p>{review.text}</p>
            <b>{review.author}</b>
          </article>
        ))}
      </div>
    </section>
  );
}
