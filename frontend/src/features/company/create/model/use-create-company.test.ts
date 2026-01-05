/**
 * useCreateCompany Hook Tests.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  createQueryWrapper,
  createTestQueryClient,
  createCommandResult,
} from '@/test/entity-test-utils';

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

import { useCreateCompany } from './use-create-company';

function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function mockError(method: keyof typeof httpClient, error: Error) {
  (httpClient[method] as Mock).mockRejectedValue(error);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

describe('useCreateCompany', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useCreateCompany(), {
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
    it('should call createCompany command on mutate', async () => {
      mockSuccess('post', createCommandResult(1, 'Created'));

      const { result } = renderHook(() => useCreateCompany(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          name: 'Test Company',
          roles: ['CUSTOMER'],
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.post).toHaveBeenCalled();
    });

    it('should return command result on success', async () => {
      const commandResult = createCommandResult(1, 'Company created');
      mockSuccess('post', commandResult);

      const { result } = renderHook(() => useCreateCompany(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          name: 'Test Company',
          roles: ['CUSTOMER'],
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(commandResult);
    });

    it('should set isError true on failure', async () => {
      mockError('post', new Error('Create failed'));

      const { result } = renderHook(() => useCreateCompany(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          name: 'Test Company',
          roles: ['CUSTOMER'],
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Create failed');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate list queries on success', async () => {
      mockSuccess('post', createCommandResult(1));
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateCompany(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({
          name: 'Test Company',
          roles: ['CUSTOMER'],
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['companies', 'list'] })
      );
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback with result', async () => {
      const commandResult = createCommandResult(1, 'Created');
      mockSuccess('post', commandResult);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useCreateCompany({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          name: 'Test Company',
          roles: ['CUSTOMER'],
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalledWith(commandResult);
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Create failed');
      mockError('post', error);
      const onError = vi.fn();

      const { result } = renderHook(() => useCreateCompany({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          name: 'Test Company',
          roles: ['CUSTOMER'],
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
