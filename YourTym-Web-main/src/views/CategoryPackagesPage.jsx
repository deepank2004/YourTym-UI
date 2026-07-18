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

function PackageRow({ pkg, index, addItem }) {
  return (
    <article className="category-package-row">
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

  const heroMedia = useMemo(() => mediaFor(context, state.packages), [context, state.packages]);

  return (
    <div className="animate-in category-packages-page">
      <BackButton />
      <section className="section category-packages-hero">
        <div>
          <p className="eyebrow">{mainCategoryName}</p>
          <h1>{categoryName}</h1>
          <div className="category-packages-rating"><Star size={18} fill="currentColor" /> <b>4.9</b> <span>Curated packages for you</span></div>
          <p className="category-packages-hero-text">Discover professionally designed packages, transparent pricing and care delivered at your doorstep.</p>
        </div>
        <div className="category-packages-hero-media">
          <HeroMedia media={heroMedia} alt={`${categoryName} packages`} />
          {heroMedia.video && <span className="category-packages-play" aria-hidden="true"><Play size={24} fill="currentColor" /></span>}
          <span className="category-packages-hero-caption">Premium care at home</span>
        </div>
      </section>

      <section className="section category-packages-layout">
        <aside className="category-packages-sidebar">
          <p className="category-packages-sidebar-title">Select a service</p>
          <div className="category-packages-selected">
            <img src={heroMedia.image} alt="" onError={(event) => { event.currentTarget.src = images.hero; }} />
            <div><b>{categoryName}</b><small>{state.status === 'success' ? `${state.packages.length} packages` : 'Packages'}</small></div>
          </div>
          <div className="category-packages-sidebar-note"><Check size={16} /> Real packages from the YourTym catalogue</div>
        </aside>

        <main className="category-packages-results">
          <div className="category-packages-results-heading">
            <div><p className="eyebrow">Curated collection</p><h2>Super saver packages</h2></div>
            {state.status === 'success' && <span>{state.packages.length} packages</span>}
          </div>
          {state.status === 'loading' && <p className="muted">Loading packages…</p>}
          {state.status === 'error' && <p className="error-text">{state.error}</p>}
          {state.status === 'empty' && <p className="muted">No packages are available for this category yet.</p>}
          {state.status === 'success' && <div className="category-package-list">{state.packages.map((pkg, index) => <PackageRow key={pkg.id || `package-${index}`} pkg={pkg} index={index} addItem={addItem} />)}</div>}
        </main>

        <aside className="category-packages-right-rail">
          <div className="category-offer-card"><span className="category-offer-badge">%</span><div><b>Great value packages</b><p>Save more on your next booking</p></div></div>
          <div className="promise-panel"><p className="eyebrow">YourTym promise</p><h3>Care you can count on.</h3><p><Check size={18} /> 4.5+ rated professionals</p><p><Check size={18} /> Branded products only</p><p><Check size={18} /> Transparent pricing</p></div>
          <div className="category-cart-teaser"><b>{cart.length ? `${cart.length} item${cart.length > 1 ? 's' : ''} in your cart` : 'No items in your cart'}</b><button type="button" className="outline-button small" onClick={() => go('/cart')}>View cart</button></div>
        </aside>
      </section>
    </div>
  );
}
