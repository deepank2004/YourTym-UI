import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';

function payload(data) { return data?.data?.cart ?? data?.data ?? data?.cart ?? data; }

// The cart schema validates houseType even when a cart item is added. Keep the
// value within the backend enum so a newly-created cart never receives an
// empty string. A selected address can override this default via storage.
function cartHouseType() {
  if (typeof window === 'undefined') return 'home';
  const value = window.localStorage?.getItem('selectedAddressHouseType')
    || window.localStorage?.getItem('houseType');
  return value === 'Other' ? 'Other' : 'home';
}

function cartBody(body) { return { ...body, houseType: cartHouseType() }; }

export const cartService = Object.freeze({
  async get() { return payload((await apiClient.get(userEndpoints.cart.get, { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache' } })).data); },
  async addService(serviceId, quantity = 1) { return (await apiClient.post(userEndpoints.cart.addSingleService, cartBody({ _id: serviceId, quantity }))).data; },
  async addPackage(packageId, quantity = 1) { return (await apiClient.post(userEndpoints.cart.addNormalPackage, cartBody({ packageId, quantity }))).data; },
  async addCustomPackage(packageId, quantity = 1) { return (await apiClient.post(userEndpoints.cart.addCustomPackage, cartBody({ packageId, quantity }))).data; },
  async updateCustomPackage(packageId, selectedServices, selectedAddOnServices = []) {
    const body = { packageId, selectedServices };
    if (Array.isArray(selectedAddOnServices) && selectedAddOnServices.length) body.selectedAddOnServices = selectedAddOnServices;
    return (await apiClient.put(userEndpoints.cart.updateCustomPackage, cartBody(body))).data;
  },
  async addEditedPackage(packageId, quantity = 1) { return (await apiClient.post(userEndpoints.cart.addEditedPackage, cartBody({ packageId, quantity }))).data; },
  async updateEditedPackage(packageId, selectedServices, selectedAddOnServices = []) {
    return (await apiClient.put(userEndpoints.cart.updateEditedPackage, cartBody({ packageId, selectedServices, selectedAddOnServices }))).data;
  },
  // The quantity endpoint accepts the same discriminator used by the cart
  // document (Services, AddOnServices or packageServices). Do not silently
  // rewrite Services to AddOnServices: doing so updates a different item (or
  // produces "service not found in the cart") for carts returned by the API.
  async updateService(serviceId, quantity, field = 'AddOnServices') {
    const bodyField = ['Services', 'AddOnServices', 'packageServices'].includes(field)
      ? field
      : 'AddOnServices';
    const fields = [...new Set([bodyField, 'AddOnServices', 'Services', 'packageServices'])];
    let lastError;
    for (const candidate of fields) {
      try {
        return (await apiClient.put(userEndpoints.cart.updateServiceQuantity, {
          [candidate]: serviceId,
          quantity,
        })).data;
      } catch (error) {
        lastError = error;
        const retryable = [400, 404, 500].includes(error?.status)
          && /not found|service|quantity|cart/i.test(String(error?.message || ''));
        if (!retryable) throw error;
      }
    }
    throw lastError;
  },
  async updatePackage(packageId, quantity) {
    return (await apiClient.put(userEndpoints.cart.updatePackageQuantity, {
      packageId,
      quantity,
    })).data;
  },
  async removeService(serviceId, isPackageService = false) {
    return (await apiClient.post(userEndpoints.cart.removeService, { serviceId, isPackageService })).data;
  },
  async removePackage(packageId) {
    return (await apiClient.post(userEndpoints.cart.removePackage, { packageId })).data;
  },
  async applyCoupon(couponCode) { return (await apiClient.put(userEndpoints.cart.applyCoupon, { couponCode })).data; },
});
