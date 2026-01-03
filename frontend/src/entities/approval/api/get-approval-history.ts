/**
 * Approval History getter function.
 *
 * HTTP GET operation for approval history data.
 * Returns raw responses - mapping to domain models happens in query factory.
 */

import { httpClient, APPROVAL_ENDPOINTS } from '@/shared/api';
import type { ApprovalHistoryResponse } from './approval.mapper';

/**
 * Get approval history for an approval request.
 *
 * @param id - Approval ID
 * @returns Array of history entries
 */
export async function getApprovalHistory(id: number): Promise<ApprovalHistoryResponse[]> {
  return httpClient.get<ApprovalHistoryResponse[]>(APPROVAL_ENDPOINTS.history(id));
}
