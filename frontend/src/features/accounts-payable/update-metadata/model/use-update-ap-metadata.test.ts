/**
 * useUpdateAPMetadata Hook Tests.
 */

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper, createTestQueryClient } from '@/test/entity-test-utils';
import { useUpdateAPMetadata } from './use-update-ap-metadata';

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

function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function mockError(method: keyof typeof httpClient, error: Error) {
  (httpClient[method] as Mock).mockRejectedValue(error);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

const createUpdateInput = () => ({
  id: 1,
  input: {
    dueDate: '2025-06-15',
    notes: 'Updated notes',
  },
});

const createUpdateResponse = () => ({
  id: 1,
  message: 'Updated successfully',
});

describe('useUpdateAPMetadata', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useUpdateAPMetadata(), {
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
    it('should call updateAccountsPayable command on mutate', async () => {
      mockSuccess('patch', createUpdateResponse());

      const { result } = renderHook(() => useUpdateAPMetadata(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.patch).toHaveBeenCalledWith(
        '/accounts-payable/1',
        expect.objectContaining({
          dueDate: '2025-06-15',
          notes: 'Updated notes',
        })
      );
    });

    it('should return update result on success', async () => {
      const updateResponse = createUpdateResponse();
      mockSuccess('patch', updateResponse);

      const { result } = renderHook(() => useUpdateAPMetadata(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(updateResponse);
    });

    it('should set isError true on failure', async () => {
      mockError('patch', new Error('Update failed'));

      const { result } = renderHook(() => useUpdateAPMetadata(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Update failed');
    });

    it('should handle updating only dueDate', async () => {
      mockSuccess('patch', createUpdateResponse());

      const { result } = renderHook(() => useUpdateAPMetadata(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          id: 1,
          input: { dueDate: '2025-07-01' },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.patch).toHaveBeenCalledWith(
        '/accounts-payable/1',
        expect.objectContaining({ dueDate: '2025-07-01' })
      );
    });

    it('should handle clearing dueDate with null', async () => {
      mockSuccess('patch', createUpdateResponse());

      const { result } = renderHook(() => useUpdateAPMetadata(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          id: 1,
          input: { dueDate: null, notes: 'No due date' },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.patch).toHaveBeenCalledWith(
        '/accounts-payable/1',
        expect.objectContaining({ dueDate: null })
      );
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate all AP queries on success', async () => {
      mockSuccess('patch', createUpdateResponse());
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateAPMetadata(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['accounts-payable'] })
      );
    });

    it('should not invalidate queries on error', async () => {
      mockError('patch', new Error('Update failed'));
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateAPMetadata(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback on success', async () => {
      mockSuccess('patch', createUpdateResponse());
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useUpdateAPMetadata({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalledWith(createUpdateResponse());
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Update failed');
      mockError('patch', error);
      const onError = vi.fn();

      const { result } = renderHook(() => useUpdateAPMetadata({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should not call onSuccess callback on failure', async () => {
      mockError('patch', new Error('Update failed'));
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useUpdateAPMetadata({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should not call onError callback on success', async () => {
      mockSuccess('patch', createUpdateResponse());
      const onError = vi.fn();

      const { result } = renderHook(() => useUpdateAPMetadata({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });
});
