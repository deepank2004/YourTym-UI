import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { ORANGE } from '../models/constants.js';
import { FormatService } from '../services/FormatService.js';

export function Logo({ onClick }) {
  const handleClick = onClick || (() => window.dispatchEvent(new CustomEvent('nav-home')));
  return (
    <button className="logo" onClick={handleClick}>
      <span>YOUR</span>
      <b>TYM</b>
    </button>
  );
}

export function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

export function SectionTitle({ title, action, onAction }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">YourTym curated</p>
        <h2 className="section-title">{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="text-sm font-bold text-orange-600">
          {action}
        </button>
      )}
    </div>
  );
}

export function ImageTile({ title, image, onClick, tall }) {
  return (
    <button
      onClick={onClick}
      className={`image-tile ${tall ? 'md:row-span-2' : ''}`}
    >
      {image ? <img src={image} alt={title} /> : <div className="image-placeholder" aria-label={`${title} image unavailable`} />}
      <span>{title}</span>
    </button>
  );
}

export function PageHero({ eyebrow, title, text, image }) {
  return (
    <section className="page-hero">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {image ? <img src={image} alt={title} /> : <div className="image-placeholder" aria-label={`${title} image unavailable`} />}
    </section>
  );
}

export function PriceSummary({ totals, next, label, disabled }) {
  const fee = 99;

  return (
    <aside className="summary-card sticky-card">
      <h3>Price Breakdown</h3>
      <p>
        Item total <span>{FormatService.formatPrice(totals.price)}</span>
      </p>
      <p>
        Convenience fee <span>{FormatService.formatPrice(fee)}</span>
      </p>
      <p>
        Discount <span className="text-orange-600">-₹200</span>
      </p>
      <hr />
      <p className="total">
        Total <span>{FormatService.formatPrice(Math.max(0, totals.price + fee - 200))}</span>
      </p>
      <p>
        Total duration <span>{totals.duration} min</span>
      </p>
      <button 
        className={`primary-button w-full justify-center ${disabled ? 'disabled-button' : ''}`}
        onClick={!disabled ? next : undefined}
        disabled={disabled}
      >
        {label}
      </button>
    </aside>
  );
}

export function EntryCard({ title, image, go }) {
  return (
    <button className="entry-card" onClick={go}>
      {image ? <img src={image} alt={title} /> : <div className="image-placeholder" aria-label={`${title} image unavailable`} />}
      <span>{title}</span>
    </button>
  );
}
