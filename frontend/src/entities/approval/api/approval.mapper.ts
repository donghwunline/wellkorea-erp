/**
 * Approval API mappers.
 *
 * Maps DTOs to domain models and vice versa.
 * Always normalize/trim strings from API responses.
 */

import type {
  Approval,
  ApprovalListItem,
  ApprovalLevel,
  ApprovalHistory,
  ApprovalStatus,
  EntityType,
  ApprovalHistoryAction,
} from '../model';
import type {
  ApprovalDetailsDTO,
  LevelDecisionDTO,
  ApprovalHistoryDTO,
} from './approval.dto';

/**
 * Approval level mapper.
 */
export const approvalLevelMapper = {
  /**
   * Map API DTO to domain model.
   */
  toDomain(dto: LevelDecisionDTO): ApprovalLevel {
    return {
      levelOrder: dto.levelOrder,
      levelName: dto.levelName.trim(),
      expectedApproverUserId: dto.expectedApproverUserId,
      expectedApproverName: dto.expectedApproverName.trim(),
      decision: dto.decision as ApprovalStatus,
      decidedByUserId: dto.decidedByUserId,
      decidedByName: dto.decidedByName?.trim() ?? null,
      decidedAt: dto.decidedAt,
      comments: dto.comments?.trim() ?? null,
    };
  },
};

/**
 * Approval mapper.
 */
export const approvalMapper = {
  /**
   * Map API DTO to domain model.
   */
  toDomain(dto: ApprovalDetailsDTO): Approval {
    const levels = dto.levels?.map(approvalLevelMapper.toDomain) ?? null;

    return {
      id: dto.id,
      entityType: dto.entityType as EntityType,
      entityId: dto.entityId,
      entityDescription: dto.entityDescription?.trim() ?? null,
      currentLevel: dto.currentLevel,
      totalLevels: dto.totalLevels,
      status: dto.status as ApprovalStatus,
      submittedById: dto.submittedById,
      submittedByName: dto.submittedByName.trim(),
      submittedAt: dto.submittedAt,
      completedAt: dto.completedAt,
      createdAt: dto.createdAt,
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
   * Map DTO directly to list item (skip full domain conversion).
   */
  dtoToListItem(dto: ApprovalDetailsDTO): ApprovalListItem {
    return {
      id: dto.id,
      entityType: dto.entityType as EntityType,
      entityId: dto.entityId,
      entityDescription: dto.entityDescription?.trim() ?? null,
      currentLevel: dto.currentLevel,
      totalLevels: dto.totalLevels,
      status: dto.status as ApprovalStatus,
      submittedByName: dto.submittedByName.trim(),
      submittedAt: dto.submittedAt,
    };
  },
};

/**
 * Approval history mapper.
 */
export const approvalHistoryMapper = {
  /**
   * Map API DTO to domain model.
   */
  toDomain(dto: ApprovalHistoryDTO): ApprovalHistory {
    return {
      id: dto.id,
      levelOrder: dto.levelOrder,
      levelName: dto.levelName?.trim() ?? null,
      action: dto.action as ApprovalHistoryAction,
      actorId: dto.actorId,
      actorName: dto.actorName.trim(),
      comments: dto.comments?.trim() ?? null,
      createdAt: dto.createdAt,
    };
  },
};
