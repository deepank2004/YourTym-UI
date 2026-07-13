import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';

function payload(data) { return data?.data?.cart ?? data?.data ?? data?.cart ?? data; }
export const cartService = Object.freeze({
  async get() { return payload((await apiClient.get(userEndpoints.cart.get, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } })).data); },
  async addService(serviceId, quantity = 1) { return (await apiClient.post(userEndpoints.cart.addSingleService, { _id: serviceId, quantity })).data; },
  async addPackage(packageId, quantity = 1) { return (await apiClient.post(userEndpoints.cart.addNormalPackage, { packageId, quantity })).data; },
  async updateService(serviceId, quantity, field = 'AddOnServices') { const bodyField = field === 'Services' ? 'AddOnServices' : field; return (await apiClient.put(userEndpoints.cart.updateServiceQuantity, { [bodyField]: serviceId, quantity })).data; },
  async updatePackage(packageId, quantity) { return (await apiClient.put(userEndpoints.cart.updatePackageQuantity, { packageId, quantity })).data; },
  async removeService(serviceId, isPackageService = false) { return (await apiClient.post(userEndpoints.cart.removeService, { serviceId, isPackageService })).data; },
  async applyCoupon(couponCode) { return (await apiClient.put(userEndpoints.cart.applyCoupon, { couponCode })).data; },
});
