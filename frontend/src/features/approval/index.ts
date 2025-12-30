/**
 * Approval Features - Public API.
 *
 * Feature modules for approval actions.
 * Each feature is an isolated user action.
 */

// Approve feature
export { useApproveApproval } from './approve';
export type { ApproveApprovalInput, UseApproveApprovalOptions } from './approve';

// Reject feature
export { useRejectApproval, RejectModal } from './reject';
export type { RejectApprovalInput, UseRejectApprovalOptions, RejectModalProps } from './reject';
