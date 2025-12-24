/**
 * HTTP client with automatic token management and refresh logic.
 *
 * Features:
 * - Automatic JWT token injection
 * - Token refresh with queue (prevents race conditions)
 * - Separate refresh client (avoids interceptor loops)
 * - ApiResponse<T> unwrapping
 * - Error normalization
 */

import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { ApiError } from './types';
import type { ApiResponse, Tokens, TokenStore } from './types';
import { AUTH_ENDPOINTS } from './endpoints';

/**
 * Pending request during token refresh.
 */
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

/**
 * Normalize Axios error to ApiError class instance.
 */
function normalizeAxiosError(err: unknown): ApiError {
  const axiosError = err as AxiosError<{ errorCode?: string; message?: string }>;
  const status = axiosError.response?.status ?? 0;
  const data = axiosError.response?.data;

  return new ApiError(
    status,
    data?.message ?? axiosError.message ?? 'Request failed',
    data?.errorCode,
    data ?? axiosError.toJSON?.()
  );
}

/**
 * HttpClient class for making HTTP requests with automatic token management.
 */
export class HttpClient {
  private readonly client: AxiosInstance;
  private readonly refreshClient: AxiosInstance;
  private readonly tokenStore: TokenStore;
  private readonly onUnauthorized?: () => void;
  private isRefreshing = false;
  private pendingQueue: PendingRequest[] = [];

  constructor(baseURL: string, tokenStore: TokenStore, onUnauthorized?: () => void) {
    this.tokenStore = tokenStore;
    this.onUnauthorized = onUnauthorized;

    // Main client with interceptors
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Separate refresh client WITHOUT interceptors (avoids infinite loops)
    this.refreshClient = axios.create({
      baseURL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors.
   */
  private setupInterceptors(): void {
    // Request interceptor: inject access token
    this.client.interceptors.request.use(config => {
      const tokens = this.tokenStore.getTokens();
      if (tokens?.accessToken) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      return config;
    });

    // Response interceptor: handle 401 and refresh
    this.client.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const apiError = normalizeAxiosError(error);
        const originalRequest = error.config as
          | (AxiosRequestConfig & { _retry?: boolean })
          | undefined;

        const is401 = apiError.status === 401;

        // Cannot retry if not 401
        if (!originalRequest || !is401) {
          throw apiError;
        }

        // Only refresh token if it's expired (AUTH_003), not for authentication failures (AUTH_001)
        // or invalid tokens (AUTH_002). This prevents refresh attempts on login failures.
        const shouldRefreshToken = apiError.errorCode === 'AUTH_003';

        if (!shouldRefreshToken) {
          throw apiError;
        }

        // Prevent infinite retry loop
        if (originalRequest._retry) {
          throw apiError;
        }
        originalRequest._retry = true;

        // Get current tokens
        const tokens = this.tokenStore.getTokens();
        if (!tokens?.accessToken) {
          this.tokenStore.clear();
          this.onUnauthorized?.();
          throw apiError;
        }

        // Queue requests if refresh is in progress
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.pendingQueue.push({ resolve, reject });
          }).then(() => this.client.request(originalRequest));
        }

        // Start refresh
        this.isRefreshing = true;

        try {
          const newTokens = await this.refreshToken(tokens.accessToken);
          this.tokenStore.setTokens(newTokens);

          // Flush queue (success) - resolve with undefined so .then() chain continues
          this.pendingQueue.forEach(p => p.resolve(undefined));
          this.pendingQueue = [];

          return this.client.request(originalRequest);
        } catch (refreshError) {
          const normalized = normalizeAxiosError(refreshError);
          this.tokenStore.clear();
          this.onUnauthorized?.();

          // Flush queue (failure)
          this.pendingQueue.forEach(p => p.reject(normalized));
          this.pendingQueue = [];

          throw normalized;
        } finally {
          this.isRefreshing = false;
        }
      }
    );
  }

  /**
   * Refresh access token using refresh client.
   * Backend expects: Authorization header with current access token.
   */
  private async refreshToken(currentAccessToken: string): Promise<Tokens> {
    const response = await this.refreshClient.post<
      ApiResponse<{
        accessToken: string;
        refreshToken: string | null;
      }>
    >(
      AUTH_ENDPOINTS.REFRESH,
      undefined, // No body
      {
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      }
    );

    const { accessToken, refreshToken } = response.data.data;

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Make HTTP request and unwrap ApiResponse<T>.data
   */
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<ApiResponse<T>>(config);
    return response.data.data;
  }

  /**
   * Make HTTP request and return full ApiResponse<T> (with metadata)
   */
  async requestWithMeta<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.request<ApiResponse<T>>(config);
    return response.data;
  }

  /**
   * Make HTTP request and return raw response data without ApiResponse unwrapping.
   * Use for binary responses (PDF, images) or non-standard API endpoints.
   */
  async requestRaw<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  /**
   * Convenience method: GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  /**
   * Convenience method: POST request
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  /**
   * Convenience method: PUT request
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  /**
   * Convenience method: PATCH request
   */
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data, ...config });
  }

  /**
   * Convenience method: DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }
}
