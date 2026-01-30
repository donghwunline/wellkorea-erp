/**
 * useSubmitVendorSelection Hook Tests.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  createQueryWrapper,
  createTestQueryClient,
  createCommandResult,
} from '@/test/entity-test-utils';
import { ApiError } from '@/shared/api';

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

import { useSubmitVendorSelection } from './use-submit-vendor-selection';

function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function mockError(method: keyof typeof httpClient, error: Error) {
  (httpClient[method] as Mock).mockRejectedValue(error);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

describe('useSubmitVendorSelection', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useSubmitVendorSelection(), {
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
    it('should call submitVendorSelectionForApproval with correct parameters', async () => {
      mockSuccess('post', createCommandResult(1, 'Submitted'));

      const { result } = renderHook(() => useSubmitVendorSelection(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ purchaseRequestId: 123, itemId: 'item-uuid' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/purchase-requests/123/rfq/item-uuid/submit-for-approval',
        {}
      );
    });

    it('should return command result on success', async () => {
      const commandResult = createCommandResult(1, 'Submitted for approval');
      mockSuccess('post', commandResult);

      const { result } = renderHook(() => useSubmitVendorSelection(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ purchaseRequestId: 123, itemId: 'item-uuid' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(commandResult);
    });

    it('should set isError true on failure', async () => {
      mockError('post', new Error('Submit failed'));

      const { result } = renderHook(() => useSubmitVendorSelection(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ purchaseRequestId: 123, itemId: 'item-uuid' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Submit failed');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate purchase request and approval queries on success', async () => {
      mockSuccess('post', createCommandResult(1));
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSubmitVendorSelection(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ purchaseRequestId: 123, itemId: 'item-uuid' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should invalidate purchase request queries
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['purchase-requests'] })
      );
      // Should invalidate approval queries
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['approvals'] })
      );
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback on success', async () => {
      mockSuccess('post', createCommandResult(1, 'Submitted'));
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useSubmitVendorSelection({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ purchaseRequestId: 123, itemId: 'item-uuid' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Submit failed');
      mockError('post', error);
      const onError = vi.fn();

      const { result } = renderHook(() => useSubmitVendorSelection({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ purchaseRequestId: 123, itemId: 'item-uuid' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('409 conflict handling', () => {
    it('should invalidate purchase request queries on 409 conflict', async () => {
      const conflictError = new ApiError(409, 'Concurrent modification', 'BUS_004');
      mockError('post', conflictError);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSubmitVendorSelection(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ purchaseRequestId: 123, itemId: 'item-uuid' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should auto-invalidate purchase request queries on 409
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['purchase-requests'] })
      );
    });

    it('should call onConflict callback on 409 error', async () => {
      const conflictError = new ApiError(409, 'Concurrent modification', 'BUS_004');
      mockError('post', conflictError);
      const onConflict = vi.fn();
      const onError = vi.fn();

      const { result } = renderHook(
        () => useSubmitVendorSelection({ onConflict, onError }),
        { wrapper: createQueryWrapper() }
      );

      await act(async () => {
        result.current.mutate({ purchaseRequestId: 123, itemId: 'item-uuid' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onConflict).toHaveBeenCalledWith(conflictError);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call onError callback if onConflict is not provided on 409', async () => {
      const conflictError = new ApiError(409, 'Concurrent modification', 'BUS_004');
      mockError('post', conflictError);
      const onError = vi.fn();

      const { result } = renderHook(() => useSubmitVendorSelection({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ purchaseRequestId: 123, itemId: 'item-uuid' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(conflictError);
    });

    it('should not invalidate queries on non-409 errors', async () => {
      const serverError = new ApiError(500, 'Internal Server Error', 'SRV_001');
      mockError('post', serverError);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSubmitVendorSelection(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ purchaseRequestId: 123, itemId: 'item-uuid' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should NOT invalidate on non-409 errors
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });
});
