import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';
import { mapService, mapPackage } from './homeService.js';

function collection(payload, endpoint) {
  const values = [payload, payload?.data, payload?.data?.data, payload?.data?.data?.data, payload?.data?.items, payload?.data?.data?.items, payload?.data?.services, payload?.data?.service, payload?.services, payload?.service, payload?.data?.results, payload?.items, payload?.results];
  const result = values.find(Array.isArray);
  if (!result) throw new Error(`Unexpected response shape from ${endpoint}`);
  return result;
}

export async function listServices({ search } = {}) {
  const config = search?.trim() ? { params: { search: search.trim() } } : undefined;
  const response = await apiClient.get(userEndpoints.catalog.search && search?.trim() ? userEndpoints.catalog.search : userEndpoints.catalog.services, { ...(config || {}), params: { ...(config?.params || {}), _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
  const values = collection(response.data, search?.trim() ? userEndpoints.catalog.search : userEndpoints.catalog.services);
  const walk = (item) => { if (!item || typeof item !== 'object') return []; const nested = item.services ?? item.serviceTypes ?? item.items; return Array.isArray(nested) && nested.length ? nested.flatMap(walk) : [item]; };
  const flattened = values.flatMap(walk);
  return flattened.map((item, index) => mapService(item, index));
}

export async function listCategories() {
  const response = await apiClient.get(userEndpoints.catalog.categories);
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
  const response = await apiClient.get(endpoint, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
  return associatedCategoryCollection(response.data, endpoint);
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
  const response = await apiClient.get(endpoint, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
  return subCategoryCollection(response.data, endpoint);
}

export async function listServicesBySubCategory(mainCategoryId, categoryId, subCategoryId) {
  const endpoint = userEndpoints.catalog.servicesBySubCategory(mainCategoryId, categoryId, subCategoryId);
  const response = await apiClient.get(endpoint, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
  const values = collection(response.data, endpoint);
  const walk = (item) => {
    if (!item || typeof item !== 'object') return [];
    const nested = item.services ?? item.serviceTypes ?? item.items;
    return Array.isArray(nested) && nested.length ? nested.flatMap(walk) : [item];
  };
  return values.flatMap(walk).map((item, index) => mapService(item, index, 'category-service'));
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
      if (Array.isArray(item?.items)) return item.items;
      return [item?.package && typeof item.package === 'object' ? item.package : item];
    })
    .filter((item) => item && typeof item === 'object' && (item._id || item.id || item.packageId || item.name || item.packageName || item.title));
}

export async function listPackagesByCategory(mainCategoryId, categoryId) {
  const endpoint = userEndpoints.catalog.packagesByCategory(mainCategoryId, categoryId);
  const response = await apiClient.get(endpoint, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
  return packageCollection(response.data, endpoint).map((item, index) => mapPackage(item, index));
}

export async function listPackagesByMainCategory(mainCategoryId) {
  const endpoint = userEndpoints.catalog.packagesByMainCategory(mainCategoryId);
  const response = await apiClient.get(endpoint, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
  return packageCollection(response.data, endpoint).map((item, index) => mapPackage(item, index));
}

export const categoryService = Object.freeze({ listServices, listCategories, listMainCategories, listCategoriesByMainCategory, listSubCategories, listServicesBySubCategory, listPackagesByCategory, listPackagesByMainCategory });
