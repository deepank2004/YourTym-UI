import apiClient from './apiClient.js';

function unwrap(data) { return data?.data?.data ?? data?.data ?? data?.result ?? data; }
function text(data) { const value = unwrap(data); return Array.isArray(value) ? (value[0] ?? {}) : (value && typeof value === 'object' ? value : {}); }

export const staticContentService = Object.freeze({
  async about() { const value = text((await apiClient.get('/api/v1/static/getAboutUs')).data); return { title: value.title ?? 'About YourTym', body: value.desc ?? value.description ?? value.aboutUs ?? value.content ?? '' }; },
  async privacy() { const value = text((await apiClient.get('/api/v1/static/getPrivacy')).data); return { title: 'Privacy policy', body: value.privacy ?? value.description ?? value.content ?? '' }; },
  async terms() { const value = text((await apiClient.get('/api/v1/static/getTerms')).data); return { title: 'Terms & conditions', body: value.terms ?? value.description ?? value.content ?? '' }; },
  async offers() { return unwrap((await apiClient.get('/api/v1/user/Offer/listOffer')).data); },
});
