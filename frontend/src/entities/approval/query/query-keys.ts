/**
 * Approval query key factory.
 *
 * Centralized query keys for cache management.
 * Uses primitives only for stable serialization.
 */

import type { ApprovalStatus } from '../model/approval-status';
import type { EntityType } from '../model/entity-type';

/**
 * Query key factory for approval queries.
 *
 * Key structure:
 * - ['approvals'] - Base key for all approval data
 * - ['approvals', 'list'] - Base for list queries
 * - ['approvals', 'list', ...params] - Specific list with filters
 * - ['approvals', 'detail'] - Base for detail queries
 * - ['approvals', 'detail', id] - Specific detail
 * - ['approvals', 'history'] - Base for history queries
 * - ['approvals', 'history', id] - Specific approval history
 */
export const approvalQueryKeys = {
  /**
   * Base key for all approval queries.
   */
  all: ['approvals'] as const,

  /**
   * Base key for list queries.
   */
  lists: () => [...approvalQueryKeys.all, 'list'] as const,

  /**
   * Key for specific list with filters.
   *
   * @param page - Page number (0-indexed)
   * @param size - Page size
   * @param entityType - Entity type filter (null if none)
   * @param status - Status filter (null if none)
   * @param myPending - My pending approvals flag
   */
  list: (
    page: number,
    size: number,
    entityType: EntityType | null,
    status: ApprovalStatus | null,
    myPending: boolean
  ) => [...approvalQueryKeys.lists(), page, size, entityType, status, myPending] as const,

  /**
   * Base key for detail queries.
   */
  details: () => [...approvalQueryKeys.all, 'detail'] as const,

  /**
   * Key for specific approval detail.
   *
   * @param id - Approval ID
   */
  detail: (id: number) => [...approvalQueryKeys.details(), id] as const,

  /**
   * Base key for history queries.
   */
  histories: () => [...approvalQueryKeys.all, 'history'] as const,

  /**
   * Key for specific approval history.
   *
   * @param id - Approval ID
   */
  history: (id: number) => [...approvalQueryKeys.histories(), id] as const,
};
