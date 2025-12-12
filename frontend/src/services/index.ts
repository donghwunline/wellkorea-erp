/**
 * Services barrel export.
 * Exports all domain services and utilities.
 *
 * Usage:
 * ```typescript
 * import { authService, userService, auditService } from '@/services';
 *
 * // Login
 * const response = await authService.login({ username, password });
 *
 * // Get users
 * const { data: users, pagination } = await userService.getUsers({ page: 0, size: 10 });
 *
 * // Get audit logs
 * const { data: logs, pagination } = await auditService.getAuditLogs({ username: 'admin' });
 * ```
 */

// Auth service
export { authService, authEvents } from './auth/authService';
export type { AuthEvent } from './auth/authService';
export type { LoginRequest, LoginResponse, User, RoleName } from './auth/types';

// User service
export { userService } from './users/userService';
export type {
  UserDetails,
  UserListParams,
  PaginatedUsers,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRolesRequest,
  ChangePasswordRequest,
} from './users/types';

// Audit service
export { auditService } from './audit/auditService';
export type { AuditLogEntry, AuditLogListParams, PaginatedAuditLogs } from './audit/types';

// Error utilities
export {
  getErrorMessage,
  getErrorDisplayStrategy,
  isValidationError,
  isAuthenticationError,
  isAuthorizationError,
  isAuthError,
  isBusinessError,
  isServerError,
  isNotFoundError,
} from './errorMessage';

// DEPRECATED: Old API layer exports (for backward compatibility during migration)
// TODO: Remove these once all components are migrated to new services
export { authApi } from './authApi';
export { userApi } from './userApi';
export { auditApi } from './auditApi';
