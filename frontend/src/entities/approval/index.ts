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

export { ApprovalStatus } from './model/approval-status';
export type { StatusConfig, BadgeColor } from './model/approval-status';

export { EntityType } from './model/entity-type';
export type { EntityTypeConfig } from './model/entity-type';

export type { ApprovalLevel } from './model/approval-level';

export type { Approval, ApprovalListItem } from './model/approval';

export type { ApprovalHistory } from './model/approval-history';
export { ApprovalHistoryAction } from './model/approval-history';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic
// =============================================================================

export { approvalRules } from './model/approval';
export { approvalLevelRules } from './model/approval-level';
export { approvalHistoryRules } from './model/approval-history';
export { ApprovalStatusConfig, getStatusLabel, getStatusColor } from './model/approval-status';
export { EntityTypeConfigs, getEntityTypeLabel } from './model/entity-type';

// =============================================================================
// QUERY FACTORY (TanStack Query v5 pattern)
// Primary data access interface - use with useQuery() directly
// =============================================================================

export { approvalQueries, type ApprovalListQueryParams } from './api/approval.queries';

// =============================================================================
// COMMAND FUNCTIONS
// Use with useMutation() directly
// =============================================================================

export {
  approveApproval,
  type ApproveApprovalInput,
  type ApprovalCommandResult,
} from './api/approve-approval';
export { rejectApproval, type RejectApprovalInput } from './api/reject-approval';

// =============================================================================
// UI COMPONENTS
// Display-only components with no side effects
// =============================================================================

export { ApprovalStatusBadge } from './ui/ApprovalStatusBadge';
export type { ApprovalStatusBadgeProps } from './ui/ApprovalStatusBadge';

export { ApprovalProgressBar } from './ui/ApprovalProgressBar';
export type { ApprovalProgressBarProps } from './ui/ApprovalProgressBar';

export { ApprovalLevelList } from './ui/ApprovalLevelList';
export type { ApprovalLevelListProps } from './ui/ApprovalLevelList';

export { ApprovalRequestCard } from './ui/ApprovalRequestCard';
export type { ApprovalRequestCardProps } from './ui/ApprovalRequestCard';

// =============================================================================
// LEGACY EXPORTS (deprecated - to be removed after migration)
// =============================================================================

/** @deprecated Use approvalQueries with useQuery directly */
export { useApproval } from './query/use-approval';
export type { UseApprovalOptions } from './query/use-approval';

/** @deprecated Use approvalQueries with useQuery directly */
export { useApprovals } from './query/use-approvals';
export type { UseApprovalsParams, UseApprovalsOptions } from './query/use-approvals';

/** @deprecated Use approvalQueries with useQuery directly */
export { useApprovalHistory } from './query/use-approval-history';
export type { UseApprovalHistoryOptions } from './query/use-approval-history';
