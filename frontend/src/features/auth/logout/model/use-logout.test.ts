/**
 * useLogout Hook Tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockLogout = vi.hoisted(() => vi.fn());

vi.mock('@/entities/auth', async () => {
  const actual = await vi.importActual('@/entities/auth');
  return {
    ...actual,
    useAuth: () => ({
      login: vi.fn(),
      logout: mockLogout,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
    }),
  };
});

import { useLogout } from './use-logout';

describe('useLogout', () => {
  beforeEach(() => {
    mockLogout.mockReset();
  });

  describe('hook structure', () => {
    it('should return logout function', () => {
      const { result } = renderHook(() => useLogout());

      expect(result.current).toHaveProperty('logout');
      expect(typeof result.current.logout).toBe('function');
    });
  });

  describe('logout execution', () => {
    it('should call auth logout on logout', () => {
      const { result } = renderHook(() => useLogout());

      act(() => {
        result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('should call onLogout callback after logout', () => {
      const onLogout = vi.fn();

      const { result } = renderHook(() => useLogout({ onLogout }));

      act(() => {
        result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(onLogout).toHaveBeenCalled();
    });

    it('should call onLogout after auth logout', () => {
      const callOrder: string[] = [];
      mockLogout.mockImplementation(() => {
        callOrder.push('authLogout');
      });
      const onLogout = vi.fn(() => {
        callOrder.push('onLogout');
      });

      const { result } = renderHook(() => useLogout({ onLogout }));

      act(() => {
        result.current.logout();
      });

      expect(callOrder).toEqual(['authLogout', 'onLogout']);
    });
  });
});
