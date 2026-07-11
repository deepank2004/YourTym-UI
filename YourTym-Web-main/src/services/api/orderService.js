import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';

export const orderService = Object.freeze({
  async checkout() { return (await apiClient.post(userEndpoints.orders.checkout)).data; },
  async place(orderCode, payment) { return (await apiClient.post(userEndpoints.orders.place(orderCode), payment)).data; },
});
