/**
 * Update Purchase Order command.
 *
 * Follows FSD Command Function pattern with built-in validation.
 */

import { httpClient, PURCHASE_ORDER_ENDPOINTS, DomainValidationError } from '@/shared/api';
import type { CommandResult } from './purchase-order.mapper';

// =============================================================================
// INPUT TYPE (Public API)
// =============================================================================

/**
 * Input for updating a purchase order.
 * All fields are optional - only provided fields are updated.
 */
export interface UpdatePurchaseOrderInput {
  readonly id: number;
  readonly expectedDeliveryDate?: string;
  readonly notes?: string | null;
}

// =============================================================================
// REQUEST TYPE (Internal)
// =============================================================================

/**
 * API request payload.
 * @internal
 */
interface UpdatePurchaseOrderRequest {
  expectedDeliveryDate?: string;
  notes?: string | null;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate update input.
 * @throws DomainValidationError if validation fails
 */
function validateUpdateInput(input: UpdatePurchaseOrderInput): void {
  if (!input.id) {
    throw new DomainValidationError('REQUIRED', 'id', 'Purchase order ID is required');
  }
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Update an existing purchase order.
 *
 * @param input - Update data with purchase order ID
 * @returns Command result with updated ID
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function updatePurchaseOrder(
  input: UpdatePurchaseOrderInput
): Promise<CommandResult> {
  validateUpdateInput(input);

  const request: UpdatePurchaseOrderRequest = {};

  if (input.expectedDeliveryDate !== undefined) {
    request.expectedDeliveryDate = input.expectedDeliveryDate;
  }
  if (input.notes !== undefined) {
    request.notes = input.notes?.trim() ?? null;
  }

  return httpClient.put<CommandResult>(PURCHASE_ORDER_ENDPOINTS.byId(input.id), request);
}
