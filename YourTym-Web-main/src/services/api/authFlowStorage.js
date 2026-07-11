const PENDING_PHONE_KEY = 'yourtym.pendingLogin.phone';
const PENDING_LOGIN_ID_KEY = 'yourtym.pendingLogin.id';
const PENDING_MESSAGE_KEY = 'yourtym.pendingLogin.message';
const DEVICE_TOKEN_KEY = 'yourtym.deviceToken';

function getSessionStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function savePendingLogin({ phone, loginId, message }) {
  const storage = getSessionStorage();
  if (!storage) return;

  storage.setItem(PENDING_PHONE_KEY, phone);
  storage.setItem(PENDING_MESSAGE_KEY, message);

  if (loginId) {
    storage.setItem(PENDING_LOGIN_ID_KEY, String(loginId));
  } else {
    storage.removeItem(PENDING_LOGIN_ID_KEY);
  }
}

export function getPendingLogin() {
  const storage = getSessionStorage();

  return {
    phone: storage?.getItem(PENDING_PHONE_KEY) || '',
    loginId: storage?.getItem(PENDING_LOGIN_ID_KEY) || '',
    message: storage?.getItem(PENDING_MESSAGE_KEY) || '',
  };
}

export function clearPendingLogin() {
  const storage = getSessionStorage();
  if (!storage) return;

  storage.removeItem(PENDING_PHONE_KEY);
  storage.removeItem(PENDING_LOGIN_ID_KEY);
  storage.removeItem(PENDING_MESSAGE_KEY);
}

export function getDeviceToken() {
  const storage = getSessionStorage();
  if (!storage) return '';

  const existingToken = storage.getItem(DEVICE_TOKEN_KEY);
  if (existingToken) return existingToken;

  const generatedToken = globalThis.crypto?.randomUUID?.() ||
    `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  storage.setItem(DEVICE_TOKEN_KEY, generatedToken);
  return generatedToken;
}
