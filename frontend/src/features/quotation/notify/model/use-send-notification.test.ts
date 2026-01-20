/**
 * useSendNotification Hook Tests.
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

import { useSendNotification } from './use-send-notification';

function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function mockError(method: keyof typeof httpClient, error: Error) {
  (httpClient[method] as Mock).mockRejectedValue(error);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

describe('useSendNotification', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useSendNotification(), {
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
    it('should call sendQuotationNotification with quotation id', async () => {
      mockSuccess('post', undefined);

      const { result } = renderHook(() => useSendNotification(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ quotationId: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/quotations/1/send-revision-notification',
        {}
      );
    });

    it('should set isError true on failure', async () => {
      mockError('post', new Error('Send notification failed'));

      const { result } = renderHook(() => useSendNotification(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ quotationId: 1 });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Send notification failed');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate detail and list queries on success', async () => {
      mockSuccess('post', undefined);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSendNotification(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate({ quotationId: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Status may change to SENT
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['quotations', 'detail'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['quotations', 'list'] })
      );
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback on success', async () => {
      mockSuccess('post', undefined);
      const onSuccess = vi.fn();

      const { result } = renderHook(
        () => useSendNotification({ onSuccess }),
        { wrapper: createQueryWrapper() }
      );

      await act(async () => {
        result.current.mutate({ quotationId: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Send notification failed');
      mockError('post', error);
      const onError = vi.fn();

      const { result } = renderHook(
        () => useSendNotification({ onError }),
        { wrapper: createQueryWrapper() }
      );

      await act(async () => {
        result.current.mutate({ quotationId: 1 });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
