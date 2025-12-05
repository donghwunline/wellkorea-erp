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
 * if (hasRole('ADMIN')) {
 *   // Admin-only UI
 * }
 * ```
 */

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import type { AuthState, LoginRequest, LoginResponse, RoleName, User } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: RoleName) => boolean;
  hasAnyRole: (roles: RoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SSR/test safe
const isBrowser = typeof window !== 'undefined';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component to wrap the application.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Use lazy initialization to avoid setState in effect
  const [authState, setAuthState] = useState<AuthState>(() => {
    // For non-browser environments (SSR/test), start with isLoading: false
    if (!isBrowser) {
      return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    }

    // For browser, start with isLoading: true (will check localStorage in effect)
    return {
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
    };
  });

  /**
   * Initialize authentication state from localStorage on mount.
   */
  useEffect(() => {
    if (!isBrowser) return; // Early return, no setState needed

    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        setAuthState({
          user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Login method: Authenticate user and store tokens.
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      const { accessToken, refreshToken, user } = response.data;

      if (isBrowser) {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(user));
      }

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
      if (isBrowser) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }

      setAuthState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    };

    api
      .post('/auth/logout')
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
      return authState.user.roles.some(r => r.name === role);
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
