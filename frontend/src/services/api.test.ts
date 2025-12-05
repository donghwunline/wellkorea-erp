/**
 * Tests for API client and interceptors
 */

import {describe, it, expect, beforeEach, vi} from 'vitest';
import type {InternalAxiosRequestConfig, AxiosError} from 'axios';

// 1) api.ts가 import 하는 경로 그대로 mock
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

// 2) mock 이후에 import
const {authStorage} = await import('@/utils/storage');
const {navigation} = await import('@/utils/navigation');

// 3) api 인스턴스를 가져오는 헬퍼 (중복 방지)
const importApi = async () => (await import('./api')).default;

// 4) 인터셉터 핸들러를 안전하게 꺼내는 헬퍼
const getRequestInterceptor = (api: any) => {
  const handlers = api.interceptors.request.handlers;
  const handler = handlers[handlers.length - 1]; // 현재는 하나지만, 나중 확장 대비
  expect(handler).toBeTruthy();
  return handler;
};

const getResponseInterceptor = (api: any) => {
  const handlers = api.interceptors.response.handlers;
  const handler = handlers[handlers.length - 1];
  expect(handler).toBeTruthy();
  return handler;
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
      const headers = api.defaults.headers as any;
      const contentType = headers['Content-Type'] ?? headers.common?.['Content-Type'];

      expect(contentType).toBe('application/json');
    });
  });

  describe('request interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue('test-token');

      const api = await importApi();
      const requestInterceptor = getRequestInterceptor(api);

      if (requestInterceptor.fulfilled) {
        const config: InternalAxiosRequestConfig = {
          headers: {} as any,
        } as InternalAxiosRequestConfig;

        const result = await requestInterceptor.fulfilled(config);

        expect(result.headers?.Authorization).toBe('Bearer test-token');
      }
    });

    it('should not add Authorization header when token is null', async () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue(null);

      const api = await importApi();
      const requestInterceptor = getRequestInterceptor(api);

      if (requestInterceptor.fulfilled) {
        const config: InternalAxiosRequestConfig = {
          headers: {} as any,
        } as InternalAxiosRequestConfig;

        const result = await requestInterceptor.fulfilled(config);

        expect(result.headers?.Authorization).toBeUndefined();
      }
    });
  });

  describe('response interceptor - non-401 errors', () => {
    it('should pass through non-401 errors', async () => {
      const api = await importApi();
      const responseInterceptor = getResponseInterceptor(api);

      if (responseInterceptor.rejected) {
        const error = {
          response: {status: 500},
          config: {} as InternalAxiosRequestConfig,
        } as AxiosError;

        await expect(responseInterceptor.rejected(error)).rejects.toBe(error);
      }
    });
  });

  describe('response interceptor - 401 & retry flag', () => {
    it('should not retry if _retry is already true (just rethrow)', async () => {
      const api = await importApi();
      const responseInterceptor = getResponseInterceptor(api);

      if (responseInterceptor.rejected) {
        const error = {
          response: {status: 401},
          config: {
            _retry: true,
          } as InternalAxiosRequestConfig & {_retry: boolean},
        } as AxiosError;

        await expect(responseInterceptor.rejected(error)).rejects.toBe(error);

        expect(authStorage.clearAuth).not.toHaveBeenCalled();
        expect(navigation.redirectToLogin).not.toHaveBeenCalled();
      }
    });
  });

  describe('token refresh flow (current stub implementation)', () => {
    it('should clear auth and redirect to login when refresh fails', async () => {
      const api = await importApi();
      const responseInterceptor = getResponseInterceptor(api);

      if (responseInterceptor.rejected) {
        const error = {
          response: {status: 401},
          config: {
            headers: {} as any,
          } as InternalAxiosRequestConfig,
        } as AxiosError;

        // refreshAccessToken 이 현재는 항상 throw 하기 때문에,
        // 그 에러가 그대로 위로 올라오고, 그 전에 clearAuth + redirectToLogin 이 호출되어야 한다.
        await expect(responseInterceptor.rejected(error)).rejects.toThrow(
          'Refresh token API is not implemented yet',
        );

        expect(authStorage.clearAuth).toHaveBeenCalledTimes(1);
        expect(navigation.redirectToLogin).toHaveBeenCalledTimes(1);
      }
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
