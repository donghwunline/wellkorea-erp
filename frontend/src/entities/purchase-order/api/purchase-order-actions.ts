/**
 * Purchase Order action commands.
 *
 * Commands for sending, confirming, receiving, and canceling purchase orders.
 */

import { httpClient, PURCHASE_ORDER_ENDPOINTS, DomainValidationError } from '@/shared/api';
import type { CommandResult } from './purchase-order.mapper';

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Input for sending a purchase order with optional email notification.
 */
export interface SendPurchaseOrderInput {
  /** Purchase order ID */
  readonly purchaseOrderId: number;
  /** Optional email override (defaults to vendor email) */
  readonly to?: string;
  /** Optional CC recipients */
  readonly ccEmails?: readonly string[];
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateId(id: number, field: string): void {
  if (!id) {
    throw new DomainValidationError('REQUIRED', field, 'Purchase order ID is required');
  }
}

// =============================================================================
// REQUEST TYPES (internal)
// =============================================================================

interface SendPurchaseOrderRequest {
  readonly to?: string;
  readonly ccEmails?: readonly string[];
}

// =============================================================================
// COMMAND FUNCTIONS
// =============================================================================

/**
 * Send a purchase order to the vendor with email notification.
 *
 * @param input - Send purchase order input with optional email params
 * @returns Command result
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function sendPurchaseOrder(input: SendPurchaseOrderInput): Promise<CommandResult> {
  validateId(input.purchaseOrderId, 'purchaseOrderId');

  const request: SendPurchaseOrderRequest = {
    to: input.to,
    ccEmails: input.ccEmails,
  };

  return httpClient.post<CommandResult>(PURCHASE_ORDER_ENDPOINTS.send(input.purchaseOrderId), request);
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
