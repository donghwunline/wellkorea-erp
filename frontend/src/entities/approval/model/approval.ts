/**
 * Approval domain model.
 *
 * Core domain model representing an approval request in the workflow system.
 */

import type { ApprovalStatus } from './approval-status';
import type { EntityType } from './entity-type';
import type { ApprovalLevel } from './approval-level';
import { approvalLevelRules } from './approval-level';

/**
 * Approval request domain model.
 *
 * Represents a complete approval request with all level decisions.
 * Immutable data structure - use functions from `approvalRules` for operations.
 */
export interface Approval {
  /** Unique identifier */
  readonly id: number;

  /** Type of entity being approved */
  readonly entityType: EntityType;

  /** ID of the entity being approved (e.g., quotation ID) */
  readonly entityId: number;

  /** Description of the entity (e.g., job code) */
  readonly entityDescription: string | null;

  /** Current level in the approval chain (1-indexed) */
  readonly currentLevel: number;

  /** Total number of levels in the approval chain */
  readonly totalLevels: number;

  /** Overall status of the approval request */
  readonly status: ApprovalStatus;

  /** User ID who submitted for approval */
  readonly submittedById: number;

  /** Display name of the submitter */
  readonly submittedByName: string;

  /** ISO datetime when submitted */
  readonly submittedAt: string;

  /** ISO datetime when approval was completed (approved/rejected) */
  readonly completedAt: string | null;

  /** ISO datetime when created */
  readonly createdAt: string;

  /** All level decisions (may be null if not loaded) */
  readonly levels: readonly ApprovalLevel[] | null;
}

/**
 * Approval list item for summary views.
 *
 * Lighter version of Approval without level details.
 */
export interface ApprovalListItem {
  readonly id: number;
  readonly entityType: EntityType;
  readonly entityId: number;
  readonly entityDescription: string | null;
  readonly currentLevel: number;
  readonly totalLevels: number;
  readonly status: ApprovalStatus;
  readonly submittedByName: string;
  readonly submittedAt: string;
}

/**
 * Pure functions for approval business rules.
 */
export const approvalRules = {
  // ==================== COMPUTED VALUES ====================

  /**
   * Get the current level decision.
   * Returns null if no levels loaded or current level not found.
   */
  getCurrentLevel(approval: Approval): ApprovalLevel | null {
    if (!approval.levels) return null;
    return approval.levels.find((l) => l.levelOrder === approval.currentLevel) ?? null;
  },

  /**
   * Get all completed levels (approved or rejected).
   */
  getCompletedLevels(approval: Approval): readonly ApprovalLevel[] {
    if (!approval.levels) return [];
    return approval.levels.filter(approvalLevelRules.isDecided);
  },

  /**
   * Get all pending levels.
   */
  getPendingLevels(approval: Approval): readonly ApprovalLevel[] {
    if (!approval.levels) return [];
    return approval.levels.filter(approvalLevelRules.isPending);
  },

  /**
   * Calculate approval progress percentage (0-100).
   */
  getProgressPercentage(approval: Approval): number {
    if (approval.totalLevels === 0) return 0;
    const completedCount = this.getCompletedLevels(approval).length;
    return Math.round((completedCount / approval.totalLevels) * 100);
  },

  /**
   * Get the latest comment from any level.
   */
  getLatestComment(approval: Approval): string | null {
    if (!approval.levels) return null;
    const levelsWithComments = approval.levels
      .filter(approvalLevelRules.hasComments)
      .sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? ''));

    return levelsWithComments[0]?.comments ?? null;
  },

  // ==================== STATUS CHECKS ====================

  /**
   * Check if approval is pending (not yet completed).
   */
  isPending(approval: Approval): boolean {
    return approval.status === 'PENDING';
  },

  /**
   * Check if approval is approved (completed successfully).
   */
  isApproved(approval: Approval): boolean {
    return approval.status === 'APPROVED';
  },

  /**
   * Check if approval is rejected.
   */
  isRejected(approval: Approval): boolean {
    return approval.status === 'REJECTED';
  },

  /**
   * Check if approval is in a terminal state (approved or rejected).
   */
  isTerminal(approval: Approval): boolean {
    return this.isApproved(approval) || this.isRejected(approval);
  },

  // ==================== PERMISSION CHECKS ====================

  /**
   * Check if a user can act on (approve/reject) this approval.
   *
   * @param approval - Approval request
   * @param userId - User ID to check
   */
  canAct(approval: Approval, userId: number): boolean {
    if (!this.isPending(approval)) return false;
    const currentLevel = this.getCurrentLevel(approval);
    if (!currentLevel) return false;
    return currentLevel.expectedApproverUserId === userId;
  },

  /**
   * Check if user can approve this approval.
   * Alias for canAct - both approve and reject have same permission.
   */
  canApprove(approval: Approval, userId: number): boolean {
    return this.canAct(approval, userId);
  },

  /**
   * Check if user can reject this approval.
   * Alias for canAct - both approve and reject have same permission.
   */
  canReject(approval: Approval, userId: number): boolean {
    return this.canAct(approval, userId);
  },

  // ==================== DISPLAY HELPERS ====================

  /**
   * Check if approval has multiple levels.
   */
  isMultiLevel(approval: Approval): boolean {
    return approval.totalLevels > 1;
  },

  /**
   * Check if approval is on the final level.
   */
  isFinalLevel(approval: Approval): boolean {
    return approval.currentLevel === approval.totalLevels;
  },

  /**
   * Get display text for progress (e.g., "Level 2 of 3").
   */
  getProgressText(approval: Approval): string {
    return `Level ${approval.currentLevel} of ${approval.totalLevels}`;
  },
};
