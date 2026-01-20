/**
 * Get pending approval count for current user.
 *
 * Returns the number of approval requests waiting for the current user to approve/reject.
 * Used for badge display in navigation.
 */

import { httpClient, APPROVAL_ENDPOINTS } from '@/shared/api';

/**
 * Fetch pending approval count for current user.
 *
 * @returns Promise resolving to the count of pending approvals
 */
export async function getPendingApprovalCount(): Promise<number> {
  return httpClient.get<number>(APPROVAL_ENDPOINTS.PENDING_COUNT);
}
