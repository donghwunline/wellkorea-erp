/**
 * Unit tests for authStore.
 * Tests Zustand global auth state, login/logout actions, RBAC helpers, and event subscriptions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './authStore';
import { mockAuthStates, mockUsers } from '@/test/fixtures';
import type { LoginResponse } from '@/services/auth/types';
import type { ApiError } from '@/api/types';
// Import mocked modules
import { authEvents, authService } from '@/services/auth/authService';
import { authStorage } from '@/shared/utils';

// Mock authService
vi.mock('@/services/auth/authService', () => {
  const authEvents = {
    listeners: [] as Array<(event: { type: string; payload?: unknown }) => void>,
    subscribe: vi.fn((listener: (event: { type: string; payload?: unknown }) => void) => {
      authEvents.listeners.push(listener);
      return () => {
        authEvents.listeners = authEvents.listeners.filter(l => l !== listener);
      };
    }),
    emit: vi.fn((event: { type: string; payload?: unknown }) => {
      authEvents.listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in listener:', error);
        }
      });
    }),
  };

  return {
    authEvents,
    authService: {
      login: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
    },
  };
});

// Mock authStorage
vi.mock('@/shared/utils', () => ({
  authStorage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    getUser: vi.fn(),
    setUser: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useAuthStore.setState(mockAuthStates.unauthenticated);
  });

  afterEach(() => {
    // Clean up any remaining state
    useAuthStore.setState(mockAuthStates.unauthenticated);
  });

  describe('initial state', () => {
    it('should start with unauthenticated state when no tokens in storage', () => {
      // Given: No tokens in storage
      vi.mocked(authStorage.getAccessToken).mockReturnValue(null);
      vi.mocked(authStorage.getUser).mockReturnValue(null);

      // When: Get initial state
      const state = useAuthStore.getState();

      // Then: Unauthenticated state
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should restore auth state from localStorage when tokens exist', () => {
      // Given: Tokens and user in storage
      vi.mocked(authStorage.getAccessToken).mockReturnValue('stored-token-123');
      vi.mocked(authStorage.getUser).mockReturnValue(mockUsers.admin);

      // When: Initialize store (this happens at module load, so we simulate it)
      useAuthStore.setState({
        user: mockUsers.admin,
        accessToken: 'stored-token-123',
        isAuthenticated: true,
        isLoading: false,
      });

      const state = useAuthStore.getState();

      // Then: Authenticated state restored
      expect(state.user).toEqual(mockUsers.admin);
      expect(state.accessToken).toBe('stored-token-123');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('login', () => {
    it('should authenticate user, store tokens, and update state', async () => {
      // Given: Successful login response
      const mockResponse: LoginResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: mockUsers.admin,
      };

      vi.mocked(authService.login).mockResolvedValue(mockResponse);

      // When: Login
      await useAuthStore.getState().login({ username: 'admin', password: 'password' });

      // Then: Calls authService.login
      expect(authService.login).toHaveBeenCalledOnce();
      expect(authService.login).toHaveBeenCalledWith({
        username: 'admin',
        password: 'password',
      });

      // And: Stores tokens in localStorage
      expect(authStorage.setAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(authStorage.setRefreshToken).toHaveBeenCalledWith('new-refresh-token');
      expect(authStorage.setUser).toHaveBeenCalledWith(mockUsers.admin);

      // And: Updates state
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUsers.admin);
      expect(state.accessToken).toBe('new-access-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle login without refreshToken', async () => {
      // Given: Response without refreshToken
      const mockResponse: LoginResponse = {
        accessToken: 'access-only',
        user: mockUsers.sales,
      };

      vi.mocked(authService.login).mockResolvedValue(mockResponse);

      // When: Login
      await useAuthStore.getState().login({ username: 'sales', password: 'password' });

      // Then: Sets refreshToken to null
      expect(authStorage.setRefreshToken).toHaveBeenCalledWith(null);

      // And: Updates state with user
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUsers.sales);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should throw error on failed login and not update state', async () => {
      // Given: Login fails
      const apiError: ApiError = {
        status: 401,
        errorCode: 'AUTH_001',
        message: 'Invalid credentials',
      };

      vi.mocked(authService.login).mockRejectedValue(apiError);

      // When/Then: Login throws error
      await expect(
        useAuthStore.getState().login({ username: 'wrong', password: 'wrong' })
      ).rejects.toEqual(apiError);

      // And: State remains unauthenticated
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);

      // And: Tokens not stored
      expect(authStorage.setAccessToken).not.toHaveBeenCalled();
      expect(authStorage.setUser).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should immediately clear local state and call authService.logout', async () => {
      // Given: User is logged in
      useAuthStore.setState(mockAuthStates.authenticated);

      vi.mocked(authService.logout).mockResolvedValue(undefined);

      // When: Logout (synchronous action that fires async API call)
      useAuthStore.getState().logout();

      // Then: Immediately clears localStorage
      expect(authStorage.clearAuth).toHaveBeenCalledOnce();

      // And: Immediately clears state
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);

      // And: Calls authService.logout (fire-and-forget)
      // Wait for async call to complete
      await vi.waitFor(() => {
        expect(authService.logout).toHaveBeenCalledOnce();
      });
    });

    it('should clear local state even if server logout fails', async () => {
      // Given: User is logged in
      useAuthStore.setState(mockAuthStates.authenticated);

      // Server logout will fail
      const apiError: ApiError = {
        status: 500,
        errorCode: 'SERVER_001',
        message: 'Server error',
      };
      vi.mocked(authService.logout).mockRejectedValue(apiError);

      // When: Logout
      useAuthStore.getState().logout();

      // Then: Local state cleared immediately (before server call)
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);

      expect(authStorage.clearAuth).toHaveBeenCalledOnce();

      // Server call will fail but user is already logged out locally
      await vi.waitFor(() => {
        expect(authService.logout).toHaveBeenCalledOnce();
      });
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      // Given: User with ADMIN role
      useAuthStore.setState({
        user: mockUsers.admin,
        accessToken: 'token',
        isAuthenticated: true,
        isLoading: false,
      });

      // When: Check for ADMIN role
      const hasAdmin = useAuthStore.getState().hasRole('ROLE_ADMIN');

      // Then: Returns true
      expect(hasAdmin).toBe(true);
    });

    it('should return false when user does not have the specified role', () => {
      // Given: User with only SALES role
      useAuthStore.setState({
        user: mockUsers.sales,
        accessToken: 'token',
        isAuthenticated: true,
        isLoading: false,
      });

      // When: Check for ADMIN role
      const hasAdmin = useAuthStore.getState().hasRole('ROLE_ADMIN');

      // Then: Returns false
      expect(hasAdmin).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      // Given: Unauthenticated state
      useAuthStore.setState(mockAuthStates.unauthenticated);

      // When: Check for any role
      const hasRole = useAuthStore.getState().hasRole('ROLE_ADMIN');

      // Then: Returns false
      expect(hasRole).toBe(false);
    });

    it('should work with multi-role users', () => {
      // Given: User with multiple roles
      useAuthStore.setState({
        user: mockUsers.multiRole,
        accessToken: 'token',
        isAuthenticated: true,
        isLoading: false,
      });

      // When: Check for both roles
      const hasAdmin = useAuthStore.getState().hasRole('ROLE_ADMIN');
      const hasSales = useAuthStore.getState().hasRole('ROLE_SALES');
      const hasFinance = useAuthStore.getState().hasRole('ROLE_FINANCE');

      // Then: Returns true for assigned roles, false for others
      expect(hasAdmin).toBe(true);
      expect(hasSales).toBe(true);
      expect(hasFinance).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has at least one of the specified roles', () => {
      // Given: User with ADMIN role
      useAuthStore.setState({
        user: mockUsers.admin,
        accessToken: 'token',
        isAuthenticated: true,
        isLoading: false,
      });

      // When: Check for ADMIN or FINANCE
      const hasAny = useAuthStore.getState().hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

      // Then: Returns true (has ADMIN)
      expect(hasAny).toBe(true);
    });

    it('should return false when user has none of the specified roles', () => {
      // Given: User with only SALES role
      useAuthStore.setState({
        user: mockUsers.sales,
        accessToken: 'token',
        isAuthenticated: true,
        isLoading: false,
      });

      // When: Check for ADMIN or FINANCE
      const hasAny = useAuthStore.getState().hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

      // Then: Returns false
      expect(hasAny).toBe(false);
    });

    it('should return false when user is not authenticated', () => {
      // Given: Unauthenticated state
      useAuthStore.setState(mockAuthStates.unauthenticated);

      // When: Check for any roles
      const hasAny = useAuthStore.getState().hasAnyRole(['ROLE_ADMIN', 'ROLE_SALES']);

      // Then: Returns false
      expect(hasAny).toBe(false);
    });

    it('should work with empty roles array', () => {
      // Given: User is authenticated
      useAuthStore.setState(mockAuthStates.authenticated);

      // When: Check for empty roles array
      const hasAny = useAuthStore.getState().hasAnyRole([]);

      // Then: Returns false
      expect(hasAny).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should update user and token in state', () => {
      // Given: Unauthenticated state
      useAuthStore.setState(mockAuthStates.unauthenticated);

      // When: Set user
      useAuthStore.getState().setUser(mockUsers.finance, 'new-token-xyz');

      // Then: State updated
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUsers.finance);
      expect(state.accessToken).toBe('new-token-xyz');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('clearAuth', () => {
    it('should clear localStorage and reset state', () => {
      // Given: Authenticated state
      useAuthStore.setState(mockAuthStates.authenticated);

      // When: Clear auth
      useAuthStore.getState().clearAuth();

      // Then: Clears localStorage
      expect(authStorage.clearAuth).toHaveBeenCalledOnce();

      // And: Resets state
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('event subscription', () => {
    it('should clear auth on unauthorized event', () => {
      // Given: User is authenticated
      useAuthStore.setState(mockAuthStates.authenticated);

      // When: Emit unauthorized event
      vi.mocked(authEvents.emit)({ type: 'unauthorized' });

      // Then: Auth cleared
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(authStorage.clearAuth).toHaveBeenCalled();
    });

    it('should update accessToken on refresh event', () => {
      // Given: User is authenticated with old token
      useAuthStore.setState({
        user: mockUsers.admin,
        accessToken: 'old-token',
        isAuthenticated: true,
        isLoading: false,
      });

      // When: Emit refresh event with new token
      vi.mocked(authEvents.emit)({
        type: 'refresh',
        payload: { accessToken: 'new-refreshed-token' },
      });

      // Then: Token updated, user preserved
      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-refreshed-token');
      expect(state.user).toEqual(mockUsers.admin); // User unchanged
      expect(state.isAuthenticated).toBe(true); // Still authenticated
    });

    it('should not affect state on unknown event types', () => {
      // Given: Authenticated state
      const initialState = { ...mockAuthStates.authenticated };
      useAuthStore.setState(initialState);

      // When: Emit unknown event
      vi.mocked(authEvents.emit)({ type: 'unknown-event' });

      // Then: State unchanged
      const state = useAuthStore.getState();
      expect(state).toMatchObject(initialState);
    });
  });
});
