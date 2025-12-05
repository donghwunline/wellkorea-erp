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

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '@/services/api';
import type {
  User,
  LoginRequest,
  LoginResponse,
  AuthState,
  RoleName,
} from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: RoleName) => boolean;
  hasAnyRole: (roles: RoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SSR/test safe
const isBrowser = typeof window !== 'undefined';

/**
 * AuthProvider component to wrap the application.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /**
   * Initialize authentication state from localStorage on mount.
   */
  useEffect(() => {
    if (!isBrowser) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

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
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Login method: Authenticate user and store tokens.
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
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
  };

  /**
   * Logout method: Clear authentication state and tokens.
   */
  const logout = (): void => {
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

    // Optional: Call backend logout endpoint to invalidate token
    api.post('/auth/logout').catch((err) => {
      console.error('Logout API call failed:', err);
    });
  };

  /**
   * Check if user has a specific role.
   */
  const hasRole = (role: RoleName): boolean => {
    return authState.user?.roles.some((r) => r.name === role) ?? false;
  };

  /**
   * Check if user has any of the specified roles.
   */
  const hasAnyRole = (roles: RoleName[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
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
