import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CartList } from '../components/CartComponents.jsx';
import { PriceSummary } from '../components/CommonComponents.jsx';

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

export function CartPage({ go, cart, updateQty, totals, cartError }) {
  return (
    <div className="animate-in">
      <BackButton />
      <section className="section checkout-grid">
        {cartError && <p className="error-text">{cartError}</p>}
        <CartList cart={cart} updateQty={updateQty} />
        <PriceSummary totals={totals} next={() => go('/confirmation')} label="Proceed to checkout" />
      </section>
    </div>
  );
}
