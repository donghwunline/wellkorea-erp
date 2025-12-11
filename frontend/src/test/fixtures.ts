/**
 * Shared test fixtures for authentication and authorization testing.
 *
 * This module provides pre-configured mock data and factory functions
 * to eliminate duplication across test files and ensure consistency.
 *
 * Usage:
 * ```typescript
 * import { mockUsers, createMockUser } from '@/test/fixtures';
 *
 * // Use pre-configured fixtures
 * const adminUser = mockUsers.admin;
 *
 * // Or create custom users
 * const customUser = createMockUser({ roles: ['ADMIN', 'FINANCE'] });
 * ```
 */

import type {User, RoleName, AuthState} from '@/types/auth';

/**
 * Factory function to create a mock User with sensible defaults.
 * All fields can be overridden via the optional parameter.
 *
 * @param overrides - Partial User object to override defaults
 * @returns Complete User object with defaults + overrides
 *
 * @example
 * ```typescript
 * const customUser = createMockUser({
 *   username: 'john',
 *   roles: ['ADMIN', 'SALES']
 * });
 * ```
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 1,
  username: 'testuser',
  email: 'testuser@example.com',
  fullName: 'Test User',
  roles: ['SALES'],
  ...overrides,
});

/**
 * Pre-configured user fixtures for common test scenarios.
 * Each fixture represents a user with a specific role or combination of roles.
 *
 * Available fixtures:
 * - admin: User with ADMIN role
 * - finance: User with FINANCE role
 * - sales: User with SALES role
 * - production: User with PRODUCTION role
 * - multiRole: User with both ADMIN and FINANCE roles
 */
export const mockUsers = {
  /**
   * Admin user with full system access
   */
  admin: createMockUser({
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    fullName: 'Admin User',
    roles: ['ADMIN'],
  }),

  /**
   * Finance user for financial operations
   */
  finance: createMockUser({
    id: 2,
    username: 'finance',
    email: 'finance@example.com',
    fullName: 'Finance User',
    roles: ['FINANCE'],
  }),

  /**
   * Sales user for quotations and customer management
   */
  sales: createMockUser({
    id: 3,
    username: 'alice',
    email: 'alice@example.com',
    fullName: 'Alice Sales',
    roles: ['SALES'],
  }),

  /**
   * Production user for manufacturing operations
   */
  production: createMockUser({
    id: 4,
    username: 'production',
    email: 'production@example.com',
    fullName: 'Production User',
    roles: ['PRODUCTION'],
  }),

  /**
   * User with multiple roles for testing role combinations
   */
  multiRole: createMockUser({
    id: 5,
    username: 'charlie',
    email: 'charlie@example.com',
    fullName: 'Charlie Multi',
    roles: ['ADMIN', 'SALES'],
  }),
};

/**
 * Factory function to create a mock AuthState with sensible defaults.
 * All fields can be overridden via the optional parameter.
 *
 * @param overrides - Partial AuthState object to override defaults
 * @returns Complete AuthState object with defaults + overrides
 *
 * @example
 * ```typescript
 * const loadingState = createMockAuthState({
 *   isLoading: true
 * });
 * ```
 */
export const createMockAuthState = (overrides?: Partial<AuthState>): AuthState => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  ...overrides,
});

/**
 * Pre-configured auth state fixtures for common test scenarios.
 *
 * Available fixtures:
 * - unauthenticated: No user logged in
 * - authenticated: Admin user logged in with token
 * - authenticatedSales: Sales user logged in with token
 * - loading: Authentication in progress
 */
export const mockAuthStates = {
  /**
   * Unauthenticated state - no user logged in
   */
  unauthenticated: createMockAuthState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  /**
   * Authenticated state - admin user logged in
   */
  authenticated: createMockAuthState({
    user: mockUsers.admin,
    accessToken: 'mock-token-123',
    isAuthenticated: true,
    isLoading: false,
  }),

  /**
   * Authenticated state - sales user logged in
   */
  authenticatedSales: createMockAuthState({
    user: mockUsers.sales,
    accessToken: 'mock-token-456',
    isAuthenticated: true,
    isLoading: false,
  }),

  /**
   * Loading state - authentication in progress
   */
  loading: createMockAuthState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  }),
};

/**
 * Re-export types for convenience in test files
 */
export type {User, RoleName, AuthState};
