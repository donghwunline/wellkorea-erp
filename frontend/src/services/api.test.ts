/**
 * Tests for API client and interceptors
 */

import {describe, it, expect, beforeEach, vi} from 'vitest';
import type {InternalAxiosRequestConfig, AxiosError, AxiosInstance} from 'axios';
import {AxiosHeaders} from 'axios';

// Mock dependencies before importing api module
vi.mock('@/utils/storage', () => ({
  authStorage: {
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

vi.mock('@/utils/navigation', () => ({
  navigation: {
    redirectToLogin: vi.fn(),
  },
}));

// Import mocked modules
const {authStorage} = await import('@/utils/storage');
const {navigation} = await import('@/utils/navigation');

// Helper to import api instance
const importApi = async () => (await import('./api')).default;

// Type definitions for interceptor handlers
interface InterceptorHandler {
  fulfilled?: (value: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
  rejected?: (error: unknown) => unknown;
}

interface ResponseInterceptorHandler {
  fulfilled?: (value: unknown) => unknown;
  rejected?: (error: unknown) => unknown;
}

// Helper to extract request interceptor from api instance
const getRequestInterceptor = (api: AxiosInstance): InterceptorHandler => {
  const handlers = (api.interceptors.request as unknown as {handlers: InterceptorHandler[]}).handlers;
  const handler = handlers[handlers.length - 1];
  expect(handler).toBeTruthy();
  return handler;
};

// Helper to extract response interceptor from api instance
const getResponseInterceptor = (api: AxiosInstance): ResponseInterceptorHandler => {
  const handlers = (api.interceptors.response as unknown as {handlers: ResponseInterceptorHandler[]}).handlers;
  const handler = handlers[handlers.length - 1];
  expect(handler).toBeTruthy();
  return handler;
};

// Helper to create mock Axios config object
const createMockConfig = (overrides?: Partial<InternalAxiosRequestConfig>): InternalAxiosRequestConfig => {
  return {
    headers: new AxiosHeaders(),
    ...overrides,
  } as InternalAxiosRequestConfig;
};

// Helper to create mock AxiosError object
const createMockAxiosError = (
  status: number,
  config?: Partial<InternalAxiosRequestConfig> & {_retry?: boolean}
): AxiosError => {
  const finalConfig = {
    headers: new AxiosHeaders(),
    ...config,
  };

  return {
    response: {status},
    config: finalConfig as InternalAxiosRequestConfig,
    isAxiosError: true,
    toJSON: () => ({}),
    name: 'AxiosError',
    message: `Request failed with status code ${status}`,
  } as AxiosError;
};

describe('API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('configuration', () => {
    it('should be configured with correct base URL and timeout', async () => {
      const api = await importApi();

      expect(api.defaults.baseURL).toBeDefined();
      expect(api.defaults.timeout).toBe(30000);
    });

    it('should have JSON Content-Type as default header', async () => {
      const api = await importApi();

      // axios 버전에 따라 위치가 다를 수 있음
      const headers = api.defaults.headers as Record<string, unknown>;
      const contentType = headers['Content-Type'] ?? (headers.common as Record<string, unknown>)?.['Content-Type'];

      expect(contentType).toBe('application/json');
    });
  });

  describe('request interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue('test-token');

      const api = await importApi();
      const requestInterceptor = getRequestInterceptor(api);
      const config = createMockConfig();

      const result = await requestInterceptor.fulfilled!(config);

      expect(result.headers?.Authorization).toBe('Bearer test-token');
    });

    it('should not add Authorization header when token is null', async () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue(null);

      const api = await importApi();
      const requestInterceptor = getRequestInterceptor(api);
      const config = createMockConfig();

      const result = await requestInterceptor.fulfilled!(config);

      expect(result.headers?.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor - non-401 errors', () => {
    it('should pass through non-401 errors', async () => {
      const api = await importApi();
      const responseInterceptor = getResponseInterceptor(api);
      const error = createMockAxiosError(500);

      await expect(responseInterceptor.rejected!(error)).rejects.toBe(error);
    });
  });

  describe('response interceptor - 401 & retry flag', () => {
    it('should not retry if _retry is already true (just rethrow)', async () => {
      const api = await importApi();
      const responseInterceptor = getResponseInterceptor(api);
      const error = createMockAxiosError(401, {_retry: true});

      await expect(responseInterceptor.rejected!(error)).rejects.toBe(error);

      expect(authStorage.clearAuth).not.toHaveBeenCalled();
      expect(navigation.redirectToLogin).not.toHaveBeenCalled();
    });
  });

  describe('token refresh flow (current stub implementation)', () => {
    it('should clear auth and redirect to login when refresh fails', async () => {
      const api = await importApi();
      const responseInterceptor = getResponseInterceptor(api);
      const error = createMockAxiosError(401);

      // refreshAccessToken currently always throws, so expect that error
      // clearAuth and redirectToLogin should be called before the error is re-thrown
      await expect(responseInterceptor.rejected!(error)).rejects.toThrow(
        'Refresh token API is not implemented yet',
      );

      expect(authStorage.clearAuth).toHaveBeenCalledTimes(1);
      expect(navigation.redirectToLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration', () => {
    it('should export a configured axios instance', async () => {
      const api = await importApi();

      expect(api).toBeDefined();
      expect(typeof api.get).toBe('function');
      expect(typeof api.post).toBe('function');
      expect(typeof api.put).toBe('function');
      expect(typeof api.delete).toBe('function');
    });
  });
});
