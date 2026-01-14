/**
 * Reassign delivery to different quotation command function.
 */

import { httpClient, DELIVERY_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './delivery.mapper';

/**
 * Input for reassigning a delivery to a different quotation.
 */
export interface ReassignDeliveryInput {
  /** ID of the delivery to reassign */
  deliveryId: number;
  /** ID of the target quotation */
  quotationId: number;
}

/**
 * Reassign a delivery to a different quotation version.
 * Used when a new quotation is approved and existing deliveries
 * need to be linked to the new version.
 *
 * @param input - The reassignment input containing delivery and quotation IDs
 * @returns Command result with delivery ID and message
 * @throws Error if validation fails or quotation is not compatible
 */
export async function reassignDelivery(input: ReassignDeliveryInput): Promise<CommandResult> {
  if (!input.deliveryId || input.deliveryId <= 0) {
    throw new Error('Valid delivery ID is required');
  }
  if (!input.quotationId || input.quotationId <= 0) {
    throw new Error('Valid quotation ID is required');
  }

  return httpClient.post<CommandResult>(
    `${DELIVERY_ENDPOINTS.reassign(input.deliveryId)}?quotationId=${input.quotationId}`,
    {}
  );
}
