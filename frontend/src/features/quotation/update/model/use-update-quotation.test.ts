/**
 * useUpdateQuotation Hook Tests.
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

import { useUpdateQuotation } from './use-update-quotation';

function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function mockError(method: keyof typeof httpClient, error: Error) {
  (httpClient[method] as Mock).mockRejectedValue(error);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

describe('useUpdateQuotation', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useUpdateQuotation(), {
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
    it('should call updateQuotation command on mutate', async () => {
      mockSuccess('put', createCommandResult(1, 'Updated'));

      const { result } = renderHook(() => useUpdateQuotation(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          id: 1,
          input: {
            lineItems: [{ productId: 1, quantity: 20, unitPrice: 2000 }],
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.put).toHaveBeenCalled();
    });

    it('should return command result on success', async () => {
      const commandResult = createCommandResult(1, 'Quotation updated');
      mockSuccess('put', commandResult);

      const { result } = renderHook(() => useUpdateQuotation(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          id: 1,
          input: {
            lineItems: [{ productId: 1, quantity: 20, unitPrice: 2000 }],
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(commandResult);
    });

    it('should set isError true on failure', async () => {
      mockError('put', new Error('Update failed'));

      const { result } = renderHook(() => useUpdateQuotation(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          id: 1,
          input: {
            lineItems: [{ productId: 1, quantity: 20, unitPrice: 2000 }],
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Update failed');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate detail and list queries on success', async () => {
      mockSuccess('put', createCommandResult(1));
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateQuotation(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({
          id: 1,
          input: {
            lineItems: [{ productId: 1, quantity: 20, unitPrice: 2000 }],
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['quotations', 'detail'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['quotations', 'list'] })
      );
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback with result', async () => {
      const commandResult = createCommandResult(1, 'Updated');
      mockSuccess('put', commandResult);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useUpdateQuotation({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          id: 1,
          input: {
            lineItems: [{ productId: 1, quantity: 20, unitPrice: 2000 }],
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalledWith(commandResult);
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Update failed');
      mockError('put', error);
      const onError = vi.fn();

      const { result } = renderHook(() => useUpdateQuotation({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          id: 1,
          input: {
            lineItems: [{ productId: 1, quantity: 20, unitPrice: 2000 }],
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
