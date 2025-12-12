/**
 * API Services barrel export.
 *
 * Usage:
 * ```typescript
 * import { authApi, userApi, auditApi } from '@/services';
 *
 * // Login
 * const response = await authApi.login({ username, password });
 *
 * // Get users
 * const { data: users, pagination } = await userApi.getUsers({ page: 0, size: 10 });
 *
 * // Get audit logs
 * const { data: logs, pagination } = await auditApi.getAuditLogs({ username: 'admin' });
 * ```
 */

// Domain-specific API services
export {authApi} from './authApi';
export {userApi, type UserListParams} from './userApi';
export {auditApi, type AuditLogEntry, type AuditLogListParams} from './auditApi';

// Generic API service (for custom/one-off requests)
export {default as apiService, type PaginatedResponse, type PaginationMetadata} from './apiService';

// Low-level axios instance (rarely needed directly)
export {default as api} from './api';
