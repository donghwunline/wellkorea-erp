/**
 * Auth domain types.
 *
 * Types for authentication state and session management.
 */

import type { RoleName, User } from '@/shared/domain';

/**
 * Authentication state.
 */
export interface AuthState {
  /** Current authenticated user, null if not authenticated */
  readonly user: User | null;
  /** Current access token, null if not authenticated */
  readonly accessToken: string | null;
  /** Whether user is authenticated */
  readonly isAuthenticated: boolean;
  /** Whether auth state is being loaded/verified */
  readonly isLoading: boolean;
}

/**
 * Login credentials.
 */
export interface LoginCredentials {
  readonly username: string;
  readonly password: string;
}

/**
 * Auth actions available in the store.
 */
export interface AuthActions {
  /** Login with credentials */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Logout current user */
  logout: () => void;
  /** Check if user has a specific role */
  hasRole: (role: RoleName) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: RoleName[]) => boolean;
  /** Update user and token (used after refresh) */
  setUser: (user: User, accessToken: string) => void;
  /** Clear auth state (used on logout/session expiry) */
  clearAuth: () => void;
}

/**
 * Complete auth store type.
 */
export type AuthStore = AuthState & AuthActions;
