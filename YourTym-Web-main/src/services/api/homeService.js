import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';

function collection(payload, endpoint) {
  const candidates = [payload, payload?.data, payload?.data?.data, payload?.data?.items, payload?.data?.results, payload?.items, payload?.results];
  const items = candidates.find(Array.isArray);
  if (!items) throw new Error(`Unexpected response shape from ${endpoint}`);
  return items;
}

function idOf(item, index, prefix) {
  return String(item?._id ?? item?.id ?? item?.serviceId ?? item?.categoryId ?? item?.packageId ?? item?.bannerId ?? `${prefix}-${item?.name ?? item?.title ?? index}`);
}

function imageOf(item) { return item?.image ?? item?.imageUrl ?? item?.bannerImage ?? item?.thumbnail ?? item?.media?.url ?? ''; }

export function mapService(item, index, prefix = 'service') {
  return { id: idOf(item, index, prefix), name: item?.name ?? item?.serviceName ?? item?.title ?? 'Service', description: item?.description ?? '', duration: Number(item?.duration ?? item?.serviceDuration ?? item?.timeInMin ?? 0), original: Number(item?.originalPrice ?? item?.mrp ?? item?.price ?? 0), price: Number(item?.discountPrice ?? item?.sellingPrice ?? item?.discountedPrice ?? item?.amount ?? item?.price ?? 0), brand: item?.brand ?? item?.brands ?? '', image: imageOf(item) };
}
export function mapPackage(item, index) {
  return { ...mapService(item, index, 'package'), name: item?.name ?? item?.packageName ?? item?.title ?? 'Package', isPackage: true, packageId: item?._id ?? item?.id ?? item?.packageId };
}

async function get(path) { const response = await apiClient.get(path); return collection(response.data, path); }

export const homeService = Object.freeze({
  async banners() { return get(userEndpoints.banners.static); },
  async categories() { return get(userEndpoints.catalog.categories); },
  async services() { return get(userEndpoints.catalog.services); },
  async packages() { return get(userEndpoints.catalog.packages); },
  async mostSearched() { return get(userEndpoints.catalog.mostSearched); },
  async recommended() { return get(userEndpoints.catalog.frequentlyAddedServices); },
});
