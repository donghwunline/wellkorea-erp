/**
 * Approval API functions.
 *
 * Low-level HTTP functions for approval operations.
 * Returns DTOs only - use query hooks for domain models with caching.
 */

import { httpClient, APPROVAL_ENDPOINTS, transformPagedResponse } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import type { Paginated } from '@/shared/pagination';
import type {
  ApprovalDetailsDTO,
  ApprovalHistoryDTO,
  ApprovalListParamsDTO,
  ApproveRequestDTO,
  RejectRequestDTO,
  CommandResult,
} from './approval.dto';

/**
 * Approval API functions.
 *
 * Returns DTOs only - use query hooks for domain models.
 * Features layer should use mutation hooks for write operations.
 */
export const approvalApi = {
  /**
   * Get paginated list of approval requests.
   *
   * Note: Backend list endpoint returns ApprovalSummaryView (without levels).
   * To get full details with levels, use getById() after finding the approval.
   *
   * @param params - Query parameters
   */
  async getList(params?: ApprovalListParamsDTO): Promise<Paginated<ApprovalDetailsDTO>> {
    const response = await httpClient.requestWithMeta<PagedResponse<ApprovalDetailsDTO>>({
      method: 'GET',
      url: APPROVAL_ENDPOINTS.BASE,
      params,
    });

    return transformPagedResponse(response.data, response.metadata);
  },

  /**
   * Get approval request by ID.
   *
   * @param id - Approval ID
   */
  async getById(id: number): Promise<ApprovalDetailsDTO> {
    return httpClient.get<ApprovalDetailsDTO>(APPROVAL_ENDPOINTS.byId(id));
  },

  /**
   * Approve at the current level.
   * CQRS: Returns command result - fetch fresh data via query if needed.
   *
   * @param id - Approval ID
   * @param comments - Optional comments
   */
  async approve(id: number, comments?: string): Promise<CommandResult> {
    const request: ApproveRequestDTO | undefined = comments ? { comments } : undefined;
    return httpClient.post<CommandResult>(APPROVAL_ENDPOINTS.approve(id), request);
  },

  /**
   * Reject at the current level.
   * CQRS: Returns command result - fetch fresh data via query if needed.
   *
   * @param id - Approval ID
   * @param reason - Rejection reason (required)
   * @param comments - Optional additional comments
   */
  async reject(id: number, reason: string, comments?: string): Promise<CommandResult> {
    const request: RejectRequestDTO = { reason, comments };
    return httpClient.post<CommandResult>(APPROVAL_ENDPOINTS.reject(id), request);
  },

  /**
   * Get approval history for an approval request.
   *
   * @param id - Approval ID
   */
  async getHistory(id: number): Promise<ApprovalHistoryDTO[]> {
    return httpClient.get<ApprovalHistoryDTO[]>(APPROVAL_ENDPOINTS.history(id));
  },
};
