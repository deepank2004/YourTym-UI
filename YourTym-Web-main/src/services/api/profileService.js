import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';

const PROFILE_FIELDS = [
  'fullName',
  'email',
  'phone',
  'gender',
  'dob',
  'address1',
  'address2',
];

function getPayloadMessage(payload, fallback) {
  return payload?.message || payload?.data?.message || fallback;
}

export function mapProfileResponse(payload) {
  const profile = payload?.data?.user || payload?.data?.data?.user || payload?.user || payload?.data?.data || payload?.data || payload || {};

  return PROFILE_FIELDS.reduce((mapped, field) => {
    mapped[field] = profile?.[field] ?? '';
    return mapped;
  }, {
    image: profile?.image ?? '',
  });
}

export async function updateLocation({ currentLat, currentLong, city, sector }) {
  const body = { currentLat, currentLong, city };
  if (sector) body.sector = sector;
  const response = await apiClient.put(userEndpoints.profile.updateLocation, body);
  return response.data;
}

export async function getProfile() {
  const response = await apiClient.get(userEndpoints.profile.get);
  const payload = response.data || {};

  return {
    profile: mapProfileResponse(payload),
    message: getPayloadMessage(payload, ''),
  };
}

export async function updateProfile({ profile, imageFile }) {
  const formData = new FormData();

  PROFILE_FIELDS.forEach((field) => {
    formData.append(field, profile[field] ?? '');
  });

  if (typeof File !== 'undefined' && imageFile instanceof File) {
    formData.append('image', imageFile);
  }

  const response = await apiClient.put(userEndpoints.profile.update, formData);
  const payload = response.data || {};

  return {
    profile: mapProfileResponse(payload),
    message: getPayloadMessage(payload, 'Profile updated successfully.'),
  };
}
