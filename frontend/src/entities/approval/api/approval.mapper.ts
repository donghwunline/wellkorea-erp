/**
 * Approval Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 */

import type { Approval, ApprovalListItem } from '../model/approval';
import type { ApprovalLevel } from '../model/approval-level';
import type { ApprovalHistory, ApprovalHistoryAction } from '../model/approval-history';
import type { ApprovalStatus } from '../model/approval-status';
import type { EntityType } from '../model/entity-type';

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Command result from CQRS command endpoints.
 */
export interface CommandResult {
  id: number;
  message: string;
}

/**
 * Level decision from API response.
 */
export interface LevelDecisionResponse {
  levelOrder: number;
  levelName: string;
  expectedApproverUserId: number;
  expectedApproverName: string;
  decision: string; // Will be cast to ApprovalStatus
  decidedByUserId: number | null;
  decidedByName: string | null;
  decidedAt: string | null;
  comments: string | null;
}

/**
 * Approval details from API response.
 */
export interface ApprovalDetailsResponse {
  id: number;
  entityType: string; // Will be cast to EntityType
  entityId: number;
  entityDescription: string | null;
  currentLevel: number;
  totalLevels: number;
  status: string; // Will be cast to ApprovalStatus
  submittedById: number;
  submittedByName: string;
  submittedAt: string;
  completedAt: string | null;
  createdAt: string;
  levels: LevelDecisionResponse[] | null;
}

/**
 * Approval history entry from API response.
 */
export interface ApprovalHistoryResponse {
  id: number;
  levelOrder: number | null;
  levelName: string | null;
  action: string; // Will be cast to ApprovalHistoryAction
  actorId: number;
  actorName: string;
  comments: string | null;
  createdAt: string;
}

/**
 * Query parameters for listing approvals.
 */
export interface ApprovalListParams {
  page?: number;
  size?: number;
  entityType?: string;
  status?: string;
  myPending?: boolean;
}

// =============================================================================
// MAPPERS
// =============================================================================

/**
 * Approval level mapper.
 */
export const approvalLevelMapper = {
  /**
   * Map API response to domain model.
   */
  toDomain(response: LevelDecisionResponse): ApprovalLevel {
    return {
      levelOrder: response.levelOrder,
      levelName: response.levelName.trim(),
      expectedApproverUserId: response.expectedApproverUserId,
      expectedApproverName: response.expectedApproverName.trim(),
      decision: response.decision as ApprovalStatus,
      decidedByUserId: response.decidedByUserId,
      decidedByName: response.decidedByName?.trim() ?? null,
      decidedAt: response.decidedAt,
      comments: response.comments?.trim() ?? null,
    };
  },
};

/**
 * Approval mapper.
 */
export const approvalMapper = {
  /**
   * Map API response to domain model.
   */
  toDomain(response: ApprovalDetailsResponse): Approval {
    const levels = response.levels?.map(approvalLevelMapper.toDomain) ?? null;

    return {
      id: response.id,
      entityType: response.entityType as EntityType,
      entityId: response.entityId,
      entityDescription: response.entityDescription?.trim() ?? null,
      currentLevel: response.currentLevel,
      totalLevels: response.totalLevels,
      status: response.status as ApprovalStatus,
      submittedById: response.submittedById,
      submittedByName: response.submittedByName.trim(),
      submittedAt: response.submittedAt,
      completedAt: response.completedAt,
      createdAt: response.createdAt,
      levels,
    };
  },

  /**
   * Map domain model to list item (lighter version for lists).
   */
  toListItem(approval: Approval): ApprovalListItem {
    return {
      id: approval.id,
      entityType: approval.entityType,
      entityId: approval.entityId,
      entityDescription: approval.entityDescription,
      currentLevel: approval.currentLevel,
      totalLevels: approval.totalLevels,
      status: approval.status,
      submittedByName: approval.submittedByName,
      submittedAt: approval.submittedAt,
    };
  },

  /**
   * Map response directly to list item (skip full domain conversion).
   */
  responseToListItem(response: ApprovalDetailsResponse): ApprovalListItem {
    return {
      id: response.id,
      entityType: response.entityType as EntityType,
      entityId: response.entityId,
      entityDescription: response.entityDescription?.trim() ?? null,
      currentLevel: response.currentLevel,
      totalLevels: response.totalLevels,
      status: response.status as ApprovalStatus,
      submittedByName: response.submittedByName.trim(),
      submittedAt: response.submittedAt,
    };
  },
};

/**
 * Approval history mapper.
 */
export const approvalHistoryMapper = {
  /**
   * Map API response to domain model.
   */
  toDomain(response: ApprovalHistoryResponse): ApprovalHistory {
    return {
      id: response.id,
      levelOrder: response.levelOrder,
      levelName: response.levelName?.trim() ?? null,
      action: response.action as ApprovalHistoryAction,
      actorId: response.actorId,
      actorName: response.actorName.trim(),
      comments: response.comments?.trim() ?? null,
      createdAt: response.createdAt,
    };
  },
};
