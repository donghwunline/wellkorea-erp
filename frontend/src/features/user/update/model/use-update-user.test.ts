/**
 * useUpdateUser Hook Tests.
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

import { useUpdateUser } from './use-update-user';

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
  data: {
    fullName: 'Updated User',
    email: 'updated@example.com',
  },
});

const createUserResponse = () => ({
  id: 1,
  username: 'testuser',
  email: 'updated@example.com',
  fullName: 'Updated User',
  isActive: true,
  roles: ['ROLE_USER'],
});

describe('useUpdateUser', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useUpdateUser(), {
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
    it('should call updateUser command on mutate', async () => {
      mockSuccess('put', createUserResponse());

      const { result } = renderHook(() => useUpdateUser(), {
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

    it('should return updated user details on success', async () => {
      const userResponse = createUserResponse();
      mockSuccess('put', userResponse);

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(userResponse);
    });

    it('should set isError true on failure', async () => {
      mockError('put', new Error('Update failed'));

      const { result } = renderHook(() => useUpdateUser(), {
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
      mockSuccess('put', createUserResponse());
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['users', 'list'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['users', 'detail'] })
      );
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback on success', async () => {
      mockSuccess('put', createUserResponse());
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useUpdateUser({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createUpdateInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Update failed');
      mockError('put', error);
      const onError = vi.fn();

      const { result } = renderHook(() => useUpdateUser({ onError }), {
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
