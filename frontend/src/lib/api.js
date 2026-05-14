import axios from 'axios';
import { API_URL } from './constants';

function readPersistedAuth() {
  const stored = localStorage.getItem('auth-storage');
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    return parsed?.state || null;
  } catch {
    return null;
  }
}

function isJwtExpired(token) {
  if (!token || typeof token !== 'string') return true;

  const parts = token.split('.');
  if (parts.length !== 3) return true;

  try {
    // JWT payload is Base64URL encoded, not plain Base64.
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded));
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Axios instance with base URL and JWT interceptor
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    // Read token from localStorage (Zustand persist)
    const state = readPersistedAuth();
    if (state?.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Lazy reference to auth store to avoid circular imports
let _authStore = null;
export function setAuthStore(store) {
  _authStore = store;
}

// Response interceptor — handle 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state via Zustand store (which also clears localStorage via persist)
      if (_authStore) {
        _authStore.getState().logout();
      } else {
        localStorage.removeItem('auth-storage');
      }

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
