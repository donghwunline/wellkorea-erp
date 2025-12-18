/**
 * API endpoint path constants.
 *
 * Centralizes all API endpoint paths for:
 * - Easy maintenance and updates
 * - Consistent path usage across services
 * - Type-safe endpoint references
 */

// ============================================================================
// Auth Endpoints
// ============================================================================

export const AUTH_ENDPOINTS = {
  /** POST /auth/login - Authenticate user */
  LOGIN: '/auth/login',
  /** POST /auth/logout - Logout user */
  LOGOUT: '/auth/logout',
  /** GET /auth/me - Get current user info */
  ME: '/auth/me',
  /** POST /auth/refresh - Refresh access token */
  REFRESH: '/auth/refresh',
} as const;

// ============================================================================
// User Endpoints
// ============================================================================

export const USER_ENDPOINTS = {
  /** Base path for user operations */
  BASE: '/users',

  /** GET/PUT/DELETE /users/:id */
  byId: (id: number) => `/users/${id}`,
  /** PUT /users/:id/roles */
  roles: (id: number) => `/users/${id}/roles`,
  /** PUT /users/:id/password */
  password: (id: number) => `/users/${id}/password`,
  /** POST /users/:id/activate */
  activate: (id: number) => `/users/${id}/activate`,
  /** GET/PUT /users/:id/customers */
  customers: (id: number) => `/users/${id}/customers`,
} as const;

// ============================================================================
// Audit Endpoints
// ============================================================================

export const AUDIT_ENDPOINTS = {
  /** Base path for audit operations */
  BASE: '/audit',

  /** GET /audit/:id */
  byId: (id: number) => `/audit/${id}`,
} as const;
