/**
 * Approval workflow service.
 * Business logic layer for approval operations.
 *
 * Features:
 * - List approval requests
 * - Approve/reject at current level
 * - Approval history retrieval
 */

import { httpClient, APPROVAL_ENDPOINTS } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import { transformPagedResponse } from '@/services/shared';
import type {
  ApprovalDetails,
  ApprovalHistoryEntry,
  ApprovalListParams,
  ApproveRequest,
  CommandResult,
  PaginatedApprovals,
  RejectRequest,
} from './types';

/**
 * Transform ApprovalDetails DTO.
 * Normalizes data from API response.
 */
function transformApprovalDetails(dto: ApprovalDetails): ApprovalDetails {
  return {
    ...dto,
    entityDescription: dto.entityDescription?.trim() ?? null,
    submittedByName: dto.submittedByName?.trim() ?? '',
    levels: dto.levels?.map(level => ({
      ...level,
      levelName: level.levelName?.trim() ?? '',
      expectedApproverName: level.expectedApproverName?.trim() ?? '',
      decidedByName: level.decidedByName?.trim() ?? null,
      comments: level.comments?.trim() ?? null,
    })) ?? null,
  };
}

/**
 * Transform ApprovalHistoryEntry DTO.
 */
function transformHistoryEntry(dto: ApprovalHistoryEntry): ApprovalHistoryEntry {
  return {
    ...dto,
    levelName: dto.levelName?.trim() ?? null,
    actorName: dto.actorName?.trim() ?? '',
    comments: dto.comments?.trim() ?? null,
  };
}

/**
 * Approval workflow service.
 */
export const approvalService = {
  /**
   * Get paginated list of approval requests.
   * Supports filtering by entity type, status, and "my pending".
   */
  async getApprovals(params?: ApprovalListParams): Promise<PaginatedApprovals> {
    const response = await httpClient.requestWithMeta<PagedResponse<ApprovalDetails>>({
      method: 'GET',
      url: APPROVAL_ENDPOINTS.BASE,
      params,
    });

    const paginated = transformPagedResponse(response.data, response.metadata);
    return {
      ...paginated,
      data: paginated.data.map(transformApprovalDetails),
    };
  },

  /**
   * Get approval request by ID (with level decisions).
   */
  async getApproval(id: number): Promise<ApprovalDetails> {
    const approval = await httpClient.get<ApprovalDetails>(APPROVAL_ENDPOINTS.byId(id));
    return transformApprovalDetails(approval);
  },

  /**
   * Approve at the current level.
   * Advances to next level or completes approval if final level.
   * CQRS: Returns command result - fetch fresh data via getApproval() if needed.
   */
  async approve(id: number, comments?: string): Promise<CommandResult> {
    const request: ApproveRequest | undefined = comments ? { comments } : undefined;
    return httpClient.post<CommandResult>(APPROVAL_ENDPOINTS.approve(id), request);
  },

  /**
   * Reject at the current level.
   * Stops workflow and returns entity to DRAFT status.
   * CQRS: Returns command result - fetch fresh data via getApproval() if needed.
   */
  async reject(id: number, reason: string, comments?: string): Promise<CommandResult> {
    const request: RejectRequest = { reason, comments };
    return httpClient.post<CommandResult>(APPROVAL_ENDPOINTS.reject(id), request);
  },

  /**
   * Get approval history for an approval request.
   */
  async getHistory(id: number): Promise<ApprovalHistoryEntry[]> {
    const history = await httpClient.get<ApprovalHistoryEntry[]>(
      APPROVAL_ENDPOINTS.history(id)
    );
    return history.map(transformHistoryEntry);
  },
};
