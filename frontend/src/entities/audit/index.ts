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
// API ACCESS (for features layer mutations only)
// =============================================================================

// =============================================================================
// UI COMPONENTS
// Display-only components with no side effects
// =============================================================================

export {
  AuditLogTable,
  AuditLogTableSkeleton,
  type AuditLogTableProps,
} from './ui/AuditLogTable';

