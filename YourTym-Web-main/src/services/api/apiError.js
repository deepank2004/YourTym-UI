const STATUS_MESSAGES = {
  400: 'The request could not be processed.',
  401: 'Your session is missing or has expired.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'The request conflicts with the current resource state.',
  422: 'Some submitted information is invalid.',
  429: 'Too many requests were made. Please try again shortly.',
};

function getPayloadMessage(payload) {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message;
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof payload?.error?.message === 'string' && payload.error.message.trim()) {
    return payload.error.message;
  }
  return null;
}

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? null;
    this.code = options.code ?? null;
    this.details = options.details ?? null;
    this.isNetworkError = options.isNetworkError ?? false;
    this.isTimeout = options.isTimeout ?? false;
  }
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) return error;

  const status = error?.response?.status ?? null;
  const payload = error?.response?.data;
  const isTimeout = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT';
  const isNetworkError = Boolean(error?.request && !error?.response);

  let fallbackMessage = 'An unexpected API error occurred.';

  if (isTimeout) {
    fallbackMessage = 'The request timed out. Please try again.';
  } else if (isNetworkError) {
    fallbackMessage = 'Unable to reach the server. Check your connection and try again.';
  } else if (status >= 500) {
    fallbackMessage = 'The server could not complete the request. Please try again later.';
  } else if (status && STATUS_MESSAGES[status]) {
    fallbackMessage = STATUS_MESSAGES[status];
  } else if (error?.message) {
    fallbackMessage = error.message;
  }

  return new ApiError(getPayloadMessage(payload) || fallbackMessage, {
    status,
    code: payload?.code ?? error?.code ?? null,
    details: payload?.errors ?? payload?.details ?? null,
    isNetworkError,
    isTimeout,
  });
}
