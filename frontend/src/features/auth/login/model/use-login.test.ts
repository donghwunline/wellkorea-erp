/**
 * useLogin Hook Tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createQueryWrapper } from '@/test/entity-test-utils';

const mockLogin = vi.hoisted(() => vi.fn());

vi.mock('@/entities/auth', async () => {
  const actual = await vi.importActual('@/entities/auth');
  return {
    ...actual,
    useAuth: () => ({
      login: mockLogin,
      logout: vi.fn(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
    }),
  };
});

import { useLogin } from './use-login';

describe('useLogin', () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useLogin(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
    });

    it('should have isPending false initially', () => {
      const { result } = renderHook(() => useLogin(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isPending).toBe(false);
    });
  });

  describe('mutation execution', () => {
    it('should call auth login on mutate', async () => {
      mockLogin.mockResolvedValue(undefined);

      const { result } = renderHook(() => useLogin(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          username: 'testuser',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });

    it('should set isError true on failure', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useLogin(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          username: 'testuser',
          password: 'wrongpassword',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Invalid credentials');
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback on success', async () => {
      mockLogin.mockResolvedValue(undefined);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useLogin({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          username: 'testuser',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Invalid credentials');
      mockLogin.mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() => useLogin({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          username: 'testuser',
          password: 'wrongpassword',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
