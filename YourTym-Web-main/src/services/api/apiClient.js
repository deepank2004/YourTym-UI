import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from './apiConfig.js';
import { normalizeApiError } from './apiError.js';
import { getUserToken, clearAuthentication } from './tokenStorage.js';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = config.skipAuth ? null : getUserToken();

    if (token) {
      const authorization = `Bearer ${token}`;

      if (typeof config.headers?.set === 'function') {
        config.headers.set('Authorization', authorization);
      } else {
        config.headers = {
          ...config.headers,
          Authorization: authorization,
        };
      }
    }

    return config;
  },
  (error) => Promise.reject(normalizeApiError(error))
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error);
    if (typeof window !== 'undefined' && normalized.message) {
      window.dispatchEvent(new CustomEvent('api-error', { detail: { message: normalized.message, status: normalized.status } }));
    }
    if (normalized.status === 401 && typeof window !== 'undefined') {
      clearAuthentication();
      if (window.location.pathname !== '/login') {
        window.sessionStorage.setItem('authReturnPath', window.location.pathname);
        window.dispatchEvent(new Event('auth-expired'));
      }
    }
    return Promise.reject(normalized);
  }
);

export default apiClient;
