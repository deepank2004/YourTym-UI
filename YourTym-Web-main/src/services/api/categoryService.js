import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';
import { mapService } from './homeService.js';

function collection(payload, endpoint) {
  const values = [payload, payload?.data, payload?.data?.data, payload?.data?.items, payload?.data?.results, payload?.items, payload?.results];
  const result = values.find(Array.isArray);
  if (!result) throw new Error(`Unexpected response shape from ${endpoint}`);
  return result;
}

export async function listServices({ search } = {}) {
  const config = search?.trim() ? { params: { search: search.trim() } } : undefined;
  const response = await apiClient.get(userEndpoints.catalog.search && search?.trim() ? userEndpoints.catalog.search : userEndpoints.catalog.services, config);
  return collection(response.data, search?.trim() ? userEndpoints.catalog.search : userEndpoints.catalog.services).map((item, index) => mapService(item, index));
}

export async function listCategories() {
  const response = await apiClient.get(userEndpoints.catalog.categories);
  return collection(response.data, userEndpoints.catalog.categories);
}

export const categoryService = Object.freeze({ listServices, listCategories });
