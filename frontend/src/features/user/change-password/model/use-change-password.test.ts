/**
 * useChangePassword Hook Tests.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createQueryWrapper } from '@/test/entity-test-utils';

const httpClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api');
  return { ...actual, httpClient };
});

import { useChangePassword } from './use-change-password';

function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function mockError(method: keyof typeof httpClient, error: Error) {
  (httpClient[method] as Mock).mockRejectedValue(error);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

const createChangePasswordInput = () => ({
  id: 1,
  data: {
    newPassword: 'newSecurePassword123',
  },
});

describe('useChangePassword', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
    });
  });

  describe('mutation execution', () => {
    it('should call changePassword command on mutate', async () => {
      mockSuccess('put', undefined);

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createChangePasswordInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.put).toHaveBeenCalled();
    });

    it('should set isError true on failure', async () => {
      mockError('put', new Error('Password change failed'));

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createChangePasswordInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Password change failed');
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback on success', async () => {
      mockSuccess('put', undefined);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useChangePassword({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createChangePasswordInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Password change failed');
      mockError('put', error);
      const onError = vi.fn();

      const { result } = renderHook(() => useChangePassword({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createChangePasswordInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
