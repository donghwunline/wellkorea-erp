/**
 * Authentication Context for managing user login/logout state across the application.
 *
 * Features:
 * - Global authentication state (user, token, loading)
 * - Login/logout methods
 * - Persistent authentication (localStorage)
 * - Role-based access control helpers
 * - SSR/test safe
 *
 * Usage:
 * ```typescript
 * // Wrap app with AuthProvider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * // Use in components
 * const { user, login, logout, hasRole } = useAuth();
 *
 * if (hasRole('ROLE_ADMIN')) {
 *   // Admin-only UI
 * }
 * ```
 */

/* eslint-disable react-refresh/only-export-components */

import type {ReactNode} from 'react';
import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {authApi} from '@/services';
import {authStorage} from '@/utils/storage';
import type {AuthState, LoginRequest, RoleName, User} from '@/types/auth';

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: RoleName) => boolean;
  hasAnyRole: (roles: RoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component to wrap the application.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize state from storage synchronously
  const [authState, setAuthState] = useState<AuthState>(() => {
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
  });

  /**
   * Login method: Authenticate user and store tokens.
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    try {
      const {accessToken, refreshToken, user} = await authApi.login(credentials);

      authStorage.setAccessToken(accessToken);
      authStorage.setRefreshToken(refreshToken ?? null);
      authStorage.setUser(user);

      setAuthState({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  /**
   * Logout method: Clear authentication state and tokens.
   * (서버 logout 먼저 시도한 뒤 클라이언트 정리)
   */
  const logout = useCallback((): void => {
    const performCleanup = () => {
      authStorage.clearAuth();

      setAuthState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    };

    authApi
      .logout()
      .catch(err => {
        console.error('Logout API call failed:', err);
      })
      .finally(() => {
        performCleanup();
      });
  }, []);

  /**
   * Check if user has a specific role.
   */
  const hasRole = useCallback(
    (role: RoleName): boolean => {
      if (!authState.user) return false;
      return authState.user.roles.includes(role);
    },
    [authState.user]
  );

  /**
   * Check if user has any of the specified roles.
   */
  const hasAnyRole = useCallback(
    (roles: RoleName[]): boolean => {
      return roles.some(role => hasRole(role));
    },
    [hasRole]
  );

  const value = useMemo(
    () => ({
      ...authState,
      login,
      logout,
      hasRole,
      hasAnyRole,
    }),
    [authState, login, logout, hasRole, hasAnyRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access authentication context.
 * Throws error if used outside AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
