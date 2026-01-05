/**
 * Approval level domain model.
 *
 * Represents a single level/step in the approval workflow.
 */

import type { ApprovalStatus } from './approval-status';

/**
 * Approval level decision.
 *
 * Represents the state of a single approval level within an approval request.
 * Immutable data structure - use functions from `approvalLevelRules` for operations.
 */
export interface ApprovalLevel {
  /** Position in the approval chain (1-indexed) */
  readonly levelOrder: number;

  /** Display name for this level (e.g., "Manager Approval", "Finance Approval") */
  readonly levelName: string;

  /** User ID of the expected approver for this level */
  readonly expectedApproverUserId: number;

  /** Display name of the expected approver */
  readonly expectedApproverName: string;

  /** Current decision status for this level */
  readonly decision: ApprovalStatus;

  /** User ID who actually made the decision (null if pending) */
  readonly decidedByUserId: number | null;

  /** Display name of the user who made the decision */
  readonly decidedByName: string | null;

  /** ISO datetime when the decision was made */
  readonly decidedAt: string | null;

  /** Comments provided with the decision */
  readonly comments: string | null;
}

/**
 * Pure functions for approval level business rules.
 */
export const approvalLevelRules = {
  /**
   * Check if level has been decided (approved or rejected).
   */
  isDecided(level: ApprovalLevel): boolean {
    return level.decision !== 'PENDING';
  },

  /**
   * Check if level is approved.
   */
  isApproved(level: ApprovalLevel): boolean {
    return level.decision === 'APPROVED';
  },

  /**
   * Check if level is rejected.
   */
  isRejected(level: ApprovalLevel): boolean {
    return level.decision === 'REJECTED';
  },

  /**
   * Check if level is pending.
   */
  isPending(level: ApprovalLevel): boolean {
    return level.decision === 'PENDING';
  },

  /**
   * Get display name for the approver.
   * Shows the actual decision maker if decided, otherwise expected approver.
   */
  getApproverDisplayName(level: ApprovalLevel): string {
    return level.decidedByName ?? level.expectedApproverName;
  },

  /**
   * Check if level has comments.
   */
  hasComments(level: ApprovalLevel): boolean {
    return level.comments !== null && level.comments.trim().length > 0;
  },
};
