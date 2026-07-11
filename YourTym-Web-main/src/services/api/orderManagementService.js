import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';
const list = (data) => data?.data?.orders ?? data?.data ?? data?.orders ?? data;
export const orderManagementService = Object.freeze({
  async history() { const [ongoing, completed] = await Promise.all([apiClient.get(userEndpoints.orders.ongoing), apiClient.get(userEndpoints.orders.completed)]); return [...(list(ongoing.data) || []), ...(list(completed.data) || [])]; },
  async details(id) { return (await apiClient.get(userEndpoints.orders.getById(id))).data; },
  async cancel(code, reason) { return (await apiClient.post(userEndpoints.orders.cancel(code), { cancelReason: reason })).data; },
  async rate(payload) { return (await apiClient.post(userEndpoints.ratings.create, payload)).data; },
});
