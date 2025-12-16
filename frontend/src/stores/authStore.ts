/**
 * Authentication store using Zustand.
 * Replaces AuthContext with a simpler, more performant state management solution.
 *
 * Features:
 * - Global authentication state
 * - Login/logout actions
 * - Persistent authentication (localStorage via tokenStore)
 * - Role-based access control helpers
 * - No provider wrapper needed
 * - Event-driven updates from authService
 */

import { create } from 'zustand';
import { authStorage } from '@/utils/storage';
import type { LoginRequest, RoleName, User } from '@/types/auth';
import { authEvents, authService } from '@/services/auth/authService';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: RoleName) => boolean;
  hasAnyRole: (roles: RoleName[]) => boolean;
  setUser: (user: User, accessToken: string) => void;
  clearAuth: () => void;
}

export type AuthStore = AuthState & AuthActions;

/**
 * Initialize auth state from localStorage.
 */
function getInitialState(): AuthState {
  const token = authStorage.getAccessToken();
  const user = authStorage.getUser<User>();

  if (token && user) {
    return {
      user,
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
    };
  }

  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
  };
}

/**
 * Auth store singleton.
 * Use this hook in components to access auth state and actions.
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state from localStorage
  ...getInitialState(),

  /**
   * Login action: Authenticate user and store tokens.
   *
   * Simplified: Calls service, stores tokens, and updates state directly.
   * No event emission - login is an intentional user action.
   */
  login: async (credentials: LoginRequest) => {
    try {
      const { accessToken, refreshToken, user } = await authService.login(credentials);

      // Store tokens in localStorage
      authStorage.setAccessToken(accessToken);
      authStorage.setRefreshToken(refreshToken ?? null);
      authStorage.setUser(user);

      // Update state directly (no event needed)
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  /**
   * Logout action: Clear authentication state and tokens.
   *
   * Security/UX: Clears local state IMMEDIATELY, then calls server as best-effort.
   * This ensures user is logged out instantly even if server is unreachable.
   */
  logout: () => {
    // 1) Immediately clear local state and storage
    get().clearAuth();

    // 2) Server call is best-effort (fire-and-forget)
    authService.logout().catch(err => {
      console.error('Logout API call failed:', err);
      // User is already logged out locally, so this is non-critical
    });
  },

  /**
   * Check if user has a specific role.
   */
  hasRole: (role: RoleName): boolean => {
    const { user } = get();
    if (!user) return false;
    return user.roles.includes(role);
  },

  /**
   * Check if user has any of the specified roles.
   */
  hasAnyRole: (roles: RoleName[]): boolean => {
    return roles.some(role => get().hasRole(role));
  },

  /**
   * Set user and token (used by services after login/refresh).
   */
  setUser: (user: User, accessToken: string) => {
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  /**
   * Clear auth state (used on logout or token refresh failure).
   */
  clearAuth: () => {
    authStorage.clearAuth();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));

/**
 * Subscribe to global auth events from httpClient.
 *
 * Events are used ONLY for unintentional/global session changes:
 * - 'unauthorized': Token refresh failed, session expired (clear auth immediately)
 * - 'refresh': Token successfully refreshed (update accessToken only)
 *
 * Intentional user actions (login/logout) are handled directly by the store actions above.
 *
 * NOTE: This subscription is created at module initialization and never unsubscribed.
 * This is intentional for a SPA that runs for the application lifetime.
 * For test environments, consider calling the unsubscribe function returned by subscribe().
 */
authEvents.subscribe(event => {
  switch (event.type) {
    case 'unauthorized':
      // Global session expiry - clear everything immediately
      useAuthStore.getState().clearAuth();
      break;

    case 'refresh':
      // Token refreshed - update accessToken only
      useAuthStore.setState({
        accessToken: event.payload.accessToken,
      });
      break;
  }
});
