import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';

function collection(payload, endpoint) {
  const candidates = [payload, payload?.data, payload?.data?.data, payload?.data?.data?.data, payload?.data?.items, payload?.data?.data?.items, payload?.data?.results, payload?.items, payload?.results];
  const items = candidates.find(Array.isArray);
  if (!items) throw new Error(`Unexpected response shape from ${endpoint}`);
  return items;
}

function idOf(item, index, prefix) {
  return String(item?._id ?? item?.id ?? item?.serviceId ?? item?.serviceTypeId ?? item?.service?._id ?? item?.Service?._id ?? item?.categoryId ?? item?.packageId ?? item?.bannerId ?? `${prefix}-${item?.name ?? item?.title ?? index}`);
}

function mediaUrl(value) { return typeof value === 'string' ? value : (value?.url ?? value?.path ?? value?.secure_url ?? ''); }
function imageOf(item) { const mediaType = item?.media?.type ?? item?.media?.mimeType ?? ''; return mediaUrl(item?.image) || mediaUrl(item?.imageUrl) || mediaUrl(item?.bannerImage) || mediaUrl(item?.thumbnail) || mediaUrl(item?.media) || mediaUrl(item?.media?.image) || mediaUrl(item?.media?.imageUrl) || (/video/i.test(mediaType) ? '' : mediaUrl(item?.media?.url)) || mediaUrl(item?.images?.[0]?.img); }
function videoOf(item) { const mediaType = item?.media?.type ?? item?.media?.mimeType ?? ''; return mediaUrl(item?.video) || mediaUrl(item?.videoUrl) || mediaUrl(item?.videoURL) || mediaUrl(item?.videoLink) || mediaUrl(item?.media?.video) || mediaUrl(item?.media?.videoUrl) || mediaUrl(item?.media?.videoURL) || (/video/i.test(mediaType) ? mediaUrl(item?.media?.url) : ''); }

export function mapService(item, index, prefix = 'service') {
  const source = item?.service ?? item?.Service ?? item?.serviceDetails ?? item;
  const location = source?.location?.[0] ?? {};
  return { id: idOf(source, index, prefix) !== `${prefix}-${source?.name ?? source?.title ?? index}` ? idOf(source, index, prefix) : idOf(item, index, prefix), serviceTypeId: source?.serviceTypeId ?? item?.serviceTypeId, name: source?.name ?? source?.serviceName ?? source?.title ?? 'Service', description: source?.description ?? source?.mainDescription ?? '', duration: Number(source?.duration ?? source?.serviceDuration ?? source?.timeInMin ?? 0), original: Number(source?.originalPrice ?? source?.mrp ?? source?.price ?? location.originalPrice ?? 0), price: Number(source?.discountPrice ?? source?.sellingPrice ?? source?.discountedPrice ?? source?.discountedPriceWithTax ?? source?.amount ?? source?.price ?? location.discountPrice ?? 0), brand: source?.brand ?? source?.brands ?? '', image: imageOf(source), video: videoOf(source) };
}
export function mapPackage(item, index) {
  return { ...item, ...mapService(item, index, 'package'), name: item?.name ?? item?.packageName ?? item?.title ?? 'Package', isPackage: true, packageId: item?._id ?? item?.id ?? item?.packageId };
}

async function get(path) { const response = await apiClient.get(path, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } }); return collection(response.data, path); }

function flattenServices(items) { const walk = (item, parentId) => { if (!item || typeof item !== 'object') return []; const nested = item.services ?? item.serviceTypes ?? item.items; if (Array.isArray(nested) && nested.length) return nested.flatMap((child) => walk(child, child.categoryId ?? item._id ?? item.id ?? parentId)); return [{ ...item, categoryId: item.categoryId ?? parentId }]; }; return items.flatMap((item) => walk(item, null)); }

export const homeService = Object.freeze({
  async banners() { return get(userEndpoints.banners.static); },
  async categories() { return (await get(userEndpoints.catalog.categories)).map((item) => item?.category ?? item).filter((item) => item && (item._id || item.id) && item.name); },
  async services() { return flattenServices(await get(userEndpoints.catalog.services)); },
  async packages() {
    const rows = await get(userEndpoints.catalog.packages);
    // The User packages endpoint returns category wrappers with a singular
    // `package` array. Flatten that exact response and never turn an empty
    // category into a fake package card.
    return rows.flatMap((item) => {
      if (Array.isArray(item?.package)) return item.package;
      if (Array.isArray(item?.packages)) return item.packages;
      return [item];
    });
  },
  async mostSearched() { return get(userEndpoints.catalog.mostSearched); },
  async recommended() { return get(userEndpoints.catalog.frequentlyAddedServices); },
});
