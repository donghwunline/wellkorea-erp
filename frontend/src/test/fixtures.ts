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
 * const customUser = createMockUser({ roles: ['ROLE_ADMIN', 'ROLE_FINANCE'] });
 * ```
 */

// Import UserDetails for the fixture factory
import type { RoleName, User, UserDetails } from '@/shared/types/auth';
import type { AuthStore } from '@/stores/authStore';

/**
 * Authentication state for test fixtures.
 * Derived from AuthStore to stay in sync with the actual store.
 */
type AuthState = Pick<AuthStore, 'user' | 'accessToken' | 'isAuthenticated' | 'isLoading'>;

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
 *   roles: ['ROLE_ADMIN', 'ROLE_SALES']
 * });
 * ```
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 1,
  username: 'testuser',
  email: 'testuser@example.com',
  fullName: 'Test User',
  roles: ['ROLE_SALES'],
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
    roles: ['ROLE_ADMIN'],
  }),

  /**
   * Finance user for financial operations
   */
  finance: createMockUser({
    id: 2,
    username: 'finance',
    email: 'finance@example.com',
    fullName: 'Finance User',
    roles: ['ROLE_FINANCE'],
  }),

  /**
   * Sales user for quotations and customer management
   */
  sales: createMockUser({
    id: 3,
    username: 'alice',
    email: 'alice@example.com',
    fullName: 'Alice Sales',
    roles: ['ROLE_SALES'],
  }),

  /**
   * Production user for manufacturing operations
   */
  production: createMockUser({
    id: 4,
    username: 'production',
    email: 'production@example.com',
    fullName: 'Production User',
    roles: ['ROLE_PRODUCTION'],
  }),

  /**
   * User with multiple roles for testing role combinations
   */
  multiRole: createMockUser({
    id: 5,
    username: 'charlie',
    email: 'charlie@example.com',
    fullName: 'Charlie Multi',
    roles: ['ROLE_ADMIN', 'ROLE_SALES'],
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
 * Factory function to create a mock UserDetails with sensible defaults.
 * All fields can be overridden via the optional parameter.
 *
 * @param overrides - Partial UserDetails object to override defaults
 * @returns Complete UserDetails object with defaults + overrides
 *
 * @example
 * ```typescript
 * const activeUser = createMockUserDetails({ isActive: true });
 * const inactiveUser = createMockUserDetails({ isActive: false });
 * ```
 */
export const createMockUserDetails = (overrides?: Partial<UserDetails>): UserDetails => ({
  id: 1,
  username: 'testuser',
  email: 'testuser@example.com',
  fullName: 'Test User',
  isActive: true,
  roles: ['ROLE_SALES'],
  createdAt: '2025-01-01T00:00:00Z',
  lastLoginAt: '2025-01-15T10:30:00Z',
  ...overrides,
});

/**
 * Pre-configured UserDetails fixtures for common test scenarios.
 *
 * Available fixtures:
 * - adminUser: Active admin user
 * - financeUser: Active finance user
 * - salesUser: Active sales user
 * - productionUser: Active production user
 * - multiRoleUser: User with multiple roles
 * - inactiveUser: Deactivated user
 * - neverLoggedIn: User who has never logged in
 */
export const mockUserDetails = {
  /**
   * Admin user with full system access
   */
  adminUser: createMockUserDetails({
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    fullName: 'Admin User',
    roles: ['ROLE_ADMIN'],
  }),

  /**
   * Finance user for financial operations
   */
  financeUser: createMockUserDetails({
    id: 2,
    username: 'finance',
    email: 'finance@example.com',
    fullName: 'Finance User',
    roles: ['ROLE_FINANCE'],
  }),

  /**
   * Sales user for quotations and customer management
   */
  salesUser: createMockUserDetails({
    id: 3,
    username: 'alice',
    email: 'alice@example.com',
    fullName: 'Alice Sales',
    roles: ['ROLE_SALES'],
  }),

  /**
   * Production user for manufacturing operations
   */
  productionUser: createMockUserDetails({
    id: 4,
    username: 'production',
    email: 'production@example.com',
    fullName: 'Production User',
    roles: ['ROLE_PRODUCTION'],
  }),

  /**
   * User with multiple roles for testing role combinations
   */
  multiRoleUser: createMockUserDetails({
    id: 5,
    username: 'charlie',
    email: 'charlie@example.com',
    fullName: 'Charlie Multi',
    roles: ['ROLE_ADMIN', 'ROLE_SALES'],
  }),

  /**
   * Inactive/deactivated user
   */
  inactiveUser: createMockUserDetails({
    id: 6,
    username: 'inactive',
    email: 'inactive@example.com',
    fullName: 'Inactive User',
    isActive: false,
    roles: ['ROLE_SALES'],
  }),

  /**
   * User who has never logged in
   */
  neverLoggedIn: createMockUserDetails({
    id: 7,
    username: 'newuser',
    email: 'newuser@example.com',
    fullName: 'New User',
    lastLoginAt: null,
  }),
};

/**
 * Re-export types for convenience in test files
 */
export type { User, RoleName, AuthState };

export type { UserDetails };
