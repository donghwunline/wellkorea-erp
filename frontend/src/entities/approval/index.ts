/**
 * Approval Entity - Public API.
 *
 * This is the ONLY entry point for importing from the approval entity.
 * Internal modules (model/, api/, query/, ui/) should never be imported directly.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 *
 * Note: Mutations (approve, reject) are in features/approval/
 *
 * @see docs/architecture/fsd-public-api-guidelines.md
 */

// =============================================================================
// DOMAIN TYPES
// Types that appear in component props, state, or function signatures
// =============================================================================

export type {
  ApprovalStatus,
  EntityType,
  ApprovalLevel,
  Approval,
  ApprovalHistory,
} from './model';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic
// =============================================================================

export { approvalRules } from './model';

// =============================================================================
// QUERY HOOKS
// Main data access interface - prefer these over direct API calls
// =============================================================================

export { useApproval, useApprovals, useApprovalHistory } from './query';

// Query keys for cache invalidation (used by features for mutations)
export { approvalQueryKeys } from './query';

// =============================================================================
// UI COMPONENTS
// Display-only components with no side effects
// =============================================================================

export {
  ApprovalStatusBadge,
  ApprovalProgressBar,
  ApprovalLevelList,
  ApprovalRequestCard,
} from './ui';

// =============================================================================
// API ACCESS (for features layer mutations only)
// These are needed by features/approval/* for approve/reject operations
// =============================================================================

export { approvalApi } from './api';
export type { CommandResult } from './api';
