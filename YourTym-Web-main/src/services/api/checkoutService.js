import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';

function list(data) { const value = data?.data?.slots ?? data?.data ?? data?.slots ?? data; if (!Array.isArray(value)) throw new Error('Unexpected slot response from /api/v1/user/slot'); return value; }
export const checkoutService = Object.freeze({
  async getSlots() { return list((await apiClient.get(userEndpoints.slots.list)).data); },
  async selectDateTime(date, startTime, endTime) { return (await apiClient.put(userEndpoints.cart.addDateAndTime, { date, startTime, endTime })).data; },
});
