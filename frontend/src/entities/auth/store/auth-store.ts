/**
 * Authentication store using Zustand.
 *
 * Features:
 * - Global authentication state
 * - Login/logout actions
 * - Persistent authentication (localStorage via authStorage)
 * - Role-based access control helpers
 * - No provider wrapper needed
 * - Event-driven updates from httpClient
 */

import { create } from 'zustand';
import { authStorage } from '@/shared/lib';
import type { RoleName, User } from '@/entities/user';
import type { AuthStore, LoginCredentials } from '../model/auth';
import { authApi } from '../api/auth.api';
import { authEvents } from './auth-events';

/**
 * Initialize auth state from localStorage.
 */
function getInitialState() {
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
 *
 * @example
 * ```tsx
 * function Header() {
 *   const user = useAuthStore(state => state.user);
 *   const logout = useAuthStore(state => state.logout);
 *
 *   return (
 *     <header>
 *       <span>{user?.fullName}</span>
 *       <button onClick={logout}>Logout</button>
 *     </header>
 *   );
 * }
 * ```
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state from localStorage
  ...getInitialState(),

  /**
   * Login action: Authenticate user and store tokens.
   *
   * Simplified: Calls API, stores tokens, and updates state directly.
   * No event emission - login is an intentional user action.
   */
  login: async (credentials: LoginCredentials) => {
    try {
      const { accessToken, refreshToken, user } = await authApi.login({
        username: credentials.username,
        password: credentials.password,
      });

      // Store tokens in localStorage
      authStorage.setAccessToken(accessToken);
      authStorage.setRefreshToken(refreshToken);
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
    authApi.logout().catch(err => {
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
   * Set user and token (used by services after token refresh).
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
