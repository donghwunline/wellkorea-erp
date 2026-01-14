/**
 * Mark delivery as returned command function.
 */

import { httpClient, DELIVERY_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './delivery.mapper';

/**
 * Mark a delivery as returned (PENDING/DELIVERED → RETURNED).
 *
 * @param deliveryId - The ID of the delivery to mark as returned
 * @returns Command result with delivery ID and message
 */
export async function markReturned(deliveryId: number): Promise<CommandResult> {
  if (!deliveryId || deliveryId <= 0) {
    throw new Error('Valid delivery ID is required');
  }
  return httpClient.post<CommandResult>(
    DELIVERY_ENDPOINTS.markReturned(deliveryId),
    {}
  );
}
