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
function plainText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizedLabel(value) {
  return plainText(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function objectId(value) {
  if (value && typeof value === 'object') return value?._id ?? value?.id ?? '';
  return value ?? '';
}

function packageServices(item) {
  const rows = [];
  const groups = Array.isArray(item?.services) ? item.services : [];
  groups.forEach((group) => {
    const category = group?.category?.categoryId ?? group?.category ?? {};
    const subCategories = Array.isArray(group?.category?.subCategory) ? group.category.subCategory : [];
    subCategories.forEach((subCategory) => {
      const sub = subCategory?.subCategoryId ?? subCategory ?? {};
      const services = Array.isArray(subCategory?.services) ? subCategory.services : [];
      services.forEach((service, index) => {
        const location = service?.location?.[0] ?? {};
        const id = String(objectId(service?._id ?? service?.id ?? `package-service-${rows.length}`));
        rows.push({
          id,
          name: service?.name ?? service?.serviceName ?? service?.title ?? 'Included service',
          category: category?.name ?? '',
          subCategory: sub?.name ?? '',
          description: plainText(service?.description),
          duration: Number(service?.timeInMin ?? service?.duration ?? 0),
          original: Number(service?.originalPrice ?? location.originalPrice ?? service?.price ?? 0),
          price: Number(service?.discountPrice ?? location.discountPrice ?? service?.price ?? 0),
          image: imageOf(service),
          raw: service,
          index,
        });
      });
    });
  });
  const seenIds = new Set();
  const seenContent = new Set();
  return rows.filter((row) => {
    const idKey = row.id && !row.id.startsWith('package-service-') ? row.id : '';
    const contentKey = [row.category, row.subCategory, row.name, row.description].map(normalizedLabel).join('|');
    if ((idKey && seenIds.has(idKey)) || seenContent.has(contentKey)) return false;
    if (idKey) seenIds.add(idKey);
    seenContent.add(contentKey);
    return true;
  });
}

export function groupPackageServices(services = []) {
  const groups = new Map();
  services.forEach((service) => {
    const category = plainText(service?.category);
    const subCategory = plainText(service?.subCategory) || 'Included services';
    const groupKey = `${normalizedLabel(category)}|${normalizedLabel(subCategory)}`;
    const current = groups.get(groupKey) || { ...service, category, subCategory, names: [], descriptions: [], ids: [] };
    const name = plainText(service?.name) || 'Included service';
    const nameKey = normalizedLabel(name);
    if (!current.names.some((item) => normalizedLabel(item) === nameKey)) current.names.push(name);
    const description = plainText(service?.description);
    if (description && !current.descriptions.some((item) => normalizedLabel(item) === normalizedLabel(description))) current.descriptions.push(description);
    if (service?.id && !current.ids.includes(service.id)) current.ids.push(service.id);
    groups.set(groupKey, current);
  });
  return [...groups.values()].map((group) => ({
    ...group,
    id: group.ids[0] || `${normalizedLabel(group.category)}-${normalizedLabel(group.subCategory)}`,
    name: group.names.join(', '),
    description: group.descriptions.join(' '),
  }));
}

export function mapService(item, index, prefix = 'service') {
  const source = item?.service ?? item?.Service ?? item?.serviceDetails ?? item;
  const location = source?.location?.[0] ?? {};
  return { id: idOf(source, index, prefix) !== `${prefix}-${source?.name ?? source?.title ?? index}` ? idOf(source, index, prefix) : idOf(item, index, prefix), serviceTypeId: source?.serviceTypeId ?? item?.serviceTypeId, name: source?.name ?? source?.serviceName ?? source?.title ?? 'Service', description: source?.description ?? source?.mainDescription ?? '', duration: Number(source?.duration ?? source?.serviceDuration ?? source?.timeInMin ?? 0), original: Number(source?.originalPrice ?? source?.mrp ?? source?.price ?? location.originalPrice ?? 0), price: Number(source?.discountPrice ?? source?.sellingPrice ?? source?.discountedPrice ?? source?.discountedPriceWithTax ?? source?.amount ?? source?.price ?? location.discountPrice ?? 0), brand: source?.brand ?? source?.brands ?? '', image: imageOf(source), video: videoOf(source) };
}
export function mapPackage(item, index) {
  const mapped = mapService(item, index, 'package');
  const includedServices = packageServices(item);
  const packageType = item?.packageType ?? item?.type ?? 'Normal';
  const packagePrice = item?.discountPrice ?? item?.sellingPrice ?? item?.price ?? item?.location?.[0]?.discountPrice;
  const packageOriginal = item?.originalPrice ?? item?.mrp ?? item?.location?.[0]?.originalPrice;
  return {
    ...item,
    ...mapped,
    id: String(item?._id ?? item?.id ?? item?.packageId ?? mapped.id),
    packageId: item?._id ?? item?.id ?? item?.packageId,
    name: item?.name ?? item?.packageName ?? item?.title ?? 'Package',
    description: plainText(item?.description ?? mapped.description),
    rawDescription: item?.description ?? '',
    duration: Number(item?.timeInMin ?? item?.duration ?? mapped.duration ?? 0),
    hasPrice: packagePrice !== undefined && packagePrice !== null,
    price: packagePrice !== undefined && packagePrice !== null ? Number(packagePrice) : mapped.price,
    original: packageOriginal !== undefined && packageOriginal !== null ? Number(packageOriginal) : mapped.original,
    rating: Number(item?.rating ?? 0),
    packageType,
    includedServices,
    selectedServices: (() => {
      const explicitlySelected = includedServices.filter((service) => service?.raw?.selected === true).map((service) => service.id);
      return explicitlySelected.length ? explicitlySelected : includedServices.map((service) => service.id);
    })(),
    isEditable: /custom|edit/i.test(String(packageType)),
    isPackage: true,
  };
}

async function get(path, { cacheBust = true, skipAuth = false } = {}) {
  const config = { headers: { 'Cache-Control': 'no-cache' } };
  if (cacheBust) config.params = { _ts: Date.now() };
  if (skipAuth) config.skipAuth = true;
  const response = await apiClient.get(path, config);
  return collection(response.data, path);
}

function flattenServices(items) { const walk = (item, parentId) => { if (!item || typeof item !== 'object') return []; const nested = item.services ?? item.serviceTypes ?? item.items; if (Array.isArray(nested) && nested.length) return nested.flatMap((child) => walk(child, child.categoryId ?? item._id ?? item.id ?? parentId)); return [{ ...item, categoryId: item.categoryId ?? parentId }]; }; return items.flatMap((item) => walk(item, null)); }

export const homeService = Object.freeze({
  // Keep this request identical to the Postman request. Some deployments
  // reject query strings on the static-banner route even though the route
  // itself is valid.
  async banners() { return get(userEndpoints.banners.static, { cacheBust: false, skipAuth: true }); },
  async categories() { return (await get(userEndpoints.catalog.categories, { skipAuth: true })).map((item) => item?.category ?? item).filter((item) => item && (item._id || item.id) && item.name); },
  async services() { return flattenServices(await get(userEndpoints.catalog.services, { skipAuth: true })); },
  async packages() {
    const rows = await get(userEndpoints.catalog.packages, { skipAuth: true });
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
