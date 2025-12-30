/**
 * Approval Query Layer - Public API.
 *
 * Exports query hooks, query keys, and query functions.
 */

// Query keys (for cache invalidation)
export { approvalQueryKeys } from './query-keys';

// Query functions (for prefetching, ensureQueryData)
export { approvalQueryFns } from './query-fns';
export type { ApprovalListParams, PaginatedApprovals } from './query-fns';

// Query hooks
export { useApproval } from './use-approval';
export type { UseApprovalOptions } from './use-approval';

export { useApprovals } from './use-approvals';
export type { UseApprovalsParams, UseApprovalsOptions } from './use-approvals';

export { useApprovalHistory } from './use-approval-history';
export type { UseApprovalHistoryOptions } from './use-approval-history';
