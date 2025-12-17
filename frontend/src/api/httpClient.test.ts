/**
 * Unit tests for HttpClient.
 * Tests token injection, AUTH_003 refresh logic, request queuing, and error normalization.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import axios, { AxiosError } from 'axios';
import { HttpClient } from './httpClient';
import type { ApiError, ApiResponse, TokenStore, Tokens } from './types';

// Mock axios
vi.mock('axios');

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let mockTokenStore: TokenStore;
  let onUnauthorized: Mock;
  let mockAxiosInstance: {
    request: Mock;
    interceptors: {
      request: { use: Mock };
      response: { use: Mock };
    };
  };
  let mockRefreshAxiosInstance: {
    post: Mock;
  };
  let requestInterceptor: (config: any) => any;
  let responseInterceptorSuccess: (response: any) => any;
  let responseInterceptorError: (error: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Axios instances
    mockAxiosInstance = {
      request: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(fn => {
            requestInterceptor = fn;
          }),
        },
        response: {
          use: vi.fn((success, error) => {
            responseInterceptorSuccess = success;
            responseInterceptorError = error;
          }),
        },
      },
    };

    mockRefreshAxiosInstance = {
      post: vi.fn(),
    };

    // Mock axios.create to return different instances
    let createCallCount = 0;
    vi.mocked(axios.create).mockImplementation(() => {
      createCallCount++;
      if (createCallCount === 1) {
        return mockAxiosInstance as any;
      }
      return mockRefreshAxiosInstance as any;
    });

    // Create mock token store
    mockTokenStore = {
      getTokens: vi.fn(),
      setTokens: vi.fn(),
      clear: vi.fn(),
    };

    onUnauthorized = vi.fn();

    // Initialize HttpClient
    httpClient = new HttpClient('http://api.example.com', mockTokenStore, onUnauthorized);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor and initialization', () => {
    it('should create axios instances with correct config', () => {
      expect(axios.create).toHaveBeenCalledTimes(2);

      // Main client
      expect(axios.create).toHaveBeenNthCalledWith(1, {
        baseURL: 'http://api.example.com',
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      });

      // Refresh client
      expect(axios.create).toHaveBeenNthCalledWith(2, {
        baseURL: 'http://api.example.com',
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should setup request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledOnce();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledOnce();
    });
  });

  describe('request interceptor - token injection', () => {
    it('should inject Authorization header when tokens exist', () => {
      // Given: Tokens exist
      const tokens: Tokens = {
        accessToken: 'test-token-123',
        refreshToken: null,
      };
      vi.mocked(mockTokenStore.getTokens).mockReturnValue(tokens);

      const config = {
        url: '/api/users',
        method: 'GET',
      };

      // When: Request interceptor runs
      const result = requestInterceptor(config);

      // Then: Authorization header added
      expect(result.headers.Authorization).toBe('Bearer test-token-123');
      expect(mockTokenStore.getTokens).toHaveBeenCalledOnce();
    });

    it('should not inject Authorization header when tokens are null', () => {
      // Given: No tokens
      vi.mocked(mockTokenStore.getTokens).mockReturnValue(null);

      const config = {
        url: '/api/users',
        method: 'GET',
      };

      // When: Request interceptor runs
      const result = requestInterceptor(config);

      // Then: No Authorization header
      expect(result.headers?.Authorization).toBeUndefined();
    });

    it('should not overwrite existing headers', () => {
      // Given: Tokens exist and config has other headers
      vi.mocked(mockTokenStore.getTokens).mockReturnValue({
        accessToken: 'token',
        refreshToken: null,
      });

      const config = {
        url: '/api/users',
        method: 'GET',
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      };

      // When: Request interceptor runs
      const result = requestInterceptor(config);

      // Then: Both headers exist
      expect(result.headers.Authorization).toBe('Bearer token');
      expect(result.headers['X-Custom-Header']).toBe('custom-value');
    });
  });

  describe('response interceptor - success', () => {
    it('should pass through successful responses unchanged', () => {
      // Given: Successful response
      const response = {
        status: 200,
        data: {
          success: true,
          data: { id: 1, name: 'Test' },
        },
      };

      // When: Success interceptor runs
      const result = responseInterceptorSuccess(response);

      // Then: Response unchanged
      expect(result).toBe(response);
    });
  });

  describe('response interceptor - error handling (non-401)', () => {
    it('should reject non-401 errors without refresh attempt', async () => {
      // Given: 404 error
      const axiosError = {
        response: {
          status: 404,
          data: {
            errorCode: 'RES_001',
            message: 'Resource not found',
          },
        },
        config: { url: '/api/users/999', method: 'GET' },
      } as AxiosError;

      // When: Error interceptor runs
      await expect(responseInterceptorError(axiosError)).rejects.toEqual({
        status: 404,
        errorCode: 'RES_001',
        message: 'Resource not found',
        details: { errorCode: 'RES_001', message: 'Resource not found' },
      });

      // Then: No refresh attempted
      expect(mockRefreshAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should reject network errors', async () => {
      // Given: Network error (no response)
      const axiosError = {
        message: 'Network Error',
        config: { url: '/api/users', method: 'GET' },
        toJSON: () => ({ message: 'Network Error', name: 'Error', code: 'ERR_NETWORK' }),
      } as AxiosError;

      // When: Error interceptor runs
      await expect(responseInterceptorError(axiosError)).rejects.toEqual({
        status: 0,
        errorCode: undefined,
        message: 'Network Error',
        details: expect.objectContaining({ message: 'Network Error' }),
      });
    });
  });

  describe('response interceptor - AUTH_003 token refresh', () => {
    it('should refresh token and retry request on AUTH_003 error', async () => {
      // Given: AUTH_003 error (expired token)
      const axiosError = {
        response: {
          status: 401,
          data: {
            errorCode: 'AUTH_003',
            message: 'Token has expired',
          },
        },
        config: { url: '/api/users', method: 'GET' },
      } as AxiosError;

      // Current token
      vi.mocked(mockTokenStore.getTokens).mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
      });

      // Refresh returns new tokens
      const refreshResponse = {
        data: {
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      };
      vi.mocked(mockRefreshAxiosInstance.post).mockResolvedValue(refreshResponse);

      // Retry succeeds
      const retryResponse = {
        data: {
          success: true,
          data: [{ id: 1, name: 'User 1' }],
        },
      };
      vi.mocked(mockAxiosInstance.request).mockResolvedValue(retryResponse);

      // When: Error interceptor runs
      const result = await responseInterceptorError(axiosError);

      // Then: Refresh called with current token
      expect(mockRefreshAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh', undefined, {
        headers: {
          Authorization: 'Bearer expired-token',
        },
      });

      // And: New tokens stored
      expect(mockTokenStore.setTokens).toHaveBeenCalledWith({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // And: Original request retried with _retry flag
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        url: '/api/users',
        method: 'GET',
        _retry: true,
      });

      // And: Returns retry response
      expect(result).toEqual(retryResponse);
    });

    it('should clear tokens and call onUnauthorized when refresh fails', async () => {
      // Given: AUTH_003 error
      const axiosError = {
        response: {
          status: 401,
          data: {
            errorCode: 'AUTH_003',
            message: 'Token has expired',
          },
        },
        config: { url: '/api/users', method: 'GET' },
      } as AxiosError;

      vi.mocked(mockTokenStore.getTokens).mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: null,
      });

      // Refresh fails
      const refreshError = {
        response: {
          status: 401,
          data: {
            errorCode: 'AUTH_002',
            message: 'Invalid token',
          },
        },
      } as AxiosError;
      vi.mocked(mockRefreshAxiosInstance.post).mockRejectedValue(refreshError);

      // When: Error interceptor runs
      await expect(responseInterceptorError(axiosError)).rejects.toEqual({
        status: 401,
        errorCode: 'AUTH_002',
        message: 'Invalid token',
        details: { errorCode: 'AUTH_002', message: 'Invalid token' },
      });

      // Then: Tokens cleared
      expect(mockTokenStore.clear).toHaveBeenCalledOnce();

      // And: onUnauthorized callback called
      expect(onUnauthorized).toHaveBeenCalledOnce();

      // And: Original request NOT retried
      expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    });
  });

  describe('response interceptor - AUTH_001/AUTH_002 (no refresh)', () => {
    it('should NOT refresh token on AUTH_001 (invalid credentials)', async () => {
      // Given: AUTH_001 error
      const axiosError = {
        response: {
          status: 401,
          data: {
            errorCode: 'AUTH_001',
            message: 'Invalid credentials',
          },
        },
        config: { url: '/auth/login', method: 'POST' },
      } as AxiosError;

      // When: Error interceptor runs
      await expect(responseInterceptorError(axiosError)).rejects.toEqual({
        status: 401,
        errorCode: 'AUTH_001',
        message: 'Invalid credentials',
        details: { errorCode: 'AUTH_001', message: 'Invalid credentials' },
      });

      // Then: No refresh attempted
      expect(mockRefreshAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should NOT refresh token on AUTH_002 (invalid token)', async () => {
      // Given: AUTH_002 error
      const axiosError = {
        response: {
          status: 401,
          data: {
            errorCode: 'AUTH_002',
            message: 'Invalid token',
          },
        },
        config: { url: '/api/users', method: 'GET' },
      } as AxiosError;

      // When: Error interceptor runs
      await expect(responseInterceptorError(axiosError)).rejects.toEqual({
        status: 401,
        errorCode: 'AUTH_002',
        message: 'Invalid token',
        details: { errorCode: 'AUTH_002', message: 'Invalid token' },
      });

      // Then: No refresh attempted
      expect(mockRefreshAxiosInstance.post).not.toHaveBeenCalled();
    });
  });

  describe('request queuing during refresh', () => {
    it('should queue concurrent requests during token refresh', async () => {
      // Given: First request triggers refresh (AUTH_003)
      const firstError = {
        response: {
          status: 401,
          data: {
            errorCode: 'AUTH_003',
            message: 'Token has expired',
          },
        },
        config: { url: '/api/users', method: 'GET' },
      } as AxiosError;

      vi.mocked(mockTokenStore.getTokens).mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: null,
      });

      // Refresh takes time (simulate async delay)
      const refreshResponse = {
        data: {
          data: {
            accessToken: 'new-token',
            refreshToken: null,
          },
        },
      };
      vi.mocked(mockRefreshAxiosInstance.post).mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(refreshResponse), 50);
          })
      );

      const retryResponse = {
        data: {
          success: true,
          data: { result: 'success' },
        },
      };
      vi.mocked(mockAxiosInstance.request).mockResolvedValue(retryResponse);

      // When: First request starts refresh
      const firstPromise = responseInterceptorError(firstError);

      // And: Second request comes in during refresh (simulated by immediately calling error interceptor again)
      const secondError = {
        response: {
          status: 401,
          data: {
            errorCode: 'AUTH_003',
            message: 'Token has expired',
          },
        },
        config: { url: '/api/projects', method: 'GET' },
      } as AxiosError;

      // Second request should be queued (refresh already in progress)
      const secondPromise = responseInterceptorError(secondError);

      // Wait for both
      const [firstResult, secondResult] = await Promise.all([firstPromise, secondPromise]);

      // Then: Refresh called only once
      expect(mockRefreshAxiosInstance.post).toHaveBeenCalledOnce();

      // And: Both requests eventually succeed
      expect(firstResult).toEqual(retryResponse);
      expect(secondResult).toEqual(retryResponse);

      // And: Original requests retried
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
    });
  });

  describe('convenience methods', () => {
    it('should unwrap ApiResponse<T>.data in get()', async () => {
      // Given: Mock response with ApiResponse wrapper
      const mockResponse = {
        data: {
          success: true,
          message: 'Success',
          data: { id: 1, name: 'User' },
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValue(mockResponse);

      // When: Call get()
      const result = await httpClient.get<{ id: number; name: string }>('/users/1');

      // Then: Returns unwrapped data
      expect(result).toEqual({ id: 1, name: 'User' });
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users/1',
      });
    });

    it('should pass data to post()', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 2, name: 'New User' },
        },
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValue(mockResponse);

      const postData = { name: 'New User', email: 'new@example.com' };
      const result = await httpClient.post('/users', postData);

      expect(result).toEqual({ id: 2, name: 'New User' });
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/users',
        data: postData,
      });
    });

    it('should call correct HTTP methods', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: null,
        },
      };

      vi.mocked(mockAxiosInstance.request).mockResolvedValue(mockResponse);

      await httpClient.put('/users/1', { name: 'Updated' });
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/users/1',
        data: { name: 'Updated' },
      });

      await httpClient.patch('/users/1', { email: 'new@example.com' });
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/users/1',
        data: { email: 'new@example.com' },
      });

      await httpClient.delete('/users/1');
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/users/1',
      });
    });
  });
});
