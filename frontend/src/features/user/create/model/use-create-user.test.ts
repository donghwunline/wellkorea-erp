/**
 * useCreateUser Hook Tests.
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

import { useCreateUser } from './use-create-user';

function mockSuccess<T>(method: keyof typeof httpClient, data: T) {
  (httpClient[method] as Mock).mockResolvedValue(data);
}

function mockError(method: keyof typeof httpClient, error: Error) {
  (httpClient[method] as Mock).mockRejectedValue(error);
}

function resetMocks() {
  Object.values(httpClient).forEach((mock) => (mock as Mock).mockReset());
}

const createTestInput = () => ({
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  fullName: 'Test User',
  roles: ['ROLE_SALES'] as ('ROLE_ADMIN' | 'ROLE_FINANCE' | 'ROLE_PRODUCTION' | 'ROLE_SALES')[],
});

const createUserResponse = () => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  fullName: 'Test User',
  isActive: true,
  roles: ['ROLE_SALES'],
});

describe('useCreateUser', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useCreateUser(), {
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
    it('should call createUser command on mutate', async () => {
      mockSuccess('post', createUserResponse());

      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createTestInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.post).toHaveBeenCalled();
    });

    it('should return user details on success', async () => {
      const userResponse = createUserResponse();
      mockSuccess('post', userResponse);

      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createTestInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(userResponse);
    });

    it('should set isError true on failure', async () => {
      mockError('post', new Error('Create failed'));

      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createTestInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Create failed');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate list queries on success', async () => {
      mockSuccess('post', createUserResponse());
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createQueryWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate(createTestInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['users', 'list'] })
      );
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback on success', async () => {
      mockSuccess('post', createUserResponse());
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useCreateUser({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createTestInput());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Create failed');
      mockError('post', error);
      const onError = vi.fn();

      const { result } = renderHook(() => useCreateUser({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate(createTestInput());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
