/**
 * useApproveApproval Hook Tests.
 *
 * Tests the approve approval mutation hook including:
 * - Mutation state management
 * - Command function invocation
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
import { useApproveApproval } from './use-approve-approval';

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

describe('useApproveApproval', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useApproveApproval(), {
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
      const { result } = renderHook(() => useApproveApproval(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isPending).toBe(false);
    });
  });

  describe('mutation execution', () => {
    it('should call approveApproval command on mutate', async () => {
      mockSuccess('post', createCommandResult(1, 'Approved'));

      const { result } = renderHook(() => useApproveApproval(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: 1, comments: '승인합니다' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/approvals/1/approve',
        { comments: '승인합니다' }
      );
    });

    it('should return command result on success', async () => {
      const commandResult = createCommandResult(1, 'Approval approved');
      mockSuccess('post', commandResult);

      const { result } = renderHook(() => useApproveApproval(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(commandResult);
    });

    it('should set isError true on failure', async () => {
      mockError('post', new Error('Approval failed'));

      const { result } = renderHook(() => useApproveApproval(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: 1 });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Approval failed');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate approval queries on success', async () => {
      mockSuccess('post', createCommandResult(1));
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useApproveApproval(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ id: 1 });
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
        () => useApproveApproval({ entityId: 100 }),
        { wrapper: createQueryWrapper(queryClient) }
      );

      await act(async () => {
        result.current.mutate({ id: 1 });
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

      const { result } = renderHook(() => useApproveApproval(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ id: 1 });
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
      const commandResult = createCommandResult(1, 'Approved');
      mockSuccess('post', commandResult);
      const onSuccess = vi.fn();

      const { result } = renderHook(
        () => useApproveApproval({ onSuccess }),
        { wrapper: createQueryWrapper() }
      );

      await act(async () => {
        result.current.mutate({ id: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalledWith(commandResult);
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Approval failed');
      mockError('post', error);
      const onError = vi.fn();

      const { result } = renderHook(
        () => useApproveApproval({ onError }),
        { wrapper: createQueryWrapper() }
      );

      await act(async () => {
        result.current.mutate({ id: 1 });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should not fail if callbacks are not provided', async () => {
      mockSuccess('post', createCommandResult(1));

      const { result } = renderHook(() => useApproveApproval(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});
