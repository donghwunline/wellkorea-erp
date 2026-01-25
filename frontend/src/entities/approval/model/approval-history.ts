/**
 * Approval history domain model.
 *
 * Represents a single entry in the approval audit trail.
 */

/**
 * Approval history action types.
 * Const object pattern provides both type safety and runtime values.
 */
export const ApprovalHistoryAction = {
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ApprovalHistoryAction =
  (typeof ApprovalHistoryAction)[keyof typeof ApprovalHistoryAction];

/**
 * Approval history entry domain model.
 *
 * Represents a single action in the approval audit trail.
 */
export interface ApprovalHistory {
  /** Level order where action occurred (null for submission) */
  readonly levelOrder: number | null;

  /** Level name where action occurred */
  readonly levelName: string | null;

  /** Action type */
  readonly action: ApprovalHistoryAction;

  /** User ID who performed the action */
  readonly actorId: number;

  /** Display name of the actor */
  readonly actorName: string;

  /** Comments provided with the action */
  readonly comments: string | null;

  /** ISO datetime when the action occurred */
  readonly createdAt: string;
}

/**
 * Pure functions for approval history.
 */
export const approvalHistoryRules = {
  /**
   * Check if history entry has comments.
   */
  hasComments(entry: ApprovalHistory): boolean {
    return entry.comments !== null && entry.comments.trim().length > 0;
  },

  /**
   * Get action display label.
   *
   * @param action - History action type
   * @param korean - Use Korean label (default: true)
   */
  getActionLabel(action: ApprovalHistoryAction, korean = true): string {
    const labels: Record<ApprovalHistoryAction, { en: string; ko: string }> = {
      SUBMITTED: { en: 'Submitted', ko: '제출됨' },
      APPROVED: { en: 'Approved', ko: '승인됨' },
      REJECTED: { en: 'Rejected', ko: '반려됨' },
    };
    return korean ? labels[action].ko : labels[action].en;
  },

  /**
   * Check if action is a submission.
   */
  isSubmission(entry: ApprovalHistory): boolean {
    return entry.action === 'SUBMITTED';
  },

  /**
   * Check if action is an approval.
   */
  isApproval(entry: ApprovalHistory): boolean {
    return entry.action === 'APPROVED';
  },

  /**
   * Check if action is a rejection.
   */
  isRejection(entry: ApprovalHistory): boolean {
    return entry.action === 'REJECTED';
  },
};
