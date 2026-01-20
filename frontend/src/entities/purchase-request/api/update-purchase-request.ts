/**
 * Update Purchase Request command.
 *
 * Follows FSD Command Function pattern with built-in validation.
 */

import { httpClient, PURCHASE_REQUEST_ENDPOINTS, DomainValidationError } from '@/shared/api';
import type { CommandResult } from './purchase-request.mapper';

// =============================================================================
// INPUT TYPE (Public API)
// =============================================================================

/**
 * Input for updating a purchase request.
 * All fields are optional - only provided fields are updated.
 */
export interface UpdatePurchaseRequestInput {
  readonly id: number;
  readonly description?: string;
  readonly quantity?: number;
  readonly uom?: string;
  readonly requiredDate?: string | null;
}

// =============================================================================
// REQUEST TYPE (Internal)
// =============================================================================

/**
 * API request payload.
 * @internal
 */
interface UpdatePurchaseRequestRequest {
  description?: string;
  quantity?: number;
  uom?: string;
  requiredDate?: string | null;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate update input.
 * @throws DomainValidationError if validation fails
 */
function validateUpdateInput(input: UpdatePurchaseRequestInput): void {
  if (!input.id) {
    throw new DomainValidationError('REQUIRED', 'id', 'Purchase request ID is required');
  }
  if (input.description !== undefined && !input.description.trim()) {
    throw new DomainValidationError('INVALID_FORMAT', 'description', 'Description cannot be empty');
  }
  if (input.quantity !== undefined && input.quantity <= 0) {
    throw new DomainValidationError('OUT_OF_RANGE', 'quantity', 'Quantity must be greater than 0');
  }
  if (input.uom !== undefined && !input.uom.trim()) {
    throw new DomainValidationError('INVALID_FORMAT', 'uom', 'Unit of measure cannot be empty');
  }
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Update an existing purchase request.
 *
 * @param input - Update data with purchase request ID
 * @returns Command result with updated ID
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function updatePurchaseRequest(
  input: UpdatePurchaseRequestInput
): Promise<CommandResult> {
  validateUpdateInput(input);

  const request: UpdatePurchaseRequestRequest = {};

  if (input.description !== undefined) {
    request.description = input.description.trim();
  }
  if (input.quantity !== undefined) {
    request.quantity = input.quantity;
  }
  if (input.uom !== undefined) {
    request.uom = input.uom.trim();
  }
  if (input.requiredDate !== undefined) {
    request.requiredDate = input.requiredDate;
  }

  return httpClient.put<CommandResult>(PURCHASE_REQUEST_ENDPOINTS.byId(input.id), request);
}
