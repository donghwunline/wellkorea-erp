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

export type { AuditLog } from './model';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic
// =============================================================================

export { auditLogRules } from './model';

// =============================================================================
// QUERY HOOKS
// Main data access interface - prefer these over direct API calls
// =============================================================================

export { useAuditLogs, useAuditLog } from './query';

// Query keys for cache invalidation
export { auditQueryKeys } from './query';
