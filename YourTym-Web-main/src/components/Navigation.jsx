import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, Menu, X, ChevronDown, MapPin } from 'lucide-react';
import { Logo } from './CommonComponents.jsx';
import { ORANGE } from '../models/constants.js';
import { clearAuthentication, getUserToken } from '../services/api/tokenStorage.js';

export function Navbar({ go, totals, mobileOpen, setMobileOpen }) {
  const [search, setSearch] = useState('');
  useEffect(() => {
    const handler = () => go('/');
    window.addEventListener('nav-home', handler);
    return () => window.removeEventListener('nav-home', handler);
  }, [go]);

  const links = [
    ['Home', '/'],
    ['Women Services', '/women-services'],
    ['Men Services', '/men-services'],
    ['Packages', '/packages'],
    ['Offers', '/offers'],
    ['Booking History', '/booking-history'],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 lg:px-6">
        <Logo onClick={() => go('/')} />
        <button onClick={() => go('/address')} className="hidden items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium md:flex">
          <MapPin size={17} color={ORANGE} /> Noida, Sector 145 <ChevronDown size={15} />
        </button>
        <form onSubmit={(event) => { event.preventDefault(); if (search.trim()) go(`/women-services?search=${encodeURIComponent(search.trim())}`); }} className="hidden min-w-56 flex-1 items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 md:flex">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full outline-none" placeholder='Search for "Facial"' />
        </form>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <button key={href} onClick={() => go(href)} className="nav-link">
              {label}
            </button>
          ))}
        </div>
        <button
          aria-label="Cart"
          onClick={() => go('/cart')}
          className="icon-button relative"
        >
          <ShoppingCart size={20} />
          {totals.count > 0 && <span className="cart-badge">{totals.count}</span>}
        </button>
        {getUserToken() ? <button onClick={() => { clearAuthentication(); go('/'); }} className="primary-button hidden sm:inline-flex">Logout</button> : <button onClick={() => go('/login')} className="primary-button hidden sm:inline-flex">Login / Signup</button>}
        <button className="icon-button lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </nav>
      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 pb-4 lg:hidden">
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && search.trim()) go(`/women-services?search=${encodeURIComponent(search.trim())}`); }} className="w-full outline-none" placeholder="Search services" />
          </div>
          {links.map(([label, href]) => (
            <button
              key={href}
              onClick={() => go(href)}
              className="block w-full border-b border-neutral-100 py-3 text-left font-medium"
            >
              {label}
            </button>
          ))}
          {getUserToken() ? <button onClick={() => { clearAuthentication(); go('/'); }} className="primary-button mt-4 w-full justify-center">Logout</button> : <button onClick={() => go('/login')} className="primary-button mt-4 w-full justify-center">Login / Signup</button>}
        </div>
      )}
    </header>
  );
}

export function Footer({ go }) {
  return (
    <footer className="footer">
      <div>
        <Logo />
        <p>Premium salon, spa and grooming bookings for every schedule.</p>
      </div>
      <div>
        <button onClick={() => go('/women-services')}>Women Services</button>
        <button onClick={() => go('/men-services')}>Men Services</button>
        <button onClick={() => go('/offers')}>Offers</button>
        <button onClick={() => go('/booking-history')}>Booking History</button>
      </div>
    </footer>
  );
}
