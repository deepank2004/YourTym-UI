import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';
import { mapService, mapPackage } from './homeService.js';
import { getUserToken } from './tokenStorage.js';

let publicServicesCache = null;
let publicServicesCacheAt = 0;

function valueId(value) {
  if (value && typeof value === 'object') return value?._id ?? value?.id ?? value?.categoryId ?? value?.subCategoryId ?? '';
  return value ?? '';
}

function valueName(value) {
  if (!value || typeof value !== 'object') return String(value ?? '');
  return value?.name ?? value?.title ?? value?.categoryName ?? value?.subCategoryName ?? value?.serviceName ?? '';
}

function normalizedName(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function publicServiceRows(payload, endpoint) {
  const roots = collection(payload, endpoint);
  const rows = [];
  const visit = (item, context = {}, index = 0) => {
    if (Array.isArray(item)) {
      item.forEach((child, childIndex) => visit(child, context, childIndex));
      return;
    }
    if (!item || typeof item !== 'object') return;

    const categoryRef = item?.categoryId ?? item?.category?.categoryId ?? item?.category ?? context.category;
    const subCategoryRef = item?.subCategoryId ?? item?.subcategoryId ?? item?.subCategory?.subCategoryId ?? item?.subCategory ?? item?.subcategory ?? context.subCategory;
    const nextContext = {
      mainCategory: item?.mainCategoryId ?? item?.mainCategory ?? context.mainCategory,
      category: categoryRef,
      subCategory: subCategoryRef,
    };
    const children = [item?.categories, item?.subCategories, item?.subCategory, item?.subcategories, item?.services, item?.serviceTypes, item?.items]
      .filter((group) => Array.isArray(group) && group.length);
    children.forEach((group) => group.forEach((child, childIndex) => visit(child, nextContext, childIndex)));

    const hasNestedData = children.length > 0;
    const hasServiceFields = item?.serviceId || item?.serviceTypeId || item?.serviceName || item?.timeInMin !== undefined || item?.duration !== undefined || item?.price !== undefined || item?.discountPrice !== undefined || item?.sellingPrice !== undefined || item?.type === 'Service';
    if (!hasNestedData && (hasServiceFields || nextContext.subCategory) && (item?._id || item?.id || item?.serviceId || item?.serviceTypeId)) {
      rows.push({ item, context: nextContext, index });
    }
  };
  visit(roots);
  return rows;
}

async function getPublicServiceRows() {
  const now = Date.now();
  if (publicServicesCache && now - publicServicesCacheAt < 30000) return publicServicesCache;
  const endpoint = userEndpoints.catalog.services;
  const response = await apiClient.get(endpoint, { skipAuth: true, params: { _ts: now }, headers: { 'Cache-Control': 'no-cache' } });
  publicServicesCache = publicServiceRows(response.data, endpoint);
  publicServicesCacheAt = now;
  return publicServicesCache;
}

function matchesIdOrName(value, id, name) {
  const candidateId = String(valueId(value) || '');
  const candidateName = normalizedName(valueName(value));
  return (id && candidateId === String(id)) || (name && candidateName === normalizedName(name));
}

function publicSubCategories(rows, mainCategoryId, category) {
  const categoryId = valueId(category);
  const categoryName = valueName(category);
  const seen = new Set();
  return rows
    .filter(({ context }) => {
      const mainId = valueId(context.mainCategory);
      const categoryRef = context.category;
      const mainMatches = !mainId || mainId === String(mainCategoryId);
      return mainMatches && matchesIdOrName(categoryRef, categoryId, categoryName);
    })
    .map(({ context }) => context.subCategory)
    .filter(Boolean)
    .map((subCategory, index) => ({
      ...(typeof subCategory === 'object' ? subCategory : { _id: subCategory }),
      _id: String(valueId(subCategory) || `public-subcategory-${index}`),
      name: valueName(subCategory) || `Service ${index + 1}`,
    }))
    .filter((subCategory) => {
      const key = `${subCategory._id}:${normalizedName(subCategory.name)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function publicServicesForSubCategory(rows, mainCategoryId, category, subCategory) {
  const categoryId = valueId(category);
  const categoryName = valueName(category);
  const subCategoryId = valueId(subCategory);
  const subCategoryName = valueName(subCategory);
  const seen = new Set();
  return rows
    .filter(({ context }) => {
      const mainId = valueId(context.mainCategory);
      return (!mainId || mainId === String(mainCategoryId))
        && matchesIdOrName(context.category, categoryId, categoryName)
        && matchesIdOrName(context.subCategory, subCategoryId, subCategoryName);
    })
    .map(({ item }, index) => mapService(item, index, 'public-category-service'))
    .filter((service) => {
      const key = String(service.id || normalizedName(service.name));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function collection(payload, endpoint) {
  const values = [payload, payload?.data, payload?.data?.data, payload?.data?.data?.data, payload?.data?.items, payload?.data?.data?.items, payload?.data?.services, payload?.data?.service, payload?.data?.categories, payload?.data?.subCategories, payload?.data?.packages, payload?.services, payload?.service, payload?.categories, payload?.subCategories, payload?.packages, payload?.data?.results, payload?.items, payload?.results];
  const result = values.find(Array.isArray);
  if (!result) throw new Error(`Unexpected response shape from ${endpoint}`);
  return result;
}

export async function listServices({ search } = {}) {
  const config = search?.trim() ? { params: { search: search.trim() } } : undefined;
  const response = await apiClient.get(userEndpoints.catalog.search && search?.trim() ? userEndpoints.catalog.search : userEndpoints.catalog.services, { ...(config || {}), skipAuth: true, params: { ...(config?.params || {}), _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
  const values = collection(response.data, search?.trim() ? userEndpoints.catalog.search : userEndpoints.catalog.services);
  const walk = (item) => { if (!item || typeof item !== 'object') return []; const nested = item.services ?? item.serviceTypes ?? item.items; return Array.isArray(nested) && nested.length ? nested.flatMap(walk) : [item]; };
  const flattened = values.flatMap(walk);
  return flattened.map((item, index) => mapService(item, index));
}

export async function listCategories() {
  const response = await apiClient.get(userEndpoints.catalog.categories, { skipAuth: true });
  return collection(response.data, userEndpoints.catalog.categories);
}

function mainCategoryCollection(payload, endpoint) {
  const candidates = [
    payload?.data?.mainCategories,
    payload?.data?.mainCategory,
    payload?.data?.categories,
    payload?.data,
    payload?.mainCategories,
    payload?.mainCategory,
    payload?.categories,
    payload,
  ];
  const value = candidates.find((candidate) => Array.isArray(candidate));
  if (!value) throw new Error(`Unexpected response shape from ${endpoint}`);
  const rows = value;
  return rows
    .flatMap((item) => {
      if (Array.isArray(item?.mainCategories)) return item.mainCategories;
      if (Array.isArray(item?.mainCategory)) return item.mainCategory;
      if (item?.mainCategory && typeof item.mainCategory === 'object') return [item.mainCategory];
      if (item?.category && typeof item.category === 'object' && !item?._id) return [item.category];
      return [item];
    })
    .filter((item) => item && typeof item === 'object' && (item._id || item.id) && (item.name || item.title || item.categoryName || item.mainCategoryName));
}

export async function listMainCategories() {
  const endpoint = userEndpoints.catalog.mainCategories;
  if (!getUserToken()) {
    const response = await apiClient.get(endpoint, { skipAuth: true, params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
    return mainCategoryCollection(response.data, endpoint);
  }
  const response = await apiClient.get(endpoint, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
  return mainCategoryCollection(response.data, endpoint);
}

function associatedCategoryCollection(payload, endpoint) {
  const candidates = [
    payload?.data?.categories,
    payload?.data?.category,
    payload?.data?.data,
    payload?.data,
    payload?.categories,
    payload?.category,
    payload,
  ];
  const value = candidates.find((candidate) => Array.isArray(candidate))
    ?? candidates.find((candidate) => candidate && typeof candidate === 'object');
  const rows = Array.isArray(value) ? value : (value ? [value] : []);

  return rows
    .flatMap((item) => {
      if (Array.isArray(item?.categories)) return item.categories;
      if (Array.isArray(item?.subCategories)) return item.subCategories;
      if (Array.isArray(item?.subCategory)) return item.subCategory;
      if (Array.isArray(item?.subcategories)) return item.subcategories;
      if (Array.isArray(item?.category)) return item.category;
      return [item?.category ?? item];
    })
    .filter((item) => item && typeof item === 'object' && (item._id || item.id || item.name || item.title));
}

export async function listCategoriesByMainCategory(mainCategoryId) {
  const endpoint = userEndpoints.catalog.categoriesByMainCategory(mainCategoryId);
  if (!getUserToken()) {
    const response = await apiClient.get(endpoint, { skipAuth: true, params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
    return associatedCategoryCollection(response.data, endpoint);
  }
  try {
    const response = await apiClient.get(endpoint, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
    return associatedCategoryCollection(response.data, endpoint);
  } catch (error) {
    // Logged-out catalogue browsing should not depend on the admin category
    // route. The User category endpoint is public on the deployed API and is
    // also a useful fallback when the admin route returns 401/403.
    const response = await apiClient.get(userEndpoints.catalog.categories, { skipAuth: true, params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
    const items = associatedCategoryCollection(response.data, userEndpoints.catalog.categories);
    const matching = items.filter((item) => {
      const parent = item?.mainCategoryId ?? item?.mainCategory ?? item?.parentId;
      const parentId = String(valueId(parent) || '');
      return !parentId || parentId === String(mainCategoryId);
    });
    if (matching.length) return matching;
    throw error;
  }
}

function subCategoryCollection(payload, endpoint) {
  const candidates = [
    payload?.data?.subCategories,
    payload?.data?.subCategory,
    payload?.data?.categories,
    payload?.data?.data,
    payload?.data,
    payload?.subCategories,
    payload?.subCategory,
    payload?.categories,
    payload,
  ];
  const value = candidates.find((candidate) => Array.isArray(candidate))
    ?? candidates.find((candidate) => candidate && typeof candidate === 'object');
  if (!value) throw new Error(`Unexpected response shape from ${endpoint}`);
  const rows = Array.isArray(value) ? value : [value];

  return rows
    .flatMap((item) => {
      if (Array.isArray(item?.subCategories)) return item.subCategories;
      if (Array.isArray(item?.subCategory)) return item.subCategory;
      if (Array.isArray(item?.categories)) return item.categories;
      return [item?.subCategory ?? item];
    })
    .filter((item) => item && typeof item === 'object' && (item._id || item.id || item.name || item.title || item.subCategoryName));
}

export async function listSubCategories(mainCategoryId, categoryId) {
  const endpoint = userEndpoints.catalog.subCategoriesByCategory(mainCategoryId, categoryId);
  if (!getUserToken()) {
    const response = await apiClient.get(endpoint, { skipAuth: true, params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
    return subCategoryCollection(response.data, endpoint);
  }
  try {
    const response = await apiClient.get(endpoint, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
    return subCategoryCollection(response.data, endpoint);
  } catch (error) {
    const rows = await getPublicServiceRows();
    const items = publicSubCategories(rows, mainCategoryId, { _id: categoryId });
    if (items.length) return items;
    throw error;
  }
}

export async function listServicesBySubCategory(mainCategoryId, categoryId, subCategoryId) {
  const endpoint = userEndpoints.catalog.servicesBySubCategory(mainCategoryId, categoryId, subCategoryId);
  if (!getUserToken()) {
    const rows = await getPublicServiceRows();
    return publicServicesForSubCategory(rows, mainCategoryId, { _id: categoryId }, { _id: subCategoryId });
  }
  try {
    const response = await apiClient.get(endpoint, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
    const values = collection(response.data, endpoint);
    const walk = (item) => {
      if (!item || typeof item !== 'object') return [];
      const nested = item.services ?? item.serviceTypes ?? item.items;
      return Array.isArray(nested) && nested.length ? nested.flatMap(walk) : [item];
    };
    return values.flatMap(walk).map((item, index) => mapService(item, index, 'category-service'));
  } catch (error) {
    const rows = await getPublicServiceRows();
    const items = publicServicesForSubCategory(rows, mainCategoryId, { _id: categoryId }, { _id: subCategoryId });
    if (items.length) return items;
    throw error;
  }
}

function packageCollection(payload, endpoint) {
  const candidates = [
    payload?.data?.packages,
    payload?.data?.package,
    payload?.data?.data,
    payload?.data,
    payload?.packages,
    payload?.package,
    payload,
  ];
  const value = candidates.find((candidate) => Array.isArray(candidate))
    ?? candidates.find((candidate) => candidate && typeof candidate === 'object');
  if (!value) throw new Error(`Unexpected response shape from ${endpoint}`);
  const rows = Array.isArray(value) ? value : [value];

  return rows
    .flatMap((item) => {
      if (Array.isArray(item?.packages)) return item.packages;
      if (Array.isArray(item?.package)) return item.package;
      // A package record itself contains `items: []`. Only treat `items` as
      // a wrapper when it actually contains nested package records.
      if (Array.isArray(item?.items) && item.items.length) return item.items;
      return [item?.package && typeof item.package === 'object' ? item.package : item];
    })
    .filter((item) => item && typeof item === 'object' && (item._id || item.id || item.packageId || item.name || item.packageName || item.title));
}

// The public User package catalogue is grouped by category:
// { category: { mainCategoryId }, package: [...] }.  Keep the wrapper
// context while flattening it; otherwise the package records lose the only
// main-category reference available in that response and cannot be matched
// to the selected page.
function publicPackageCollection(payload, mainCategoryId, endpoint) {
  const rows = Array.isArray(payload?.data)
    ? payload.data
    : packageCollection(payload, endpoint);
  const packages = [];

  rows.forEach((row) => {
    if (!row || typeof row !== 'object') return;
    const category = row?.category ?? {};
    const parent = row?.mainCategoryId ?? category?.mainCategoryId ?? category?.mainCategory ?? category?.parentId;
    const parentId = String(valueId(parent) || '');
    if (parentId && String(parentId) !== String(mainCategoryId)) return;

    const nested = Array.isArray(row?.package)
      ? row.package
      : (Array.isArray(row?.packages) ? row.packages : []);
    if (nested.length) {
      nested.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        packages.push({
          ...item,
          mainCategoryId: item?.mainCategoryId ?? parent,
          categoryId: item?.categoryId ?? category?._id ?? category?.id,
          category: item?.category ?? category,
        });
      });
      return;
    }

    // Also support a direct package array/object should the User endpoint
    // switch from wrappers to the same shape as the Admin endpoint.
    if (row?._id || row?.id || row?.packageId || row?.name || row?.packageName || row?.title) {
      packages.push({ ...row, mainCategoryId: row?.mainCategoryId ?? parent });
    }
  });

  return packages;
}

function packagesForMainCategory(payload, mainCategoryId, endpoint) {
  return packageCollection(payload, endpoint)
    .filter((item) => {
      const parent = item?.mainCategoryId ?? item?.mainCategory ?? item?.category?.mainCategoryId;
      const parentId = String(valueId(parent) || '');
      return !parentId || parentId === String(mainCategoryId);
    });
}

export async function listPackagesByCategory(mainCategoryId, categoryId) {
  const endpoint = userEndpoints.catalog.packagesByCategory(mainCategoryId, categoryId);
  const response = await apiClient.get(endpoint, {
    skipAuth: true,
    params: { _ts: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  });
  return packageCollection(response.data, endpoint).map((item, index) => mapPackage(item, index));
}

export async function listPackagesByMainCategory(mainCategoryId) {
  const endpoint = userEndpoints.catalog.packagesByMainCategory(mainCategoryId);
  // Package browsing is public. Always omit Authorization here so a stale or
  // expired login token cannot make the public catalogue return 401/403.
  // Cart and checkout requests remain authenticated in their own services.
  const requestConfig = {
    skipAuth: true,
    params: { _ts: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  };

  // The User catalogue is the public contract for package browsing. It
  // returns all packages (often grouped by category), so filter that response
  // locally by the selected main-category id before falling back to the
  // category-specific Admin route.
  try {
    const publicResponse = await apiClient.get(userEndpoints.catalog.packages, requestConfig);
    const publicPackages = publicPackageCollection(publicResponse.data, mainCategoryId, userEndpoints.catalog.packages);
    if (publicPackages.length) return publicPackages.map((item, index) => mapPackage(item, index));
  } catch {
    // Continue to the exact main-category endpoint below.
  }

  try {
    // Prefer the exact main-category endpoint. It may be exposed publicly on
    // one deployment and protected on another, so the request remains a
    // fallback for installations where the User catalogue is unavailable.
    const response = await apiClient.get(endpoint, requestConfig);
    const packages = packageCollection(response.data, endpoint);
    if (packages.length) return packages.map((item, index) => mapPackage(item, index));
  } catch { /* Try the public catalogue fallbacks below. */ }

  // Some deployments return 404/500 for the exact URL. Try the all-packages
  // route with the same public auth mode as a final compatibility fallback.
  try {
    const allResponse = await apiClient.get(userEndpoints.catalog.allPackages, requestConfig);
    const matching = packagesForMainCategory(allResponse.data, mainCategoryId, userEndpoints.catalog.allPackages);
    if (matching.length) return matching.map((item, index) => mapPackage(item, index));
  } catch {
    // Continue to the public User catalogue response below.
  }

  // A protected admin endpoint may fail even though the public catalogue
  // request succeeded. Do not surface that protected error in the catalogue.
  return [];
}

export const categoryService = Object.freeze({ listServices, listCategories, listMainCategories, listCategoriesByMainCategory, listSubCategories, listServicesBySubCategory, listPackagesByCategory, listPackagesByMainCategory });
