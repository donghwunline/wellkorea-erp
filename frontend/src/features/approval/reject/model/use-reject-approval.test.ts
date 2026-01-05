/**
 * useRejectApproval Hook Tests.
 *
 * Tests the reject approval mutation hook including:
 * - Mutation state management
 * - Command function invocation with required reason
 * - Cache invalidation on success
 * - Callback invocation
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  createQueryWrapper,
  createTestQueryClient,
  createCommandResult,
} from '@/test/entity-test-utils';

// Inline httpClient mock (vi.hoisted cannot import external modules)
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

// Import after mock setup
import { useRejectApproval } from './use-reject-approval';

// Helper functions for httpClient mock
function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function mockError(method: keyof typeof httpClient, error: Error) {
  (httpClient[method] as Mock).mockRejectedValue(error);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

describe('useRejectApproval', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useRejectApproval(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('error');
    });

    it('should have isPending false initially', () => {
      const { result } = renderHook(() => useRejectApproval(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isPending).toBe(false);
    });
  });

  describe('mutation execution', () => {
    it('should call rejectApproval command with id and reason', async () => {
      mockSuccess('post', createCommandResult(1, 'Rejected'));

      const { result } = renderHook(() => useRejectApproval(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: 1, reason: '요청 내용이 부적합합니다' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/approvals/1/reject',
        { reason: '요청 내용이 부적합합니다', comments: undefined }
      );
    });

    it('should return command result on success', async () => {
      const commandResult = createCommandResult(1, 'Approval rejected');
      mockSuccess('post', commandResult);

      const { result } = renderHook(() => useRejectApproval(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: 1, reason: '반려 사유' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(commandResult);
    });

    it('should set isError true on failure', async () => {
      mockError('post', new Error('Rejection failed'));

      const { result } = renderHook(() => useRejectApproval(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: 1, reason: '반려 사유' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Rejection failed');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate approval queries on success', async () => {
      mockSuccess('post', createCommandResult(1));
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRejectApproval(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ id: 1, reason: '반려' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should invalidate approval queries
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['approvals'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['approvals', 'detail'] })
      );
    });

    it('should invalidate quotation queries when entityId provided', async () => {
      mockSuccess('post', createCommandResult(1));
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useRejectApproval({ entityId: 100 }),
        { wrapper: createQueryWrapper(queryClient) }
      );

      await act(async () => {
        result.current.mutate({ id: 1, reason: '반려' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should also invalidate quotation queries
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['quotations', 'detail'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['quotations', 'list'] })
      );
    });

    it('should not invalidate quotation queries when no entityId', async () => {
      mockSuccess('post', createCommandResult(1));
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRejectApproval(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ id: 1, reason: '반려' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should NOT invalidate quotation queries
      const quotationCalls = invalidateSpy.mock.calls.filter(
        (call) =>
          Array.isArray(call[0]?.queryKey) &&
          call[0].queryKey[0] === 'quotations'
      );
      expect(quotationCalls.length).toBe(0);
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback with result', async () => {
      const commandResult = createCommandResult(1, 'Rejected');
      mockSuccess('post', commandResult);
      const onSuccess = vi.fn();

      const { result } = renderHook(
        () => useRejectApproval({ onSuccess }),
        { wrapper: createQueryWrapper() }
      );

      await act(async () => {
        result.current.mutate({ id: 1, reason: '반려 사유' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalledWith(commandResult);
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Rejection failed');
      mockError('post', error);
      const onError = vi.fn();

      const { result } = renderHook(
        () => useRejectApproval({ onError }),
        { wrapper: createQueryWrapper() }
      );

      await act(async () => {
        result.current.mutate({ id: 1, reason: '반려 사유' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should not fail if callbacks are not provided', async () => {
      mockSuccess('post', createCommandResult(1));

      const { result } = renderHook(() => useRejectApproval(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: 1, reason: '반려' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});
