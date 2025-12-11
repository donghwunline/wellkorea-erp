/**
 * Tests for ProtectedRoute component
 */

import React from 'react';
import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {ProtectedRoute} from './ProtectedRoute';
import AuthContext, {type AuthContextType} from '@/contexts/AuthContext';
import {createMockUser, mockUsers} from '@/test/fixtures';

const renderWithAuth = (
  ui: React.ReactElement,
  authValue: AuthContextType,
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

const createAuthValue = (overrides?: Partial<AuthContextType>): AuthContextType => ({
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
        user: createMockUser({roles: []}),
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
        user: mockUsers.admin,
        accessToken: 'token',
        hasRole: vi.fn().mockReturnValue(true),
      });

      renderWithAuth(
        <ProtectedRoute requiredRole="ROLE_ADMIN">
          <div>Admin Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(authValue.hasRole).toHaveBeenCalledWith('ROLE_ADMIN');
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should show Access Denied when user lacks required role', () => {
      const authValue = createAuthValue({
        isAuthenticated: true,
        user: mockUsers.sales,
        accessToken: 'token',
        hasRole: vi.fn().mockReturnValue(false),
      });

      renderWithAuth(
        <ProtectedRoute requiredRole="ROLE_ADMIN">
          <div>Admin Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(authValue.hasRole).toHaveBeenCalledWith('ROLE_ADMIN');
      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('role-based access with requiredRoles', () => {
    it('should render children when user has at least one of required roles', () => {
      const authValue = createAuthValue({
        isAuthenticated: true,
        user: mockUsers.sales,
        accessToken: 'token',
        hasAnyRole: vi.fn().mockReturnValue(true),
      });

      renderWithAuth(
        <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_SALES']}>
          <div>Multi-Role Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(authValue.hasAnyRole).toHaveBeenCalledWith(['ROLE_ADMIN', 'ROLE_SALES']);
      expect(screen.getByText('Multi-Role Content')).toBeInTheDocument();
    });

    it('should show Access Denied when user has none of required roles', () => {
      const authValue = createAuthValue({
        isAuthenticated: true,
        user: mockUsers.sales,
        accessToken: 'token',
        hasAnyRole: vi.fn().mockReturnValue(false),
      });

      renderWithAuth(
        <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_FINANCE']}>
          <div>Admin/Finance Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(authValue.hasAnyRole).toHaveBeenCalledWith(['ROLE_ADMIN', 'ROLE_FINANCE']);
      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      expect(screen.queryByText('Admin/Finance Content')).not.toBeInTheDocument();
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
        user: mockUsers.sales,
        accessToken: 'token',
        hasRole: vi.fn().mockReturnValue(false),
      });

      renderWithAuth(
        <ProtectedRoute requiredRole="ROLE_ADMIN">
          <div>Admin Content</div>
        </ProtectedRoute>,
        authValue,
        ['/protected'],
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument();
      expect(screen.getByText(/Required role:/i)).toBeInTheDocument();
      expect(screen.getByText('ROLE_ADMIN')).toBeInTheDocument();
    });
  });
});
