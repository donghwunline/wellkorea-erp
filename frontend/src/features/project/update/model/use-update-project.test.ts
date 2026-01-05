/**
 * useUpdateProject Hook Tests.
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

import { useUpdateProject } from './use-update-project';

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
    projectName: 'Updated Project',
    dueDate: '2026-01-15',
  },
});

describe('useUpdateProject', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useUpdateProject(), {
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
    it('should call updateProject command on mutate', async () => {
      mockSuccess('put', createCommandResult(1, 'Updated'));

      const { result } = renderHook(() => useUpdateProject(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.put).toHaveBeenCalled();
    });

    it('should return command result on success', async () => {
      const commandResult = createCommandResult(1, 'Project updated');
      mockSuccess('put', commandResult);

      const { result } = renderHook(() => useUpdateProject(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(commandResult);
    });

    it('should set isError true on failure', async () => {
      mockError('put', new Error('Update failed'));

      const { result } = renderHook(() => useUpdateProject(), {
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
  });

  describe('cache invalidation', () => {
    it('should invalidate list and detail queries on success', async () => {
      mockSuccess('put', createCommandResult(1));
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateProject(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['projects', 'list'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['projects', 'detail'] })
      );
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback with result', async () => {
      const commandResult = createCommandResult(1, 'Updated');
      mockSuccess('put', commandResult);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useUpdateProject({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
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

      const { result } = renderHook(() => useUpdateProject({ onError }), {
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
  });
});
