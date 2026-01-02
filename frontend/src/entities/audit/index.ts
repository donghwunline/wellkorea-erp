/**
 * Audit Entity - Public API.
 *
 * This is the ONLY entry point for importing from the audit entity.
 * Internal modules (model/, api/, query/) should never be imported directly.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 *
 * @see docs/architecture/fsd-public-api-guidelines.md
 */

// =============================================================================
// DOMAIN TYPES
// Types that appear in component props, state, or function signatures
// =============================================================================

export type { AuditLog } from './model/audit-log';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic
// =============================================================================

export { auditLogRules } from './model/audit-log';

// =============================================================================
// QUERY FACTORY (TanStack Query v5 pattern)
// Primary data access interface - use with useQuery() directly
// =============================================================================

export { auditQueries, type AuditListQueryParams } from './api/audit.queries';

// =============================================================================
// QUERY HOOKS (Legacy - prefer auditQueries above)
// =============================================================================

export { useAuditLogs } from './query/use-audit-logs';
export type { UseAuditLogsOptions, UseAuditLogsParams } from './query/use-audit-logs';

export { useAuditLog } from './query/use-audit-log';
export type { UseAuditLogOptions } from './query/use-audit-log';

// Query keys for cache invalidation (Legacy - use auditQueries.lists() etc.)
export { auditQueryKeys } from './query/query-keys';
export { auditQueryFns, type AuditLogListParams, type PaginatedAuditLogs } from './query/query-fns';

// =============================================================================
// API ACCESS (for features layer mutations only)
// =============================================================================

export { auditApi } from './api/audit.api';
export { auditLogMapper } from './api/audit.mapper';
export type { AuditLogDTO, AuditLogListParamsDTO } from './api/audit.dto';
