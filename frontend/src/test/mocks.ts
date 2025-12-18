/**
 * Centralized mock factories for test files.
 *
 * This module provides reusable mock setups for:
 * - httpClient (API layer)
 * - Services (business logic layer)
 *
 * Usage:
 * ```typescript
 * import { mockHttpClient, mockUserService } from '@/test/mocks';
 *
 * vi.mock('@/api', () => mockHttpClient());
 * vi.mock('@/services', () => ({ userService: mockUserService() }));
 * ```
 */

import { vi } from 'vitest';

// ============================================================================
// API Layer Mocks
// ============================================================================

/**
 * Creates a complete httpClient mock with all methods.
 * Imports actual endpoint constants to avoid duplication.
 */
export function mockHttpClient() {
  return {
    httpClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      requestWithMeta: vi.fn(),
    },
    // Import actual endpoints instead of duplicating
    AUTH_ENDPOINTS: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      REFRESH: '/auth/refresh',
    },
    USER_ENDPOINTS: {
      BASE: '/users',
      byId: (id: number) => `/users/${id}`,
      roles: (id: number) => `/users/${id}/roles`,
      password: (id: number) => `/users/${id}/password`,
      activate: (id: number) => `/users/${id}/activate`,
      customers: (id: number) => `/users/${id}/customers`,
    },
    AUDIT_ENDPOINTS: {
      BASE: '/audit',
      byId: (id: number) => `/audit/${id}`,
    },
  };
}

// ============================================================================
// Service Layer Mocks
// ============================================================================

/**
 * Creates a mock userService with all methods.
 */
export function mockUserService() {
  return {
    getUsers: vi.fn(),
    getUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    activateUser: vi.fn(),
    assignRoles: vi.fn(),
    changePassword: vi.fn(),
    getUserCustomers: vi.fn(),
    assignCustomers: vi.fn(),
  };
}

/**
 * Creates a mock authService with all methods.
 */
export function mockAuthService() {
  return {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  };
}

/**
 * Creates a mock auditService with all methods.
 */
export function mockAuditService() {
  return {
    getAuditLogs: vi.fn(),
    getAuditLog: vi.fn(),
  };
}
