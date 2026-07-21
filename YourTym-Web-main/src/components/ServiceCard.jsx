import React from 'react';
import { Star, Clock } from 'lucide-react';
import { ORANGE } from '../models/constants.js';
import { FormatService } from '../services/FormatService.js';

function plainText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function ServiceCard({ service, addItem, id }) {
  const description = plainText(service.description);
  return (
    <article className="service-card" id={id}>
      {service.image ? <img src={service.image} alt={service.name} /> : <div className="image-placeholder" aria-label={`${service.name} image unavailable`} />}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3>{service.name}</h3>
          <span className="rating">
            <Star size={13} fill={ORANGE} color={ORANGE} />
            4.9
          </span>
        </div>
        {description && <p>{description}</p>}
        <p className="brand">Brands: {service.brand}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <span className="price">{FormatService.formatPrice(service.price)}</span>
            <span className="old-price">{FormatService.formatPrice(service.original)}</span>
            <p className="duration">
              <Clock size={14} /> {service.duration} min
            </p>
          </div>
          <button onClick={() => addItem(service)} className="add-button">
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
