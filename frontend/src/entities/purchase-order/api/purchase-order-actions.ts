/**
 * Purchase Order action commands.
 *
 * Commands for sending, confirming, receiving, and canceling purchase orders.
 */

import { httpClient, PURCHASE_ORDER_ENDPOINTS, DomainValidationError } from '@/shared/api';
import type { CommandResult } from './purchase-order.mapper';

// =============================================================================
// VALIDATION
// =============================================================================

function validateId(id: number, field: string): void {
  if (!id) {
    throw new DomainValidationError('REQUIRED', field, 'Purchase order ID is required');
  }
}

// =============================================================================
// COMMAND FUNCTIONS
// =============================================================================

/**
 * Send a purchase order to the vendor.
 *
 * @param id - Purchase order ID
 * @returns Command result
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function sendPurchaseOrder(id: number): Promise<CommandResult> {
  validateId(id, 'id');
  return httpClient.post<CommandResult>(PURCHASE_ORDER_ENDPOINTS.send(id), {});
}

/**
 * Confirm a purchase order (vendor confirmation).
 *
 * @param id - Purchase order ID
 * @returns Command result
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function confirmPurchaseOrder(id: number): Promise<CommandResult> {
  validateId(id, 'id');
  return httpClient.post<CommandResult>(PURCHASE_ORDER_ENDPOINTS.confirm(id), {});
}

/**
 * Mark a purchase order as received.
 *
 * @param id - Purchase order ID
 * @returns Command result
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function receivePurchaseOrder(id: number): Promise<CommandResult> {
  validateId(id, 'id');
  return httpClient.post<CommandResult>(PURCHASE_ORDER_ENDPOINTS.receive(id), {});
}

/**
 * Cancel a purchase order.
 *
 * @param id - Purchase order ID
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function cancelPurchaseOrder(id: number): Promise<void> {
  validateId(id, 'id');
  await httpClient.delete(PURCHASE_ORDER_ENDPOINTS.cancel(id));
}
