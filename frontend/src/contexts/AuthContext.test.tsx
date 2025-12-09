/**
 * Tests for AuthContext
 */

import React from 'react';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {AuthProvider, useAuth} from './AuthContext';
import {createMockUser, mockUsers} from '@/test/fixtures';

// Mock dependencies
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('@/utils/storage', () => ({
  authStorage: {
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setRefreshToken: vi.fn(),
    getUser: vi.fn(),
    setUser: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

const api = (await import('@/services/api')).default;
const {authStorage} = await import('@/utils/storage');

const wrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with unauthenticated state when no stored auth', () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue(null);
      vi.mocked(authStorage.getUser).mockReturnValue(null);

      const {result} = renderHook(() => useAuth(), {wrapper});

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize with authenticated state when stored auth exists', () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue('stored-token');
      vi.mocked(authStorage.getUser).mockReturnValue(mockUsers.admin);

      const {result} = renderHook(() => useAuth(), {wrapper});

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUsers.admin);
      expect(result.current.accessToken).toBe('stored-token');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('should successfully login and update state', async () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue(null);
      vi.mocked(authStorage.getUser).mockReturnValue(null);

      vi.mocked(api.post).mockResolvedValue({
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          user: mockUsers.admin,
        },
      });

      const {result} = renderHook(() => useAuth(), {wrapper});

      await act(async () => {
        await result.current.login({username: 'alice', password: 'password'});
      });

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        username: 'alice',
        password: 'password',
      });
      expect(authStorage.setAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(authStorage.setRefreshToken).toHaveBeenCalledWith('new-refresh-token');
      expect(authStorage.setUser).toHaveBeenCalledWith(mockUsers.admin);

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.accessToken).toBe('new-access-token');
      expect(result.current.user).toEqual(mockUsers.admin);
    });

    it('should handle login with null refreshToken', async () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue(null);
      vi.mocked(authStorage.getUser).mockReturnValue(null);

      vi.mocked(api.post).mockResolvedValue({
        data: {
          accessToken: 'access-token',
          refreshToken: null,
          user: mockUsers.sales,
        },
      });

      const {result} = renderHook(() => useAuth(), {wrapper});

      await act(async () => {
        await result.current.login({username: 'alice', password: 'password'});
      });

      expect(authStorage.setRefreshToken).toHaveBeenCalledWith(null);
    });

    it('should throw error on login failure', async () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue(null);
      vi.mocked(authStorage.getUser).mockReturnValue(null);

      vi.mocked(api.post).mockRejectedValue(new Error('Invalid credentials'));

      const {result} = renderHook(() => useAuth(), {wrapper});

      await expect(
        act(async () => {
          await result.current.login({username: 'alice', password: 'wrong'});
        }),
      ).rejects.toThrow('Invalid credentials');

      expect(authStorage.setAccessToken).not.toHaveBeenCalled();
      expect(authStorage.setRefreshToken).not.toHaveBeenCalled();
      expect(authStorage.setUser).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear state', async () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue('token');
      vi.mocked(authStorage.getUser).mockReturnValue(mockUsers.admin);
      vi.mocked(api.post).mockResolvedValue({});

      const {result} = renderHook(() => useAuth(), {wrapper});

      // Initial state should be authenticated
      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        result.current.logout();
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(authStorage.clearAuth).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
    });

    it('should clear state even if logout API fails', async () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue('token');
      vi.mocked(authStorage.getUser).mockReturnValue(mockUsers.admin);
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

      const {result} = renderHook(() => useAuth(), {wrapper});

      await act(async () => {
        result.current.logout();
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Should still clear auth even if API call fails
      expect(authStorage.clearAuth).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      const mockUser = createMockUser({
        username: 'alice',
        roles: ['ADMIN', 'SALES'],
      });

      vi.mocked(authStorage.getAccessToken).mockReturnValue('token');
      vi.mocked(authStorage.getUser).mockReturnValue(mockUser);

      const {result} = renderHook(() => useAuth(), {wrapper});

      expect(result.current.hasRole('ADMIN')).toBe(true);
      expect(result.current.hasRole('SALES')).toBe(true);
    });

    it('should return false when user does not have the specified role', () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue('token');
      vi.mocked(authStorage.getUser).mockReturnValue(mockUsers.sales);

      const {result} = renderHook(() => useAuth(), {wrapper});

      expect(result.current.hasRole('ADMIN')).toBe(false);
      expect(result.current.hasRole('FINANCE')).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue(null);
      vi.mocked(authStorage.getUser).mockReturnValue(null);

      const {result} = renderHook(() => useAuth(), {wrapper});

      expect(result.current.hasRole('ADMIN')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has at least one of the specified roles', () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue('token');
      vi.mocked(authStorage.getUser).mockReturnValue(mockUsers.sales);

      const {result} = renderHook(() => useAuth(), {wrapper});

      expect(result.current.hasAnyRole(['ADMIN', 'SALES'])).toBe(true);
      expect(result.current.hasAnyRole(['FINANCE', 'SALES'])).toBe(true);
    });

    it('should return false when user has none of the specified roles', () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue('token');
      vi.mocked(authStorage.getUser).mockReturnValue(mockUsers.sales);

      const {result} = renderHook(() => useAuth(), {wrapper});

      expect(result.current.hasAnyRole(['ADMIN', 'FINANCE'])).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      vi.mocked(authStorage.getAccessToken).mockReturnValue(null);
      vi.mocked(authStorage.getUser).mockReturnValue(null);

      const {result} = renderHook(() => useAuth(), {wrapper});

      expect(result.current.hasAnyRole(['ADMIN', 'SALES'])).toBe(false);
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleErrorSpy.mockRestore();
    });
  });
});
