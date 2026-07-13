import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard.jsx';
import { PackageGrid } from '../components/CartComponents.jsx';
import { OffersStrip, Reviews } from '../components/OffersReviews.jsx';
import { SectionTitle, ImageTile, EntryCard } from '../components/CommonComponents.jsx';
import { homeService, mapService, mapPackage } from '../services/api/homeService.js';
import { images } from '../models/constants.js';
import { userAdditionalService } from '../services/api/userAdditionalService.js';

function SectionState({ state, children, empty = 'No data available.' }) {
  if (state.status === 'loading') return <p className="muted">Loading…</p>;
  if (state.status === 'error') return <p className="error-text">{state.error}</p>;
  if (!state.items.length) return <p className="muted">{empty}</p>;
  return children;
}

const initial = () => ({ status: 'loading', items: [], error: '' });
export function HomePage({ go, addItem }) {
  const [data, setData] = useState({ banners: initial(), categories: initial(), services: initial(), packages: initial(), searched: initial(), recommended: initial() });
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    let active = true;
    const requests = Object.entries({ banners: homeService.banners, categories: homeService.categories, services: homeService.services, packages: homeService.packages, searched: homeService.mostSearched, recommended: homeService.recommended });
    Promise.all(requests.map(async ([key, request]) => {
      try { const items = await request(); if (active) setData((current) => ({ ...current, [key]: { status: items.length ? 'success' : 'empty', items, error: '' } })); }
      catch (error) { if (active) setData((current) => ({ ...current, [key]: { status: 'error', items: [], error: error.message || 'Unable to load this section.' } })); }
    }));
    return () => { active = false; };
  }, []);
  useEffect(() => { let active = true; userAdditionalService.testimonials().then((items) => { const list = Array.isArray(items) ? items : (items?.testimonials ?? []); if (active) setTestimonials(list); }).catch(() => {}); return () => { active = false; }; }, []);

  const services = data.services.items.map((item, index) => mapService(item, index));
  const recommended = data.recommended.items.map((item, index) => mapService(item, index, 'recommended'));
  const packages = data.packages.items.map(mapPackage);
  const banners = data.banners.items;
  const bannerImage = banners[0]?.image ?? banners[0]?.imageUrl ?? banners[0]?.bannerImage ?? banners[0]?.media?.url;
  const categories = data.categories.items;
  const searched = data.searched.items.map((item, index) => typeof item === 'string' ? { id: `search-${item}`, label: item } : { id: String(item?._id ?? item?.id ?? item?.name ?? index), label: item?.name ?? item?.title ?? item?.serviceName ?? 'Service' });

  return <div className="animate-in">
    <section className="hero">
      {bannerImage && <img src={bannerImage} alt="YourTym promotion" />}<div className="hero-overlay" />
      <div className="hero-content"><p className="eyebrow">Premium salon at your doorstep</p><h1>YourTym</h1><p>Book curated hair, skin, massage and grooming services delivered by trained beauty professionals.</p><div className="flex flex-wrap gap-3"><button className="primary-button" onClick={() => go('/women-services')}>Book Women Services</button><button className="secondary-button" onClick={() => go('/men-services')}>Explore Men Services</button></div><SectionState state={{ ...data.banners, items: banners }} empty="No promotional banners available." /></div>
    </section>
    <section className="section"><SectionTitle title="Service Categories" action="View packages" onAction={() => go('/packages')} /><SectionState state={data.categories} empty="No categories available."><div className="masonry-grid">{categories.map((cat, i) => <ImageTile key={String(cat?._id ?? cat?.id ?? cat?.name ?? i)} title={cat?.name ?? cat?.title ?? 'Category'} image={cat?.image ?? cat?.imageUrl ?? ''} onClick={() => go(cat?.route ?? (String(cat?.gender).toLowerCase() === 'men' ? '/men-services' : '/women-services'))} tall={i === 1 || i === 3} />)}</div></SectionState></section>
    <section className="section two-col"><div><SectionTitle title="Popular Services" /><SectionState state={{ ...data.services, items: services }}><div className="service-grid">{services.slice(0, 4).map((service) => <ServiceCard key={service.id} service={service} addItem={addItem} />)}</div></SectionState></div><aside className="promise-panel"><h3>YT Promise</h3><p><Check size={18} /> 4.5+ rated beauticians</p><p><Check size={18} /> Luxury salon experience</p><p><Check size={18} /> Branded products only</p><p><Check size={18} /> Transparent pricing</p></aside></section>
    <section className="section"><SectionTitle title="Most Searched" /><SectionState state={data.searched} empty="No search trends available."><div className="flex flex-wrap gap-3">{searched.map((item) => <span className="secondary-button" key={item.id}>{item.label}</span>)}</div></SectionState></section>
    <section className="section"><SectionTitle title="Recommended Services" /><SectionState state={{ ...data.recommended, items: recommended }}><div className="service-grid">{recommended.slice(0, 4).map((service) => <ServiceCard key={service.id} service={service} addItem={addItem} />)}</div></SectionState></section>
    <section className="section"><SectionTitle title="Featured Packages" /><SectionState state={{ ...data.packages, items: packages }} empty="No packages available."><PackageGrid go={go} addItem={addItem} compact packages={packages} /></SectionState></section>
    <section className="section"><OffersStrip go={go} /></section>
    <section className="section entry-grid"><EntryCard title="For Women" image={images.womenSalon} go={() => go('/women-services')} /><EntryCard title="For Men" image={images.menSalon} go={() => go('/men-services')} /></section>
    <Reviews reviews={testimonials.map((item, index) => ({ id: item?._id ?? item?.id ?? `testimonial-${index}`, author: item?.name ?? item?.user?.fullName ?? 'YourTym customer', text: item?.comment ?? item?.description ?? item?.review ?? '' }))} />
  </div>;
}
