import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

/** Decode JWT payload to extract claims (email, sub, exp) */
function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/** Check if a JWT is expired */
function isTokenExpired(token) {
  const claims = decodeToken(token);
  if (!claims?.exp) return false;
  return Date.now() >= claims.exp * 1000;
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      /**
       * Initialize auth state from persisted token.
       * If token exists but user info is missing, decode JWT to recover it.
       * If token is expired, clear auth.
       */
      initAuth: () => {
        const { token, user } = get();
        if (!token) return;

        if (isTokenExpired(token)) {
          set({ token: null, user: null, error: null });
          return;
        }

        // Recover user info from JWT claims if missing
        if (!user?.email) {
          const claims = decodeToken(token);
          if (claims?.email) {
            set({ user: { email: claims.email } });
          } else {
            // Token is invalid — no email claim
            set({ token: null, user: null, error: null });
          }
        }
      },

      /** Register a new user */
      register: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', { email, password });
          set({
            token: data.token,
            user: { email: data.email },
            isLoading: false,
          });
          return data;
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      /** Login existing user */
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({
            token: data.token,
            user: { email: data.email },
            isLoading: false,
          });
          return data;
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      /** Logout and clear state */
      logout: () => {
        set({ token: null, user: null, error: null });
      },

      /** Clear error state */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

export default useAuthStore;
