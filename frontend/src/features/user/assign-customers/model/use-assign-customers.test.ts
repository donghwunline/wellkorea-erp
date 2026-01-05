/**
 * useAssignCustomers Hook Tests.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  createQueryWrapper,
  createTestQueryClient,
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

import { useAssignCustomers } from './use-assign-customers';

function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function mockError(method: keyof typeof httpClient, error: Error) {
  (httpClient[method] as Mock).mockRejectedValue(error);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

const createAssignCustomersInput = () => ({
  id: 1,
  data: {
    customerIds: [1, 2, 3],
  },
});

describe('useAssignCustomers', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useAssignCustomers(), {
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
    it('should call assignCustomers command on mutate', async () => {
      mockSuccess('put', undefined);

      const { result } = renderHook(() => useAssignCustomers(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createAssignCustomersInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.put).toHaveBeenCalled();
    });

    it('should set isError true on failure', async () => {
      mockError('put', new Error('Assign customers failed'));

      const { result } = renderHook(() => useAssignCustomers(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createAssignCustomersInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Assign customers failed');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate customer queries on success', async () => {
      mockSuccess('put', undefined);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useAssignCustomers(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate(createAssignCustomersInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['users', 'customers'] })
      );
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback on success', async () => {
      mockSuccess('put', undefined);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useAssignCustomers({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createAssignCustomersInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Assign customers failed');
      mockError('put', error);
      const onError = vi.fn();

      const { result } = renderHook(() => useAssignCustomers({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createAssignCustomersInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
