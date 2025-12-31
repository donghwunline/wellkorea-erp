/**
 * Audit Entity - Public API.
 *
 * Exports all public types, rules, and hooks for audit logs.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 */

// Model layer - Domain types and business rules
export type { AuditLog } from './model';
export { auditLogRules } from './model';

// API layer - For advanced use cases
export { auditApi, auditLogMapper } from './api';
export type { AuditLogDTO, AuditLogListParamsDTO } from './api';

// Query layer - TanStack Query hooks
export { auditQueryKeys, auditQueryFns, useAuditLogs, useAuditLog } from './query';
export type {
  AuditLogListParams,
  PaginatedAuditLogs,
  UseAuditLogsOptions,
  UseAuditLogsParams,
  UseAuditLogOptions,
} from './query';
