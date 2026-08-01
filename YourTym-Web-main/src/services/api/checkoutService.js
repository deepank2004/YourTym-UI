import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';

function flattenSlotGroups(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const groupedSlots = entry?.slots ?? entry?.timeSlots;
    if (entry && Array.isArray(groupedSlots)) {
      return groupedSlots.map((slot) => ({
        ...entry,
        ...slot,
        date: slot.date ?? entry.date ?? entry.slotDate,
      }));
    }
    return [entry];
  });
}

function list(data) {
  const candidates = [
    data?.data?.slots,
    data?.data?.timeSlots,
    data?.data?.slot,
    data?.data?.availableSlots,
    data?.data?.items,
    data?.data?.data,
    data?.slots,
    data?.timeSlots,
    data?.slot,
    data?.availableSlots,
    data?.items,
    data?.data,
    data,
  ];
  const value = candidates.find(Array.isArray);
  if (!value) throw new Error('Unexpected slot response from /api/v1/user/slot');
  return flattenSlotGroups(value);
}

export const checkoutService = Object.freeze({
  async getSlots() { return list((await apiClient.get(userEndpoints.slots.list)).data); },
  async selectDateTime(date, startTime, endTime) { return (await apiClient.put(userEndpoints.cart.addDateAndTime, { date, startTime, endTime })).data; },
});
