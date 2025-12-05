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
import {authStorage} from '@/utils/storage';
import {navigation} from '@/utils/navigation';
import {enhanceError} from '@/utils/errorMessages';
import type {ErrorResponse} from '@/types/api';

// Base URL from environment variable or default to localhost
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Enhanced AxiosError with user-friendly error information.
 * Extends standard AxiosError with additional fields for display strategy.
 */
export interface EnhancedAxiosError extends AxiosError<ErrorResponse> {
  errorCode?: string;
  userMessage?: string;
  displayStrategy?: 'inline' | 'toast' | 'banner' | 'modal';
}

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
 * Request interceptor: Inject JWT token from storage.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getAccessToken();
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
  // Example:
  // const refreshToken = authStorage.getRefreshToken();
  // const res = await axios.post<LoginResponse>(`${BASE_URL}/auth/refresh`, { refreshToken });
  // const { accessToken } = res.data;
  // authStorage.setAccessToken(accessToken);
  // return accessToken;
  throw new Error('Refresh token API is not implemented yet');
};

/**
 * Response interceptor: Handle errors and token refresh.
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: EnhancedAxiosError) => {
    // Enhance error with user-friendly information
    if (error.response?.data) {
      const errorData = error.response.data;
      const enhanced = enhanceError(errorData);

      // Attach enhanced error information to the error object for components to use
      error.errorCode = enhanced.errorCode;
      error.userMessage = enhanced.userMessage;
      error.displayStrategy = enhanced.displayStrategy;

      // Log for debugging (with both user message and original backend message)
      console.error(
        `[${errorData.errorCode}] ${enhanced.userMessage}`,
        {
          backendMessage: errorData.message,
          path: errorData.path,
          timestamp: errorData.timestamp,
          status: errorData.status,
        }
      );
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 Unauthorized (token expired)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Check isRefreshing flag first to prevent race condition
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

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        authStorage.setAccessToken(newToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authStorage.clearAuth();
        navigation.redirectToLogin();
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
