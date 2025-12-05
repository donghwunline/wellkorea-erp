/**
 * API client with JWT token interceptor for backend communication.
 *
 * Features:
 * - Automatic JWT token injection in Authorization header
 * - Request/response interceptors for error handling
 * - Token refresh with queue to prevent race conditions
 * - SSR/test environment safe (checks for browser)
 * - Base URL configuration from environment
 *
 * Usage:
 * ```typescript
 * import api from '@/services/api';
 *
 * // GET request
 * const response = await api.get('/projects');
 *
 * // POST request
 * const response = await api.post('/projects', { name: 'Project 1' });
 * ```
 */

import type {AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import axios from 'axios';

// Base URL from environment variable or default to localhost
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// SSR / test environment consideration
const isBrowser = typeof globalThis !== 'undefined';

const getAccessToken = () => (isBrowser ? localStorage.getItem('accessToken') : null);

const setAccessToken = (token: string | null) => {
  if (!isBrowser) return;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

const clearAuth = () => {
  if (!isBrowser) return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken'); // for future use
  localStorage.removeItem('user');
};

const redirectToLogin = () => {
  if (!isBrowser) return;
  globalThis.location.href = '/login';
};

/**
 * Axios instance configured for backend API communication.
 */
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Request interceptor: Inject JWT token from localStorage.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Token refresh handling with queue to prevent race conditions
 */
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAccessToken = async (): Promise<string> => {
  // TODO: Replace with actual refresh API when implemented
  // Example: const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  throw new Error('Refresh token API is not implemented yet');
};

/**
 * Response interceptor: Handle errors and token refresh.
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 Unauthorized (token expired)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // If refresh is already in progress, queue the request and retry after refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: unknown) => {
              if (typeof token === 'string') {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
              }
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        setAccessToken(newToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        redirectToLogin();
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    // Other errors pass through
    throw error;
  }
);

export default api;
