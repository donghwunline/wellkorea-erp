/**
 * Tests for ProtectedRoute component
 */

import React from 'react';
import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {ProtectedRoute} from './ProtectedRoute';
import AuthContext from '@/contexts/AuthContext';
import type {AuthState, RoleName} from '@/types/auth';

interface AuthContextValue extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  hasRole: (role: RoleName) => boolean;
  hasAnyRole: (roles: RoleName[]) => boolean;
}

const renderWithAuth = (
  ui: React.ReactElement,
  authValue: AuthContextValue,
  initialEntries = ['/'],
) => {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={ui} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
};

const createAuthValue = (overrides?: Partial<AuthContextValue>): AuthContextValue => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  hasRole: vi.fn(),
  hasAnyRole: vi.fn(),
  ...overrides,
});

describe('ProtectedRoute', () => {
  describe('unauthenticated users', () => {
    it('should redirect to login when user is not authenticated', () => {
      const authValue = createAuthValue({
        isAuthenticated: false,
      });

      renderWithAuth(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('authenticated users', () => {
    it('should render children when user is authenticated and no role required', () => {
      const authValue = createAuthValue({
        isAuthenticated: true,
        user: {id: 1, username: 'alice', email: 'alice@example.com', roles: []},
        accessToken: 'token',
      });

      renderWithAuth(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  describe('role-based access with requiredRole', () => {
    it('should render children when user has required role', () => {
      const authValue = createAuthValue({
        isAuthenticated: true,
        user: {
          id: 1,
          username: 'alice',
          email: 'alice@example.com',
          roles: [{name: 'ADMIN'}],
        },
        accessToken: 'token',
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithAuth(
        <ProtectedRoute requiredRole="ADMIN">
          <div>Admin Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(authValue.hasRole).toHaveBeenCalledWith('ADMIN');
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should show Access Denied when user lacks required role', () => {
      const authValue = createAuthValue({
        isAuthenticated: true,
        user: {
          id: 1,
          username: 'alice',
          email: 'alice@example.com',
          roles: [{name: 'USER'}],
        },
        accessToken: 'token',
        hasRole: vi.fn().mockReturnValue(false),
      });

      renderWithAuth(
        <ProtectedRoute requiredRole="ADMIN">
          <div>Admin Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(authValue.hasRole).toHaveBeenCalledWith('ADMIN');
      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('role-based access with requiredRoles', () => {
    it('should render children when user has at least one of required roles', () => {
      const authValue = createAuthValue({
        isAuthenticated: true,
        user: {
          id: 1,
          username: 'alice',
          email: 'alice@example.com',
          roles: [{name: 'USER'}],
        },
        accessToken: 'token',
        hasAnyRole: vi.fn().mockReturnValue(true),
      });

      renderWithAuth(
        <ProtectedRoute requiredRoles={['ADMIN', 'USER']}>
          <div>Multi-Role Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(authValue.hasAnyRole).toHaveBeenCalledWith(['ADMIN', 'USER']);
      expect(screen.getByText('Multi-Role Content')).toBeInTheDocument();
    });

    it('should show Access Denied when user has none of required roles', () => {
      const authValue = createAuthValue({
        isAuthenticated: true,
        user: {
          id: 1,
          username: 'alice',
          email: 'alice@example.com',
          roles: [{name: 'USER'}],
        },
        accessToken: 'token',
        hasAnyRole: vi.fn().mockReturnValue(false),
      });

      renderWithAuth(
        <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
          <div>Admin/Manager Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(authValue.hasAnyRole).toHaveBeenCalledWith(['ADMIN', 'MANAGER']);
      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      expect(screen.queryByText('Admin/Manager Content')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading message when authentication is loading', () => {
      const authValue = createAuthValue({
        isLoading: true,
        isAuthenticated: false,
      });

      renderWithAuth(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Access Denied page', () => {
    it('should render Access Denied page with required role information', () => {
      const authValue = createAuthValue({
        isAuthenticated: true,
        user: {
          id: 1,
          username: 'alice',
          email: 'alice@example.com',
          roles: [{name: 'USER'}],
        },
        accessToken: 'token',
        hasRole: vi.fn().mockReturnValue(false),
      });

      renderWithAuth(
        <ProtectedRoute requiredRole="ADMIN">
          <div>Admin Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument();
      expect(screen.getByText(/Required role:/i)).toBeInTheDocument();
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });
  });
});
