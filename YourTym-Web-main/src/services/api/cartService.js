import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';

function payload(data) { return data?.data?.cart ?? data?.data ?? data?.cart ?? data; }
export const cartService = Object.freeze({
  async get() { return payload((await apiClient.get(userEndpoints.cart.get, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } })).data); },
  async addService(serviceId, quantity = 1) { return (await apiClient.post(userEndpoints.cart.addSingleService, { _id: serviceId, quantity })).data; },
  async addPackage(packageId, quantity = 1) { return (await apiClient.post(userEndpoints.cart.addNormalPackage, { packageId, quantity })).data; },
  async addCustomPackage(packageId, quantity = 1) { return (await apiClient.post(userEndpoints.cart.addCustomPackage, { packageId, quantity })).data; },
  async updateCustomPackage(packageId, selectedServices, selectedAddOnServices = []) {
    const body = { packageId, selectedServices };
    if (Array.isArray(selectedAddOnServices) && selectedAddOnServices.length) body.selectedAddOnServices = selectedAddOnServices;
    return (await apiClient.put(userEndpoints.cart.updateCustomPackage, body)).data;
  },
  async addEditedPackage(packageId, quantity = 1) { return (await apiClient.post(userEndpoints.cart.addEditedPackage, { packageId, quantity })).data; },
  async updateEditedPackage(packageId, selectedServices, selectedAddOnServices = []) {
    return (await apiClient.put(userEndpoints.cart.updateEditedPackage, { packageId, selectedServices, selectedAddOnServices })).data;
  },
  async updateService(serviceId, quantity, field = 'AddOnServices') { const bodyField = field === 'Services' ? 'AddOnServices' : field; return (await apiClient.put(userEndpoints.cart.updateServiceQuantity, { [bodyField]: serviceId, quantity })).data; },
  async updatePackage(packageId, quantity) { return (await apiClient.put(userEndpoints.cart.updatePackageQuantity, { packageId, quantity })).data; },
  async removeService(serviceId, isPackageService = false) { return (await apiClient.post(userEndpoints.cart.removeService, { serviceId, isPackageService })).data; },
  async applyCoupon(couponCode) { return (await apiClient.put(userEndpoints.cart.applyCoupon, { couponCode })).data; },
});
