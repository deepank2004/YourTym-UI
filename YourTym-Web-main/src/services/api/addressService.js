import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';

const ADDRESS_FIELDS = ['houseFlat', 'appartment', 'landMark', 'houseType'];

function getPayloadMessage(payload, fallback) {
  return payload?.message || payload?.data?.message || fallback;
}

function getAddressId(address) {
  return address?._id || address?.id || '';
}

function mapAddress(address) {
  if (!address || typeof address !== 'object') return null;

  return {
    id: getAddressId(address),
    houseFlat: address.houseFlat ?? '',
    appartment: address.appartment ?? '',
    landMark: address.landMark ?? '',
    houseType: address.houseType ?? '',
  };
}

function getAddressList(payload) {
  const candidates = [
    payload?.data?.addresses,
    payload?.addresses,
    payload?.data,
    payload,
  ];
  const list = candidates.find(Array.isArray) || [];
  return list.map(mapAddress).filter(Boolean);
}

function getSingleAddress(payload) {
  return mapAddress(payload?.data?.address || payload?.address || payload?.data || payload);
}

export async function getAddresses() {
  const response = await apiClient.get(userEndpoints.addresses.list);
  const payload = response.data || {};

  return {
    addresses: getAddressList(payload),
    message: getPayloadMessage(payload, ''),
  };
}

export async function addAddress(address) {
  const response = await apiClient.post(userEndpoints.addresses.create, {
    houseFlat: address.houseFlat,
    appartment: address.appartment,
    landMark: address.landMark,
    houseType: address.houseType,
  });
  const payload = response.data || {};

  return {
    address: getSingleAddress(payload),
    message: getPayloadMessage(payload, 'Address added successfully.'),
  };
}

export async function updateAddress(addressId, address) {
  const response = await apiClient.put(userEndpoints.addresses.update(addressId), {
    houseFlat: address.houseFlat,
    appartment: address.appartment,
    landMark: address.landMark,
    houseType: address.houseType,
  });
  const payload = response.data || {};

  return {
    address: getSingleAddress(payload),
    message: getPayloadMessage(payload, 'Address updated successfully.'),
  };
}

export async function deleteAddress(addressId) {
  const response = await apiClient.delete(userEndpoints.addresses.remove(addressId));
  const payload = response.data || {};

  return {
    message: getPayloadMessage(payload, 'Address deleted successfully.'),
  };
}

export async function attachAddressToCart(addressId) {
  const response = await apiClient.put(userEndpoints.cart.addAddress(addressId));
  const payload = response.data || {};

  return {
    message: getPayloadMessage(payload, 'Address selected for this booking.'),
  };
}

export { ADDRESS_FIELDS };
