import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock, PackageCheck, Play, Star } from 'lucide-react';
import { FormatService } from '../services/FormatService.js';
import { images } from '../models/constants.js';
import { categoryService } from '../services/api/categoryService.js';
import { API_BASE_URL } from '../services/api/apiConfig.js';

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

function contextFor(mainCategoryId, categoryId) {
  try {
    const value = JSON.parse(sessionStorage.getItem('selectedPackageContext') || 'null');
    if (value?.mainCategoryId === String(mainCategoryId) && value?.categoryId === String(categoryId)) return value;
  } catch {
    // A stale session value should never prevent the package page from opening.
  }
  return {};
}

function packageImage(pkg, index) {
  return safeMediaUrl(pkg?.image) || [images.spaWomen, images.facial, images.waxing, images.massage][index % 4];
}

function safeMediaUrl(value) {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value, API_BASE_URL);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function categoryFallback(context) {
  const text = `${context.mainCategoryName || ''} ${context.categoryName || ''} ${context.subCategoryName || ''}`.toLowerCase();
  if (/wax/.test(text)) return images.waxing;
  if (/massage|spa|wellness/.test(text)) return images.massage;
  if (/facial|skin|beauty|salon|women/.test(text)) return /men/.test(text) ? images.menSalon : images.womenSkin;
  if (/men|groom|beard|hair/.test(text)) return images.menSalon;
  if (/clean|pest|home care/.test(text)) return images.cleanup;
  if (/mani|nail/.test(text)) return images.manicure;
  if (/pedi/.test(text)) return images.pedicure;
  return images.hero;
}

function mediaFor(context, packages) {
  const video = safeMediaUrl(context.video) || safeMediaUrl(packages.find((pkg) => pkg?.video)?.video);
  const image = safeMediaUrl(context.image)
    || safeMediaUrl(packages.find((pkg) => pkg?.image)?.image)
    || categoryFallback(context)
    || images.hero;
  return { video, image };
}

function HeroMedia({ media, alt }) {
  const [video, setVideo] = useState(media.video);
  const [image, setImage] = useState(media.image);
  useEffect(() => { setVideo(media.video); setImage(media.image); }, [media.video, media.image]);
  if (video) {
    return <video className="category-packages-hero-visual" poster={image} autoPlay muted loop playsInline preload="metadata" onError={() => setVideo('')} aria-label={`${alt} video`}><source src={video} /></video>;
  }
  return <img className="category-packages-hero-visual" src={image} alt={alt} fetchPriority="high" onError={() => setImage(images.hero)} />;
}

function normalizeText(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function packageMatchesService(pkg, service) {
  const idValue = (value) => typeof value === 'object' ? (value?._id ?? value?.id ?? '') : value;
  const serviceId = String(idValue(service?._id ?? service?.id) || '');
  const packageIds = [
    pkg?.categoryId,
    pkg?.subCategoryId,
    pkg?.subcategoryId,
    pkg?.serviceId,
    pkg?.serviceTypeId,
    pkg?.category?._id,
    pkg?.subCategory?._id,
    pkg?.subcategory?._id,
    pkg?.service?._id,
    pkg?.serviceType?._id,
  ].map(idValue).filter(Boolean).map(String);
  if (serviceId && packageIds.includes(serviceId)) return true;

  const serviceName = normalizeText(service?.name ?? service?.title ?? service?.subCategoryName ?? service?.categoryName);
  if (!serviceName) return false;
  try {
    return normalizeText(JSON.stringify(pkg)).includes(serviceName);
  } catch {
    return false;
  }
}

function PackageRow({ pkg, index, addItem, anchorId }) {
  return (
    <article className="category-package-row" id={anchorId}>
      <div className="category-package-row-copy">
        <div className="label"><PackageCheck size={14} /> PACKAGE</div>
        <h3>{pkg.name}</h3>
        <div className="category-package-rating"><Star size={15} fill="currentColor" /> 4.9 <span>(Highly rated)</span></div>
        <div className="category-package-price">
          <b>{FormatService.formatPrice(pkg.price)}</b>
          {pkg.original > pkg.price && <s>{FormatService.formatPrice(pkg.original)}</s>}
          <span>•</span><Clock size={15} /> {pkg.duration || 0} min
        </div>
        {pkg.description && <p>{pkg.description}</p>}
        <button className="secondary-button small" type="button" onClick={() => addItem(pkg)}>Add to cart</button>
      </div>
      <div className="category-package-row-media">
        <img src={packageImage(pkg, index)} alt={pkg.name} loading="lazy" decoding="async" />
        {pkg.original > pkg.price && <span>{Math.max(1, Math.round((1 - (pkg.price / pkg.original)) * 100))}% OFF</span>}
      </div>
    </article>
  );
}

export function CategoryPackagesPage({ go, addItem, cart = [], mainCategoryId, categoryId }) {
  const [state, setState] = useState({ status: 'loading', packages: [], error: '' });
  const [servicesState, setServicesState] = useState({ status: 'loading', items: [], error: '' });
  const [serviceNotice, setServiceNotice] = useState('');
  const context = useMemo(() => contextFor(mainCategoryId, categoryId), [mainCategoryId, categoryId]);
  const categoryName = context.subCategoryName || context.categoryName || 'Selected services';
  const mainCategoryName = context.mainCategoryName || 'YourTym services';

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', packages: [], error: '' });
    categoryService.listPackagesByMainCategory(mainCategoryId)
      .then((packages) => {
        if (!active) return;
        setState({ status: packages.length ? 'success' : 'empty', packages, error: '' });
      })
      .catch((error) => {
        if (active) setState({ status: 'error', packages: [], error: error.message || 'Unable to load packages for this category.' });
      });
    return () => { active = false; };
  }, [mainCategoryId, categoryId]);

  useEffect(() => {
    let active = true;
    setServicesState({ status: 'loading', items: [], error: '' });
    categoryService.listSubCategories(mainCategoryId, categoryId)
      .then((items) => {
        if (active) setServicesState({ status: items.length ? 'success' : 'empty', items, error: '' });
      })
      .catch((error) => {
        if (active) setServicesState({ status: 'error', items: [], error: error.message || 'Unable to load services for this category.' });
      });
    return () => { active = false; };
  }, [mainCategoryId, categoryId]);

  const heroMedia = useMemo(() => mediaFor(context, state.packages), [context, state.packages]);
  const scrollToServicePackage = (service) => {
    setServiceNotice('');
    const index = state.packages.findIndex((pkg) => packageMatchesService(pkg, service));
    if (index < 0) {
      setServiceNotice(`No package is currently mapped to ${service?.name ?? service?.title ?? 'this service'}.`);
      return;
    }
    const target = document.getElementById(`category-package-${state.packages[index].id || index}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="animate-in category-packages-page">
      <BackButton />
      <section className="section category-package-workspace">
        <aside className="category-package-sidebar">
          <p className="eyebrow">{mainCategoryName}</p>
          <h1>{categoryName}</h1>
          <div className="category-packages-rating"><Star size={17} fill="currentColor" /> <b>4.85</b> <span>Curated services</span></div>
          <div className="category-package-selector">
            <div className="category-package-selector-heading"><b>Select a service</b><span /></div>
            <div className="category-service-options">
              <button type="button" className="category-service-option category-service-option-active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src={heroMedia.image} alt="" onError={(event) => { event.currentTarget.src = images.hero; }} />
                <span><b>All services</b><small>{state.status === 'success' ? `${state.packages.length} packages` : 'Packages'}</small></span>
              </button>
              {servicesState.status === 'loading' && <p className="muted">Loading services…</p>}
              {servicesState.status === 'error' && <p className="error-text">{servicesState.error}</p>}
              {servicesState.status === 'empty' && <p className="muted">No subcategories found.</p>}
              {servicesState.status === 'success' && servicesState.items.map((service, index) => (
                <button type="button" className="category-service-option" key={String(service?._id ?? service?.id ?? `${service?.name ?? 'service'}-${index}`)} onClick={() => scrollToServicePackage(service)}>
                  <img src={packageImage(service, index)} alt="" loading="lazy" />
                  <span><b>{service?.name ?? service?.title ?? service?.subCategoryName ?? 'Service'}</b><small>View packages</small></span>
                </button>
              ))}
            </div>
            <div className="category-packages-sidebar-note"><Check size={16} /> Real packages from the YourTym catalogue</div>
          </div>
        </aside>

        <div className="category-package-main">
          <div className="category-packages-hero-media">
            <HeroMedia media={heroMedia} alt={`${categoryName} packages`} />
            {heroMedia.video && <span className="category-packages-play" aria-hidden="true"><Play size={24} fill="currentColor" /></span>}
            <span className="category-packages-hero-caption">Premium care at home</span>
          </div>

          <div className="category-package-lower">
            <div className="category-packages-results">
              <div className="category-packages-results-heading">
                <div><p className="eyebrow">{mainCategoryName}</p><h2>Super saver packages</h2></div>
                {state.status === 'success' && <span>{state.packages.length} packages</span>}
              </div>
              {state.status === 'loading' && <p className="muted">Loading packages…</p>}
              {state.status === 'error' && <p className="error-text">{state.error}</p>}
              {state.status === 'empty' && <p className="muted">No packages are available for this category yet.</p>}
              {serviceNotice && <p className="category-service-notice">{serviceNotice}</p>}
              {state.status === 'success' && <div className="category-package-list">{state.packages.map((pkg, index) => <PackageRow key={pkg.id || `package-${index}`} anchorId={`category-package-${pkg.id || index}`} pkg={pkg} index={index} addItem={addItem} />)}</div>}
            </div>

            <aside className="category-packages-right-rail">
              <div className="category-offer-card"><span className="category-offer-badge">%</span><div><b>Great value packages</b><p>Save more on your next booking</p></div></div>
              <div className="promise-panel"><p className="eyebrow">YourTym promise</p><h3>Care you can count on.</h3><p><Check size={18} /> 4.5+ rated professionals</p><p><Check size={18} /> Branded products only</p><p><Check size={18} /> Transparent pricing</p></div>
              <div className="category-cart-teaser"><b>{cart.length ? `${cart.length} item${cart.length > 1 ? 's' : ''} in your cart` : 'No items in your cart'}</b><button type="button" className="outline-button small" onClick={() => go('/cart')}>View cart</button></div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
