/**
 * Create Purchase Order command.
 *
 * Follows FSD Command Function pattern with built-in validation.
 */

import { httpClient, PURCHASE_ORDER_ENDPOINTS, DomainValidationError } from '@/shared/api';
import type { CommandResult } from './purchase-order.mapper';

// =============================================================================
// INPUT TYPE (Public API)
// =============================================================================

/**
 * Input for creating a purchase order.
 * This is the public contract for the command function.
 */
export interface CreatePurchaseOrderInput {
  readonly purchaseRequestId: number;
  readonly rfqItemId: string; // UUID string
  readonly orderDate: string; // ISO date
  readonly expectedDeliveryDate: string; // ISO date
  readonly notes?: string | null;
}

// =============================================================================
// REQUEST TYPE (Internal)
// =============================================================================

/**
 * API request payload.
 * @internal
 */
interface CreatePurchaseOrderRequest {
  purchaseRequestId: number;
  rfqItemId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  notes: string | null;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate create input.
 * @throws DomainValidationError if validation fails
 */
function validateCreateInput(input: CreatePurchaseOrderInput): void {
  if (!input.purchaseRequestId) {
    throw new DomainValidationError('REQUIRED', 'purchaseRequestId', 'Purchase request is required');
  }
  if (!input.rfqItemId) {
    throw new DomainValidationError('REQUIRED', 'rfqItemId', 'RFQ item is required');
  }
  if (!input.orderDate) {
    throw new DomainValidationError('REQUIRED', 'orderDate', 'Order date is required');
  }
  if (!input.expectedDeliveryDate) {
    throw new DomainValidationError('REQUIRED', 'expectedDeliveryDate', 'Expected delivery date is required');
  }
  if (input.expectedDeliveryDate < input.orderDate) {
    throw new DomainValidationError(
      'INVALID_FORMAT',
      'expectedDeliveryDate',
      'Expected delivery date cannot be before order date'
    );
  }
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Create a new purchase order from an RFQ item.
 *
 * @param input - Purchase order data
 * @returns Command result with created ID
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput
): Promise<CommandResult> {
  validateCreateInput(input);

  const request: CreatePurchaseOrderRequest = {
    purchaseRequestId: input.purchaseRequestId,
    rfqItemId: input.rfqItemId,
    orderDate: input.orderDate,
    expectedDeliveryDate: input.expectedDeliveryDate,
    notes: input.notes?.trim() ?? null,
  };

  return httpClient.post<CommandResult>(PURCHASE_ORDER_ENDPOINTS.BASE, request);
}
