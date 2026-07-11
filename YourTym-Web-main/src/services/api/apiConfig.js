const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!configuredBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required. Copy .env.example to .env.');
}

let parsedBaseUrl;

try {
  parsedBaseUrl = new URL(configuredBaseUrl);
} catch {
  throw new Error('VITE_API_BASE_URL must be a valid absolute URL.');
}

if (!['http:', 'https:'].includes(parsedBaseUrl.protocol)) {
  throw new Error('VITE_API_BASE_URL must use http or https.');
}

if (parsedBaseUrl.pathname !== '/' || parsedBaseUrl.search || parsedBaseUrl.hash) {
  throw new Error('VITE_API_BASE_URL must contain only the API origin, without /api/v1.');
}

export const API_BASE_URL = parsedBaseUrl.origin;
export const API_VERSION_PATH = '/api/v1';
export const USER_API_PATH = `${API_VERSION_PATH}/user`;
export const API_TIMEOUT_MS = 15_000;
