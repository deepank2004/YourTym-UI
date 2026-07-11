export const USER_TOKEN_STORAGE_KEY = 'userToken';

function getLocalStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getUserToken() {
  return getLocalStorage()?.getItem(USER_TOKEN_STORAGE_KEY) || null;
}

export function setUserToken(token) {
  const normalizedToken = typeof token === 'string' ? token.trim() : '';
  const storage = getLocalStorage();

  if (!storage) return;

  if (!normalizedToken) {
    storage.removeItem(USER_TOKEN_STORAGE_KEY);
    return;
  }

  storage.setItem(USER_TOKEN_STORAGE_KEY, normalizedToken);
}

export function clearUserToken() {
  getLocalStorage()?.removeItem(USER_TOKEN_STORAGE_KEY);
}

export function clearAuthentication() {
  const storage = getLocalStorage();
  storage?.removeItem(USER_TOKEN_STORAGE_KEY);
  storage?.removeItem('userData');
  storage?.removeItem('pendingLoginSession');
  storage?.removeItem('authFlow');
  if (typeof window !== 'undefined') {
    window.sessionStorage?.removeItem('checkoutDate');
    window.sessionStorage?.removeItem('checkoutTime');
    window.sessionStorage?.removeItem('lastOrderId');
  }
}
