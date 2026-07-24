import React, { useEffect, useState } from 'react';
import { ArrowRight, Download, MapPin, Sparkles, Star, Users } from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard.jsx';
import { PackageGrid } from '../components/CartComponents.jsx';
import { OffersStrip } from '../components/OffersReviews.jsx';
import { SectionTitle, EntryCard } from '../components/CommonComponents.jsx';
import { homeService, mapService, mapPackage } from '../services/api/homeService.js';
import { categoryService } from '../services/api/categoryService.js';
import { images } from '../models/constants.js';

function SectionState({ state, children, empty = 'No data available.' }) {
  if (state.status === 'loading') return <p className="muted">Loading…</p>;
  if (state.status === 'error') return <p className="error-text">{state.error}</p>;
  if (!state.items.length) return <p className="muted">{empty}</p>;
  return children;
}

const initial = () => ({ status: 'loading', items: [], error: '' });

const categoryFallbackImages = [
  images.womenSalon,
  images.facial,
  images.menSalon,
  images.massage,
  images.hair,
  images.cleanup,
  images.manicure,
  images.spaWomen,
];

function categoryImage(category, index) {
  return category?.image
    ?? category?.imageUrl
    ?? category?.thumbnail
    ?? category?.media?.url
    ?? categoryFallbackImages[index % categoryFallbackImages.length];
}

function categoryTitle(category) {
  return category?.mainCategory?.name
    ?? category?.mainCategoryName
    ?? category?.name
    ?? category?.title
    ?? category?.categoryName
    ?? category?.subCategoryName
    ?? 'Category';
}

function mainCategoryIdOf(category) {
  // `listMainCategories` returns main-category documents. Their own `_id`
  // is the value required by PackagebyMaincategory; `mainCategoryId` can be
  // a nested parent/reference field on wrapped catalogue records.
  const value = category?._id
    ?? category?.id
    ?? category?.mainCategory?._id
    ?? category?.mainCategory?.id
    ?? category?.mainCategoryId?._id
    ?? category?.mainCategoryId?.id
    ?? category?.mainCategoryId;
  return typeof value === 'object' ? (value?._id ?? value?.id) : value;
}

const achievements = [
  { value: '7000+', label: 'Professionals', Icon: Users },
  { value: '6M+', label: 'App Downloads', Icon: Download },
  { value: '8M+', label: 'Bookings Completed', Icon: Sparkles },
  { value: '50+', label: 'Cities in India', Icon: MapPin },
  { value: '4.8', label: "India's Top Rated Beauty App", Icon: Star },
];

const serviceOfferings = [
  {
    title: 'Salon at Home',
    description: 'From precision haircuts and styling to waxing, facials, clean-ups and mani-pedis, enjoy trusted salon care in the comfort and privacy of your home.',
    image: images.womenSalon,
    fallback: images.massage,
    action: 'Explore salon services',
    path: '/women-services',
  },
  {
    title: 'Spa & Wellness at Home',
    description: 'Slow down with relaxing massages, nourishing spa rituals and thoughtful wellness services designed to release stress, restore energy and help you feel your best.',
    image: images.spaWomen,
    fallback: images.massage,
    action: 'Explore wellness',
    path: '/women-services',
  },
  {
    title: 'Skin & Facial Care',
    description: 'Give your skin the care it deserves with personalised facials, clean-ups and glow treatments using professional techniques and products selected for your skin.',
    image: images.facial,
    fallback: images.cleanup,
    action: 'Explore skincare',
    path: '/women-services',
  },
];

export function HomePage({ go, addItem }) {
  const [data, setData] = useState({
    banners: initial(),
    categories: initial(),
    services: initial(),
    packages: initial(),
  });
  const openMainCategoryPage = (category) => {
    const mainCategoryId = mainCategoryIdOf(category);
    if (mainCategoryId) {
      sessionStorage.setItem('selectedMainCategoryContext', JSON.stringify({ id: String(mainCategoryId), title: categoryTitle(category) }));
      go(`/main-category/${encodeURIComponent(mainCategoryId)}`);
    }
  };

  useEffect(() => {
    let active = true;
    const requests = Object.entries({
      banners: homeService.banners,
      categories: categoryService.listMainCategories,
      services: homeService.services,
      packages: homeService.packages,
    });

    Promise.all(requests.map(async ([key, request]) => {
      try {
        const items = await request();
        if (active) setData((current) => ({ ...current, [key]: { status: items.length ? 'success' : 'empty', items, error: '' } }));
      } catch (error) {
        if (active) setData((current) => ({ ...current, [key]: { status: 'error', items: [], error: error.message || 'Unable to load this section.' } }));
      }
    }));

    return () => { active = false; };
  }, []);

  const services = data.services.items.map((item, index) => mapService(item, index));
  const packages = data.packages.items.map(mapPackage);
  const banners = data.banners.items;
  const bannerImage = banners[0]?.image ?? banners[0]?.imageUrl ?? banners[0]?.bannerImage ?? banners[0]?.media?.url;
  const categories = data.categories.items
    .map((item) => item?.category ?? item)
    .filter((item) => item && (item._id || item.id || item.name));
  const collageImages = [
    bannerImage || images.hero,
    images.womenSalon,
    images.massage,
  ];

  return (
    <div className="animate-in home-page">
      <section className="section home-showcase">
        <div className="home-intro">
          <div className="home-intro-copy">
            <p className="eyebrow"><MapPin size={14} /> YourTym at home</p>
            <h1>Home services at your <span>doorstep</span></h1>
            <p className="home-intro-text">Book curated salon, skin, massage and grooming services delivered by trained professionals.</p>
            <div className="home-actions">
              <button className="primary-button" onClick={() => go('/women-services')}>Book Women Services <ArrowRight size={16} /></button>
              <button className="secondary-button" onClick={() => go('/men-services')}>Explore Men Services</button>
            </div>
          </div>

          <div className="home-categories-card">
            <div className="home-card-heading">
              <div>
                <p className="eyebrow">Explore YourTym</p>
                <h2>Categories</h2>
              </div>
              <button className="home-card-link" onClick={() => go('/packages')}>View all <ArrowRight size={15} /></button>
            </div>
            <SectionState state={data.categories} empty="No categories available near you.">
              <div className="home-category-grid">
                {categories.slice(0, 8).map((category, index) => {
                  const title = categoryTitle(category);
                  return (
                    <button type="button" className="home-category" key={String(category?._id ?? category?.id ?? title)} onClick={() => openMainCategoryPage(category)}>
                      <span className="home-category-image"><img src={categoryImage(category, index)} alt={title} /></span>
                      <span>{title}</span>
                    </button>
                  );
                })}
              </div>
            </SectionState>
          </div>
        </div>

        <div className="home-collage" aria-label="YourTym service highlights">
          <button className="home-collage-tile home-collage-main" onClick={() => go('/women-services')}>
            <img src={collageImages[0]} alt="YourTym services" />
            <span className="home-collage-overlay"><small>Premium care at home</small><strong>Feel your best, every day</strong></span>
          </button>
          <button className="home-collage-tile" onClick={() => go('/women-services')}>
            <img src={collageImages[1]} alt="Women services" />
            <span className="home-collage-label">Women services</span>
          </button>
          <button className="home-collage-tile" onClick={() => go('/men-services')}>
            <img src={collageImages[2]} alt="Massage services" />
            <span className="home-collage-label">Massage & wellness</span>
          </button>
        </div>
      </section>

      <section className="section home-section home-popular-services">
        <SectionTitle title="Popular services near you" action="View all services" onAction={() => go('/women-services')} />
        <SectionState state={{ ...data.services, items: services }}>
          <div className="service-grid">{services.slice(0, 4).map((service) => <ServiceCard key={service.id} service={service} addItem={addItem} />)}</div>
        </SectionState>
      </section>

      <section className="section home-section achievements-section" aria-labelledby="achievements-title">
        <div className="achievements-panel">
          <h2 id="achievements-title">Achievements so far</h2>
          <div className="achievements-grid">
            {achievements.map(({ value, label, Icon }) => (
              <article className="achievement-item" key={label}>
                <div className="achievement-icon" aria-hidden="true"><Icon size={34} strokeWidth={1.8} /></div>
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section home-section home-offerings-section" aria-labelledby="offerings-title">
        <div className="home-offerings-heading">
          <div>
            <p className="eyebrow">YourTym at home</p>
            <h2 id="offerings-title">Explore what we offer</h2>
          </div>
          <p>Personalised beauty and wellness, brought to you.</p>
        </div>
        <div className="home-offerings-grid">
          {serviceOfferings.map((offering) => (
            <article className="home-offering-card" key={offering.title}>
              <button type="button" className="home-offering-media" style={{ '--offering-image': `url("${offering.image}")` }} onClick={() => go(offering.path)} aria-label={offering.title}>
                <img
                  src={offering.image}
                  alt={offering.title}
                  loading="lazy"
                  onError={(event) => {
                    if (offering.fallback && event.currentTarget.src !== offering.fallback) event.currentTarget.src = offering.fallback;
                  }}
                />
              </button>
              <div className="home-offering-copy">
                <h3>{offering.title}</h3>
                <p>{offering.description}</p>
                <button type="button" className="home-offering-link" onClick={() => go(offering.path)}>
                  {offering.action} <ArrowRight size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section home-section">
        <SectionTitle title="Featured packages" action="View packages" onAction={() => go('/packages')} />
        <SectionState state={{ ...data.packages, items: packages }} empty="No packages available.">
          <PackageGrid go={go} addItem={addItem} compact packages={packages} />
        </SectionState>
      </section>

      <section className="section"><OffersStrip go={go} /></section>
      <section className="section entry-grid"><EntryCard title="For Women" image={images.womenSalon} go={() => go('/women-services')} /><EntryCard title="For Men" image={images.menSalon} go={() => go('/men-services')} /></section>

    </div>
  );
}
