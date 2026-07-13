import apiClient from './apiClient.js';
import { userEndpoints } from './userEndpoints.js';

function getTemporaryLoginId(payload) {
  return (
    payload?.data?._id ||
    payload?.data?.id ||
    payload?.user?._id ||
    payload?._id ||
    null
  );
}

function getSuccessMessage(payload) {
  return payload?.message || payload?.data?.message || 'OTP sent successfully.';
}

function getAuthToken(payload) {
  return (
    payload?.token ||
    payload?.data?.token ||
    payload?.data?.user?.token ||
    payload?.user?.token ||
    payload?.accessToken ||
    payload?.data?.accessToken ||
    payload?.data?.user?.accessToken ||
    payload?.user?.accessToken ||
    null
  );
}

function getResponseMessage(payload, fallback) {
  return payload?.message || payload?.data?.message || fallback;
}

export async function loginWithPhone(phone) {
  const response = await apiClient.post(
    userEndpoints.auth.loginWithPhone,
    { phone },
    { skipAuth: true }
  );
  const payload = response.data || {};

  return {
    loginId: getTemporaryLoginId(payload),
    isRegistered: payload?.isRegistered ?? payload?.data?.isRegistered ?? payload?.data?.user?.isRegistered ?? Boolean(payload?.user || payload?.data?.user),
    message: getSuccessMessage(payload),
  };
}

export async function verifyOtp({ loginId, otp, deviceToken }) {
  const response = await apiClient.post(
    userEndpoints.auth.verifyOtp(loginId),
    { otp, deviceToken },
    { skipAuth: true }
  );
  const payload = response.data || {};
  const token = getAuthToken(payload);

  if (!token) {
    const error = new Error('OTP verification did not return an authentication token.');
    error.response = { status: 200, data: payload };
    throw error;
  }

  return {
    token,
    isRegistered: payload?.isRegistered ?? payload?.data?.isRegistered ?? payload?.data?.user?.isRegistered ?? Boolean(payload?.user || payload?.data?.user),
    isNewUser: payload?.isNewUser ?? payload?.data?.isNewUser ?? false,
    message: getResponseMessage(payload, 'Login successful.'),
  };
}

export async function resendOtp(loginId) {
  const response = await apiClient.post(
    userEndpoints.auth.resendOtp(loginId),
    undefined,
    { skipAuth: true }
  );
  const payload = response.data || {};

  return {
    message: getResponseMessage(payload, 'OTP resent successfully.'),
  };
}

export async function registerUser({ fullName, email, gender, refferalCode }) {
  const response = await apiClient.post(userEndpoints.auth.registration, {
    fullName,
    email,
    gender,
    refferalCode,
  });
  const payload = response.data || {};

  return {
    token: getAuthToken(payload),
    message: getResponseMessage(payload, 'Registration successful.'),
  };
}
