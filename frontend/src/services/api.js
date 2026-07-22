import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL;

if (!rawBaseURL) {
  console.error(
    'VITE_API_URL is not set. Check frontend/.env.local — Vite only reads VITE_-prefixed variables.'
  );
}

// The dev CORS proxy (bin/proxy-server.js) routes on /api/{service-name},
// not just /api/{route} — confirmed directly from its own source, and
// matching the identical convention full-stack.md's own curl examples use
// for BOTH local and cloud testing. Our own app then mounts every route
// under its own /api prefix on top of that, so the full path ends up
// /api/python-service/api/... — verified against the working direct-
// Lambda test earlier tonight.
const baseURL = rawBaseURL ? `${rawBaseURL}/api/python-service` : rawBaseURL;

const STORAGE_KEY = 'auth';

export function getStoredAuth() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setStoredAuth(auth) {
  if (auth) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

const api = axios.create({ baseURL });

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.access_token) {
    config.headers.Authorization = `Bearer ${auth.access_token}`;
  }
  return config;
});

// On a 401, attempt exactly one refresh, then retry the original request.
// The backend rotates refresh tokens on every use (old one revoked, new
// one issued) — so concurrent requests that all 401 at once must share a
// single in-flight refresh call, not each fire their own, or all but the
// first would be refreshing against an already-rotated token and fail.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const auth = getStoredAuth();
    if (!auth?.refresh_token) {
      setStoredAuth(null);
      window.location.href = '/login';
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${baseURL}/api/auth/refresh`, { refresh_token: auth.refresh_token })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const { data } = await refreshPromise;
      setStoredAuth({ ...auth, access_token: data.access_token, refresh_token: data.refresh_token });
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      setStoredAuth(null);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export default api;