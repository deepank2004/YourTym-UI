import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clock, PackageCheck, Play, Star } from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard.jsx';
import { FormatService } from '../services/FormatService.js';
import { images } from '../models/constants.js';
import { categoryService } from '../services/api/categoryService.js';
import { groupPackageServices } from '../services/api/homeService.js';
import { API_BASE_URL } from '../services/api/apiConfig.js';

function contextFor(mainCategoryId, categoryId) {
  try {
    const value = JSON.parse(sessionStorage.getItem('selectedPackageContext') || 'null');
    if (value?.mainCategoryId === String(mainCategoryId) && value?.categoryId === String(categoryId)) return value;
  } catch {
    // A stale session value should never prevent the package page from opening.
  }
  return {};
}

function mainContextFor(mainCategoryId) {
  try {
    const value = JSON.parse(sessionStorage.getItem('selectedMainCategoryContext') || 'null');
    if (value?.id === String(mainCategoryId)) return value;
  } catch {
    // A missing context only affects the display label, not the API request.
  }
  return {};
}

function packageImage(pkg, index) {
  return safeMediaUrl(pkg?.image) || [images.spaWomen, images.facial, images.waxing, images.massage][index % 4];
}

function categoryLabel(category) {
  return category?.name ?? category?.title ?? category?.categoryName ?? category?.subCategoryName ?? 'Category';
}

function entityId(entity, fallback = '') {
  const value = entity?._id ?? entity?.id ?? entity?.serviceId ?? entity?.serviceTypeId ?? fallback;
  return typeof value === 'object' ? String(value?._id ?? value?.id ?? fallback) : String(value || fallback);
}

function serviceAnchorId(categoryId, service, index) {
  return `category-service-${categoryId || 'all'}-${entityId(service, `service-${index}`)}`;
}

function categoryImage(category, index) {
  return safeMediaUrl(category?.image ?? category?.imageUrl ?? category?.thumbnail ?? category?.media?.url)
    || [images.womenSalon, images.facial, images.menSalon, images.massage, images.cleanup, images.manicure][index % 6];
}

function categoryMedia(category) {
  const media = category?.media ?? {};
  return {
    image: safeMediaUrl(category?.image ?? category?.imageUrl ?? category?.thumbnail ?? media?.image ?? media?.imageUrl ?? media?.url),
    video: safeMediaUrl(category?.video ?? category?.videoUrl ?? category?.videoURL ?? media?.video ?? media?.videoUrl),
  };
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

function uniqueEntities(items, keyForItem) {
  const seen = new Set();
  return items.filter((item, index) => {
    const key = keyForItem(item, index);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function categoryIdentity(category, index) {
  const name = normalizeText(categoryLabel(category));
  if (name) return `name:${name}`;
  const id = entityId(category);
  return id ? `id:${id}` : `category:${index}`;
}

function serviceIdentity(service, index) {
  const name = normalizeText(service?.name ?? service?.serviceName ?? service?.title);
  if (name) return `service:${name}`;
  const id = entityId(service);
  return id ? `id:${id}` : `service:${index}`;
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

function PackageRow({ pkg, index, addItem, anchorId, onEdit }) {
  const [adding, setAdding] = useState(false);
  const allIncludedServices = groupPackageServices(pkg.includedServices);
  const includedServices = allIncludedServices.slice(0, 4);
  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    try { await addItem(pkg); } finally { setAdding(false); }
  };
  return (
    <article className="category-package-row" id={anchorId}>
      <div className="category-package-row-copy">
        <div className="label"><PackageCheck size={14} /> PACKAGE</div>
        <h3>{pkg.name}</h3>
        <div className="category-package-rating"><Star size={15} fill="currentColor" /> {Number(pkg.rating || 4.9).toFixed(1)} <span>{pkg.sellCount ? `(${Number(pkg.sellCount).toLocaleString('en-IN')} bookings)` : '(Highly rated)'}</span></div>
        <div className="category-package-price">
          <b>{pkg.hasPrice === false ? 'Price at checkout' : FormatService.formatPrice(pkg.price)}</b>
          {pkg.hasPrice !== false && pkg.original > pkg.price && <s>{FormatService.formatPrice(pkg.original)}</s>}
          <span>•</span><Clock size={15} /> {pkg.duration || 0} min
        </div>
        {includedServices.length > 0 && <ul className="category-package-included-list">
          {includedServices.map((service, serviceIndex) => <li key={service.id || `${pkg.id}-included-${serviceIndex}`}>
            <span><b>{service.subCategory || service.category || 'Service'}:</b> {service.name}</span>
          </li>)}
          {allIncludedServices.length > includedServices.length && <li className="category-package-more-services">+{allIncludedServices.length - includedServices.length} more services</li>}
        </ul>}
        <div className="category-package-actions">
          {pkg.isEditable && <button className="outline-button small" type="button" onClick={() => onEdit?.(pkg)}>Edit your package</button>}
          <button className="add-button small" type="button" onClick={handleAdd} disabled={adding}>{adding ? 'Adding…' : 'Add'}</button>
        </div>
      </div>
      <div className="category-package-row-media">
        <img src={packageImage(pkg, index)} alt={pkg.name} loading="lazy" decoding="async" />
        {pkg.hasPrice !== false && pkg.original > pkg.price && <span>{Math.max(1, Math.round((1 - (pkg.price / pkg.original)) * 100))}% OFF</span>}
      </div>
    </article>
  );
}

function SubCategoryRow({ subCategory, index, selected, onSelect }) {
  const name = categoryLabel(subCategory);
  return (
    <button type="button" className={`service-card category-subcategory-row${selected ? ' is-selected' : ''}`} onClick={onSelect}>
      <img src={categoryImage(subCategory, index)} alt={name} loading="lazy" decoding="async" />
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3"><h3>{name}</h3></div>
        <p>View services</p>
      </div>
    </button>
  );
}

export function CategoryPackagesPage({ go, addItem, cart = [], mainCategoryId, categoryId, mainCategoryMode = false }) {
  const [state, setState] = useState({ status: 'loading', packages: [], error: '' });
  const [servicesState, setServicesState] = useState({ status: 'loading', items: [], error: '' });
  const [servicesResultState, setServicesResultState] = useState({ status: 'empty', items: [], error: '' });
  const [servicesCatalogueState, setServicesCatalogueState] = useState({ status: mainCategoryMode ? 'loading' : 'empty', groups: [], error: '' });
  const [categoriesState, setCategoriesState] = useState({ status: mainCategoryMode ? 'loading' : 'empty', items: [], error: '' });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [viewMode, setViewMode] = useState(mainCategoryMode || categoryId ? 'services' : 'packages');
  const [serviceNotice, setServiceNotice] = useState('');
  const selectedCategoryId = entityId(selectedCategory) || String(categoryId || '');
  const routeContext = useMemo(() => contextFor(mainCategoryId, selectedCategoryId), [mainCategoryId, selectedCategoryId]);
  const mainContext = useMemo(() => mainContextFor(mainCategoryId), [mainCategoryId]);
  const selectionMedia = useMemo(() => categoryMedia(selectedCategory), [selectedCategory]);
  const context = useMemo(() => ({
    mainCategoryName: selectedCategory?.mainCategory?.name ?? selectedCategory?.mainCategoryName ?? mainContext.title ?? '',
    categoryName: categoryLabel(selectedCategory),
    image: selectionMedia.image,
    video: selectionMedia.video,
    ...routeContext,
  }), [mainContext.title, routeContext, selectedCategory, selectionMedia]);
  const categoryName = context.subCategoryName || context.categoryName || 'Selected services';
  const mainCategoryName = context.mainCategoryName || 'YourTym services';
  const openPackageEditor = (pkg) => {
    try { sessionStorage.setItem('selectedPackageForEdit', JSON.stringify(pkg)); } catch { /* session storage is optional */ }
    go('/edit-package');
  };
  const packageRequestKey = mainCategoryMode ? String(mainCategoryId || '') : selectedCategoryId;
  const catalogueGroups = useMemo(() => {
    const groups = servicesCatalogueState.groups || [];
    const selectedId = String(selectedCategoryId || '');
    const orderedGroups = selectedId
      ? [...groups].sort((left, right) => (String(left.id) === selectedId ? -1 : String(right.id) === selectedId ? 1 : 0))
      : groups;
    const seenServices = new Set();
    return orderedGroups
      .map((group) => {
        const services = uniqueEntities(group.services || [], serviceIdentity).filter((service, index) => {
          const key = serviceIdentity(service, index);
          if (seenServices.has(key)) return false;
          seenServices.add(key);
          return true;
        });
        return { ...group, services };
      })
      .filter((group) => group.status !== 'success' || group.services.length || String(group.id) === selectedId);
  }, [servicesCatalogueState.groups, selectedCategoryId]);
  const selectedServicesGroup = useMemo(
    () => catalogueGroups.find((group) => String(group.id) === String(selectedCategoryId)) || null,
    [catalogueGroups, selectedCategoryId],
  );
  const catalogueServiceCount = useMemo(
    () => catalogueGroups.reduce((total, group) => total + group.services.length, 0),
    [catalogueGroups],
  );

  useEffect(() => {
    if (!mainCategoryMode) return undefined;
    let active = true;
    setCategoriesState({ status: 'loading', items: [], error: '' });
    categoryService.listCategoriesByMainCategory(mainCategoryId)
      .then((items) => {
        if (!active) return;
        const uniqueItems = uniqueEntities(items, categoryIdentity);
        setCategoriesState({ status: uniqueItems.length ? 'success' : 'empty', items: uniqueItems, error: '' });
        setSelectedCategory((current) => current || uniqueItems.find((item) => {
          const rawId = item?._id ?? item?.id;
          const id = typeof rawId === 'object' ? (rawId?._id ?? rawId?.id) : rawId;
          return String(id || '') === String(categoryId || '');
        }) || uniqueItems[0] || null);
      })
      .catch((error) => {
        if (active) setCategoriesState({ status: 'error', items: [], error: error.message || 'Unable to load categories for this main category.' });
      });
    return () => { active = false; };
  }, [mainCategoryId, mainCategoryMode, categoryId]);

  useEffect(() => {
    if (!mainCategoryMode || categoriesState.status !== 'success') return undefined;
    let active = true;
    const categories = categoriesState.items;
    setServicesCatalogueState({ status: 'loading', groups: [], error: '' });

    Promise.all(categories.map(async (category, categoryIndex) => {
      const id = entityId(category);
      if (!id) return { id: `invalid-category-${categoryIndex}`, category, subCategories: [], subCategoryServices: [], services: [], status: 'error', error: 'This category has no valid backend ID.' };
      try {
        const subCategories = uniqueEntities(
          await categoryService.listSubCategories(mainCategoryId, id),
          (subCategory, index) => categoryIdentity(subCategory, index),
        );
        const serviceGroups = await Promise.all(subCategories.map(async (subCategory) => {
          const subCategoryId = entityId(subCategory);
          if (!subCategoryId) return { id: '', subCategory, services: [] };
          return {
            id: subCategoryId,
            subCategory,
            services: uniqueEntities(
              await categoryService.listServicesBySubCategory(mainCategoryId, id, subCategoryId),
              serviceIdentity,
            ),
          };
        }));
        const services = uniqueEntities(serviceGroups.flatMap((group) => group.services), serviceIdentity);
        return { id, category, subCategories, subCategoryServices: serviceGroups, services, status: services.length ? 'success' : 'empty', error: '' };
      } catch (error) {
        return { id, category, subCategories: [], subCategoryServices: [], services: [], status: 'error', error: error.message || `Unable to load services for ${categoryLabel(category)}.` };
      }
    })).then((groups) => {
      if (!active) return;
      const hasContent = groups.some((group) => group.services.length > 0);
      const hasErrors = groups.some((group) => group.status === 'error');
      setServicesCatalogueState({ status: hasContent ? 'success' : (hasErrors ? 'error' : 'empty'), groups, error: hasErrors && !hasContent ? 'Unable to load services for these categories.' : '' });
    });

    return () => { active = false; };
  }, [categoriesState.items, categoriesState.status, mainCategoryId, mainCategoryMode]);

  const selectCategory = (category) => {
    const nextId = entityId(category);
    if (!nextId) return;
    setSelectedCategory(category);
    setSelectedSubCategoryId('');
    setViewMode('services');
    setServiceNotice('');
    sessionStorage.setItem('selectedPackageContext', JSON.stringify({
      mainCategoryId: String(mainCategoryId),
      categoryId: String(nextId),
      mainCategoryName,
      categoryName: categoryLabel(category),
      ...categoryMedia(category),
    }));
    if (mainCategoryMode) window.history.replaceState({}, '', `/main-category/${encodeURIComponent(mainCategoryId)}/${encodeURIComponent(nextId)}`);
  };

  const selectSubCategory = (group, subCategory) => {
    const id = entityId(subCategory);
    if (!id) return;
    setSelectedCategory(group.category);
    setSelectedSubCategoryId(id);
    setServiceNotice('');
  };

  const scrollToMainPackages = () => {
    if (!mainCategoryMode) return;
    setViewMode('services');
    setSelectedSubCategoryId('');
    setServiceNotice('');
    window.setTimeout(() => {
      document.getElementById('category-main-packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  useEffect(() => {
    if (!mainCategoryMode || !selectedSubCategoryId || servicesCatalogueState.status === 'loading') return;
    document.getElementById(`category-subcategory-services-${selectedCategoryId}-${selectedSubCategoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [mainCategoryMode, selectedCategoryId, selectedSubCategoryId, servicesCatalogueState.status]);

  useEffect(() => {
    if (!mainCategoryMode || viewMode !== 'services' || !selectedCategoryId || servicesCatalogueState.status === 'loading') return;
    const target = document.getElementById(`category-services-${selectedCategoryId}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [mainCategoryMode, selectedCategoryId, servicesCatalogueState.status, viewMode]);

  useEffect(() => {
    let active = true;
    if (!packageRequestKey) {
      setState({ status: 'empty', packages: [], error: '' });
      return () => { active = false; };
    }
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
  }, [mainCategoryId, mainCategoryMode, packageRequestKey]);

  useEffect(() => {
    let active = true;
    if (mainCategoryMode) {
      if (viewMode !== 'services' || !selectedCategoryId) {
        setServicesResultState({ status: 'empty', items: [], error: '' });
      } else if (!selectedServicesGroup || servicesCatalogueState.status === 'loading') {
        setServicesResultState({ status: 'loading', items: [], error: '' });
      } else {
        setServicesResultState({ status: selectedServicesGroup.status, items: selectedServicesGroup.services, error: selectedServicesGroup.error });
      }
      return () => { active = false; };
    }
    if (viewMode !== 'services' || !selectedCategoryId) {
      setServicesResultState({ status: 'empty', items: [], error: '' });
      return () => { active = false; };
    }
    if (servicesState.status === 'loading') {
      setServicesResultState({ status: 'loading', items: [], error: '' });
      return () => { active = false; };
    }
    if (servicesState.status === 'error') {
      setServicesResultState({ status: 'error', items: [], error: servicesState.error });
      return () => { active = false; };
    }
    if (!servicesState.items.length) {
      setServicesResultState({ status: 'empty', items: [], error: '' });
      return () => { active = false; };
    }
    setServicesResultState({ status: 'loading', items: [], error: '' });
    Promise.all(servicesState.items.map((subCategory) => {
      const rawId = subCategory?._id ?? subCategory?.id;
      const subCategoryId = typeof rawId === 'object' ? (rawId?._id ?? rawId?.id) : rawId;
      return subCategoryId ? categoryService.listServicesBySubCategory(mainCategoryId, selectedCategoryId, subCategoryId) : [];
    }))
      .then((groups) => {
        if (!active) return;
        const items = uniqueEntities(groups.flat(), serviceIdentity);
        setServicesResultState({ status: items.length ? 'success' : 'empty', items, error: '' });
      })
      .catch((error) => {
        if (active) setServicesResultState({ status: 'error', items: [], error: error.message || 'Unable to load services for this category.' });
      });
    return () => { active = false; };
  }, [mainCategoryId, mainCategoryMode, selectedCategoryId, selectedServicesGroup, servicesCatalogueState.status, servicesState, viewMode]);

  useEffect(() => {
    let active = true;
    if (mainCategoryMode) {
      if (!selectedCategoryId || servicesCatalogueState.status === 'loading') {
        setServicesState({ status: 'loading', items: [], error: '' });
      } else if (!selectedServicesGroup) {
        setServicesState({ status: 'empty', items: [], error: '' });
      } else {
        setServicesState({
          status: selectedServicesGroup.subCategories.length ? 'success' : selectedServicesGroup.status,
          items: selectedServicesGroup.subCategories,
          error: selectedServicesGroup.error,
        });
      }
      return () => { active = false; };
    }
    if (!selectedCategoryId) {
      setServicesState({ status: 'empty', items: [], error: '' });
      return () => { active = false; };
    }
    setServicesState({ status: 'loading', items: [], error: '' });
    categoryService.listSubCategories(mainCategoryId, selectedCategoryId)
      .then((items) => {
        if (active) setServicesState({ status: items.length ? 'success' : 'empty', items, error: '' });
      })
      .catch((error) => {
        if (active) setServicesState({ status: 'error', items: [], error: error.message || 'Unable to load services for this category.' });
      });
    return () => { active = false; };
  }, [mainCategoryId, mainCategoryMode, selectedCategoryId, selectedServicesGroup, servicesCatalogueState.status]);

  const heroMedia = useMemo(() => mediaFor(context, state.packages), [context, state.packages]);
  const scrollToServicePackage = (service) => {
    setServiceNotice('');
    if (viewMode === 'services') {
      const visibleItems = mainCategoryMode ? (selectedServicesGroup?.services ?? []) : servicesResultState.items;
      const serviceIndex = visibleItems.findIndex((item) => packageMatchesService(item, service));
      if (serviceIndex < 0) {
        if (mainCategoryMode && selectedCategoryId) {
          document.getElementById(`category-services-${selectedCategoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        setServiceNotice(`No service is currently mapped to ${service?.name ?? service?.title ?? 'this category'}.`);
        return;
      }
      const targetId = serviceAnchorId(mainCategoryMode ? selectedCategoryId : '', visibleItems[serviceIndex], serviceIndex);
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const index = state.packages.findIndex((pkg) => packageMatchesService(pkg, service));
    if (index < 0) {
      setServiceNotice(`No package is currently mapped to ${service?.name ?? service?.title ?? 'this service'}.`);
      return;
    }
    const target = document.getElementById(`category-package-${state.packages[index].id || index}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="animate-in category-packages-page">
      {mainCategoryMode && (
        <section className="section category-page-category-nav">
          <div className="category-page-category-heading">
            <div><p className="eyebrow">Explore categories</p><h2>{mainCategoryName}</h2></div>
            <span>Select a category to view its services and packages</span>
          </div>
          {categoriesState.status === 'loading' && <p className="muted">Loading categories…</p>}
          {categoriesState.status === 'error' && <p className="error-text">{categoriesState.error}</p>}
          {categoriesState.status === 'empty' && <p className="muted">No categories are available for this main category.</p>}
          {categoriesState.status === 'success' && <div className="category-page-category-grid">{categoriesState.items.map((category, index) => {
            const rawId = category?._id ?? category?.id;
            const id = String(typeof rawId === 'object' ? (rawId?._id ?? rawId?.id ?? index) : (rawId ?? index));
            const selected = String(selectedCategoryId) === id;
            return <button type="button" className={`category-page-category-card${selected ? ' is-selected' : ''}`} key={id} onClick={() => selectCategory(category)}><img src={categoryImage(category, index)} alt={categoryLabel(category)} loading="lazy" /><span>{categoryLabel(category)}</span></button>;
          })}</div>}
        </section>
      )}
      <section className={`section category-package-workspace${mainCategoryMode ? ' is-main-category' : ''}`}>
        <aside className="category-package-sidebar">
          <p className="eyebrow">{mainCategoryName}</p>
          <h1>{mainCategoryMode ? mainCategoryName : categoryName}</h1>
          <div className="category-packages-rating"><Star size={17} fill="currentColor" /> <b>4.85</b> <span>Curated services</span></div>
          {mainCategoryMode && <div className="category-main-picker">
            <div className="category-package-selector-heading"><b>Select a category</b><span /></div>
            {categoriesState.status === 'loading' && <p className="muted">Loading categories…</p>}
            {categoriesState.status === 'error' && <p className="error-text">{categoriesState.error}</p>}
            {categoriesState.status === 'empty' && <p className="muted">No categories are available.</p>}
            {categoriesState.status === 'success' && <div className="category-main-picker-grid">
              <button
                type="button"
                className="category-main-picker-card category-main-mode-card"
                onClick={scrollToMainPackages}
              >
                <img src={images.spaWomen} alt="Packages" loading="lazy" />
                <span>Packages</span>
              </button>
              {categoriesState.items.map((category, index) => {
                const rawId = category?._id ?? category?.id;
                const id = String(typeof rawId === 'object' ? (rawId?._id ?? rawId?.id ?? index) : (rawId ?? index));
                const selected = String(selectedCategoryId) === id;
                return <button type="button" className={`category-main-picker-card${selected && viewMode === 'services' ? ' is-selected' : ''}`} key={id} onClick={() => selectCategory(category)}><img src={categoryImage(category, index)} alt={categoryLabel(category)} loading="lazy" /><span>{categoryLabel(category)}</span></button>;
              })}
            </div>}
          </div>}
          <div className="category-package-selector">
            <div className="category-package-selector-heading"><b>Select a service</b><span /></div>
            <div className="category-service-options">
              <button type="button" className="category-service-option category-service-option-active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src={heroMedia.image} alt="" onError={(event) => { event.currentTarget.src = images.hero; }} />
                <span><b>{viewMode === 'services' ? 'All services' : 'All packages'}</b><small>{viewMode === 'services' ? (servicesResultState.status === 'success' ? `${servicesResultState.items.length} services` : 'Services') : (state.status === 'success' ? `${state.packages.length} packages` : 'Packages')}</small></span>
              </button>
              {servicesState.status === 'loading' && <p className="muted">Loading services…</p>}
              {servicesState.status === 'error' && <p className="error-text">{servicesState.error}</p>}
              {servicesState.status === 'empty' && <p className="muted">No subcategories found.</p>}
              {servicesState.status === 'success' && servicesState.items.map((service, index) => (
                <button type="button" className="category-service-option" key={String(service?._id ?? service?.id ?? `${service?.name ?? 'service'}-${index}`)} onClick={() => scrollToServicePackage(service)}>
                  <img src={packageImage(service, index)} alt="" loading="lazy" />
                  <span><b>{service?.name ?? service?.title ?? service?.subCategoryName ?? 'Service'}</b><small>{viewMode === 'services' ? 'View services' : 'View packages'}</small></span>
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
            <div className={`category-packages-results${viewMode === 'services' ? ' is-services-mode' : ''}${mainCategoryMode ? ' is-main-catalogue' : ''}`}>
              <div className="category-packages-results-heading">
                <div><p className="eyebrow">{mainCategoryName}</p><h2>{viewMode === 'services' ? (mainCategoryMode ? (selectedSubCategoryId ? 'Services' : 'Subcategories') : `${categoryName} services`) : 'Super saver packages'}</h2></div>
                {viewMode === 'services' && mainCategoryMode && servicesCatalogueState.status === 'success' && <span>{selectedSubCategoryId ? `${catalogueServiceCount} services` : `${catalogueGroups.reduce((total, group) => total + group.subCategories.length, 0)} subcategories`}</span>}
                {viewMode === 'services' && !mainCategoryMode && servicesResultState.status === 'success' && <span>{servicesResultState.items.length} services</span>}
                {viewMode === 'packages' && state.status === 'success' && <span>{state.packages.length} packages</span>}
              </div>
              {state.status === 'loading' && <p className="muted">Loading packages…</p>}
              {state.status === 'error' && <p className="error-text">{state.error}</p>}
              {state.status === 'empty' && <p className="muted">No packages are available for this category yet.</p>}
              {serviceNotice && <p className="category-service-notice">{serviceNotice}</p>}
              {mainCategoryMode && <section className="category-main-packages-section" id="category-main-packages">
                <div className="category-service-section-heading">
                  <div><p className="eyebrow">{mainCategoryName}</p><h3>Packages</h3></div>
                  {state.status === 'success' && <span>{state.packages.length} packages</span>}
                </div>
                {state.status === 'loading' && <p className="muted">Loading packages...</p>}
                {state.status === 'error' && <p className="error-text">{state.error}</p>}
                {state.status === 'empty' && <p className="muted">No packages are available for this main category yet.</p>}
                {state.status === 'success' && <div className="category-package-list category-main-package-list">
                  {state.packages.map((pkg, index) => <PackageRow key={pkg.id || `main-package-${index}`} anchorId={`category-package-${pkg.id || index}`} pkg={pkg} index={index} addItem={addItem} onEdit={openPackageEditor} />)}
                </div>}
              </section>}
              {viewMode === 'services' && mainCategoryMode && <div className="category-service-catalogue">
                {servicesCatalogueState.status === 'loading' && <p className="muted">Loading subcategories...</p>}
                {servicesCatalogueState.status === 'error' && <p className="error-text">{servicesCatalogueState.error}</p>}
                {servicesCatalogueState.status === 'empty' && !catalogueGroups.some((group) => group.subCategories.length) && <p className="muted">No subcategories are available for this main category yet.</p>}
                {catalogueGroups.map((group) => {
                  const isSelectedGroup = String(group.id) === String(selectedCategoryId);
                  const selectedSubCategory = group.subCategories.find((subCategory) => String(entityId(subCategory)) === String(selectedSubCategoryId));
                  const selectedSubCategoryServices = group.subCategoryServices?.find((entry) => String(entry.id) === String(selectedSubCategoryId))?.services ?? [];
                  const showSubCategoryServices = isSelectedGroup && Boolean(selectedSubCategory);
                  return (
                    <section className="category-service-section" id={`category-services-${group.id}`} key={group.id}>
                      <div className="category-service-section-heading">
                        <div><p className="eyebrow">{mainCategoryName}</p><h3>{categoryLabel(group.category)}</h3></div>
                        <span>{showSubCategoryServices ? `${selectedSubCategoryServices.length} services` : `${group.subCategories.length} subcategories`}</span>
                      </div>
                      {group.status === 'error' && <p className="error-text">{group.error}</p>}
                      {!showSubCategoryServices && group.subCategories.length > 0 && <div className="category-service-results-grid category-subcategory-results">
                        {group.subCategories.map((subCategory, index) => <SubCategoryRow key={entityId(subCategory, `${group.id}-subcategory-${index}`)} subCategory={subCategory} index={index} selected={String(entityId(subCategory)) === String(selectedSubCategoryId)} onSelect={() => selectSubCategory(group, subCategory)} />)}
                      </div>}
                      {showSubCategoryServices && <div className="category-service-results-grid" id={`category-subcategory-services-${selectedCategoryId}-${selectedSubCategoryId}`}>
                        <button type="button" className="secondary-button small category-subcategory-back" onClick={() => setSelectedSubCategoryId('')}>Back to subcategories</button>
                        {selectedSubCategoryServices.map((service, index) => <ServiceCard key={entityId(service, `${group.id}-service-${index}`)} id={serviceAnchorId(group.id, service, index)} service={service} addItem={addItem} />)}
                      </div>}
                      {!showSubCategoryServices && group.subCategories.length === 0 && group.status !== 'error' && <p className="muted">No subcategories are available in this category yet.</p>}
                    </section>
                  );
                })}
              </div>}
              {viewMode === 'services' && !mainCategoryMode && <div className="category-service-results">
                {servicesResultState.status === 'loading' && <p className="muted">Loading services...</p>}
                {servicesResultState.status === 'error' && <p className="error-text">{servicesResultState.error}</p>}
                {servicesResultState.status === 'empty' && <p className="muted">No services are available for this category yet.</p>}
                {servicesResultState.status === 'success' && <div className="category-service-results-grid">
                  {servicesResultState.items.map((service, index) => {
                    const serviceId = String(service?.id ?? service?.serviceTypeId ?? `service-${index}`);
                    return <ServiceCard key={serviceId} id={serviceAnchorId('', service, index)} service={service} addItem={addItem} />;
                  })}
                </div>}
              </div>}
              {state.status === 'success' && !mainCategoryMode && <div className="category-package-list">{state.packages.map((pkg, index) => <PackageRow key={pkg.id || `package-${index}`} anchorId={`category-package-${pkg.id || index}`} pkg={pkg} index={index} addItem={addItem} onEdit={openPackageEditor} />)}</div>}
            </div>

            <aside className="category-packages-right-rail">
              <div className="promise-panel"><p className="eyebrow">YourTym promise</p><h3>Care you can count on.</h3><p><Check size={18} /> 4.5+ rated professionals</p><p><Check size={18} /> Branded products only</p><p><Check size={18} /> Transparent pricing</p></div>
              <div className="category-cart-teaser"><b>{cart.length ? `${cart.length} item${cart.length > 1 ? 's' : ''} in your cart` : 'No items in your cart'}</b><button type="button" className="outline-button small" onClick={() => go('/cart')}>View cart</button></div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
