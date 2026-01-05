/**
 * useSubmitQuotation Hook Tests.
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

import { useSubmitQuotation } from './use-submit-quotation';

function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function mockError(method: keyof typeof httpClient, error: Error) {
  (httpClient[method] as Mock).mockRejectedValue(error);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

describe('useSubmitQuotation', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useSubmitQuotation(), {
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
    it('should call submitQuotation command with quotation id', async () => {
      mockSuccess('post', createCommandResult(1, 'Submitted'));

      const { result } = renderHook(() => useSubmitQuotation(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(1);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.post).toHaveBeenCalledWith('/quotations/1/submit');
    });

    it('should return command result on success', async () => {
      const commandResult = createCommandResult(1, 'Submitted for approval');
      mockSuccess('post', commandResult);

      const { result } = renderHook(() => useSubmitQuotation(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(1);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(commandResult);
    });

    it('should set isError true on failure', async () => {
      mockError('post', new Error('Submit failed'));

      const { result } = renderHook(() => useSubmitQuotation(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(1);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Submit failed');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate detail and list queries on success', async () => {
      mockSuccess('post', createCommandResult(1));
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSubmitQuotation(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate(1);
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
      const commandResult = createCommandResult(1, 'Submitted');
      mockSuccess('post', commandResult);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useSubmitQuotation({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(1);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalledWith(commandResult);
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Submit failed');
      mockError('post', error);
      const onError = vi.fn();

      const { result } = renderHook(() => useSubmitQuotation({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(1);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
