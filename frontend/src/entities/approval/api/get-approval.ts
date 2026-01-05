/**
 * Approval getter functions.
 *
 * HTTP GET operations for approval data.
 * Returns raw responses - mapping to domain models happens in query factory.
 */

import { httpClient, APPROVAL_ENDPOINTS, type PagedResponse } from '@/shared/api';
import {
  transformPagedResponse,
  type Paginated,
} from '@/shared/lib/pagination';
import type { ApprovalDetailsResponse, ApprovalListParams } from './approval.mapper';

/**
 * Get a single approval by ID.
 *
 * @param id - Approval ID
 * @returns Raw approval response
 */
export async function getApproval(id: number): Promise<ApprovalDetailsResponse> {
  return httpClient.get<ApprovalDetailsResponse>(APPROVAL_ENDPOINTS.byId(id));
}

/**
 * Get paginated list of approvals.
 *
 * Note: Backend list endpoint returns ApprovalSummaryView (without levels).
 * To get full details with levels, use getApproval() after finding the approval.
 *
 * @param params - Query parameters (pagination, filters)
 * @returns Paginated response with approval responses
 */
export async function getApprovals(
  params?: ApprovalListParams
): Promise<Paginated<ApprovalDetailsResponse>> {
  const response = await httpClient.requestWithMeta<PagedResponse<ApprovalDetailsResponse>>({
    method: 'GET',
    url: APPROVAL_ENDPOINTS.BASE,
    params,
  });

  return transformPagedResponse(response.data, response.metadata);
}
