import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, MapPin } from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard.jsx';
import { PackageGrid } from '../components/CartComponents.jsx';
import { OffersStrip, Reviews } from '../components/OffersReviews.jsx';
import { SectionTitle, EntryCard } from '../components/CommonComponents.jsx';
import { homeService, mapService, mapPackage } from '../services/api/homeService.js';
import { categoryService } from '../services/api/categoryService.js';
import { images } from '../models/constants.js';
import { userAdditionalService } from '../services/api/userAdditionalService.js';

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
  const value = category?.mainCategoryId
    ?? category?.mainCategory?._id
    ?? category?.mainCategory?.id
    ?? category?.mainCategoryId?._id
    ?? category?.mainCategoryId?.id
    ?? category?._id
    ?? category?.id;
  return typeof value === 'object' ? (value?._id ?? value?.id) : value;
}

export function HomePage({ go, addItem }) {
  const [data, setData] = useState({
    banners: initial(),
    categories: initial(),
    services: initial(),
    packages: initial(),
    searched: initial(),
    recommended: initial(),
  });
  const [testimonials, setTestimonials] = useState([]);
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
      searched: homeService.mostSearched,
      recommended: homeService.recommended,
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

  useEffect(() => {
    let active = true;
    userAdditionalService.testimonials()
      .then((items) => {
        const list = Array.isArray(items) ? items : (items?.testimonials ?? []);
        if (active) setTestimonials(list);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const services = data.services.items.map((item, index) => mapService(item, index));
  const recommended = data.recommended.items.map((item, index) => mapService(item, index, 'recommended'));
  const packages = data.packages.items.map(mapPackage);
  const banners = data.banners.items;
  const bannerImage = banners[0]?.image ?? banners[0]?.imageUrl ?? banners[0]?.bannerImage ?? banners[0]?.media?.url;
  const categories = data.categories.items
    .map((item) => item?.category ?? item)
    .filter((item) => item && (item._id || item.id || item.name));
  const searched = data.searched.items.map((item, index) => (
    typeof item === 'string'
      ? { id: `search-${item}`, label: item }
      : { id: String(item?._id ?? item?.id ?? item?.name ?? index), label: item?.name ?? item?.title ?? item?.serviceName ?? 'Service' }
  ));

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
                <h2>What can we help with?</h2>
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

      <section className="section home-section">
        <SectionTitle title="Popular services near you" action="View all services" onAction={() => go('/women-services')} />
        <SectionState state={{ ...data.services, items: services }}>
          <div className="service-grid">{services.slice(0, 4).map((service) => <ServiceCard key={service.id} service={service} addItem={addItem} />)}</div>
        </SectionState>
      </section>

      <section className="section home-discovery-grid">
        <div className="home-discovery-card">
          <SectionTitle title="Most searched" />
          <SectionState state={data.searched} empty="No search trends available.">
            <div className="home-search-chips">{searched.map((item) => <button className="home-search-chip" key={item.id}>{item.label}</button>)}</div>
          </SectionState>
        </div>
        <aside className="promise-panel home-promise-panel">
          <p className="eyebrow">The YT promise</p>
          <h3>Care that feels personal.</h3>
          <p><Check size={18} /> 4.5+ rated professionals</p>
          <p><Check size={18} /> Branded products only</p>
          <p><Check size={18} /> Transparent pricing</p>
        </aside>
      </section>

      <section className="section home-section">
        <SectionTitle title="Recommended services" />
        <SectionState state={{ ...data.recommended, items: recommended }}>
          <div className="service-grid">{recommended.slice(0, 4).map((service) => <ServiceCard key={service.id} service={service} addItem={addItem} />)}</div>
        </SectionState>
      </section>

      <section className="section home-section">
        <SectionTitle title="Featured packages" action="View packages" onAction={() => go('/packages')} />
        <SectionState state={{ ...data.packages, items: packages }} empty="No packages available.">
          <PackageGrid go={go} addItem={addItem} compact packages={packages} />
        </SectionState>
      </section>

      <section className="section"><OffersStrip go={go} /></section>
      <section className="section entry-grid"><EntryCard title="For Women" image={images.womenSalon} go={() => go('/women-services')} /><EntryCard title="For Men" image={images.menSalon} go={() => go('/men-services')} /></section>
      <Reviews reviews={testimonials.map((item, index) => ({ id: item?._id ?? item?.id ?? `testimonial-${index}`, author: item?.name ?? item?.user?.fullName ?? 'YourTym customer', text: item?.comment ?? item?.description ?? item?.review ?? '' }))} />

    </div>
  );
}
