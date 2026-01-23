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
 * All required fields must be provided (PUT semantics).
 */
export interface UpdatePurchaseRequestInput {
  readonly id: number;
  readonly description: string;      // required
  readonly quantity: number;         // required
  readonly uom?: string;             // optional (nullable on backend)
  readonly requiredDate: string;     // required
}

// =============================================================================
// REQUEST TYPE (Internal)
// =============================================================================

/**
 * API request payload.
 * @internal
 */
interface UpdatePurchaseRequestRequest {
  description: string;
  quantity: number;
  uom?: string;
  requiredDate: string;
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
  if (!input.description?.trim()) {
    throw new DomainValidationError('REQUIRED', 'description', 'Description is required');
  }
  if (input.quantity === undefined || input.quantity <= 0) {
    throw new DomainValidationError('OUT_OF_RANGE', 'quantity', 'Quantity must be greater than 0');
  }
  if (!input.requiredDate) {
    throw new DomainValidationError('REQUIRED', 'requiredDate', 'Required date is required');
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

  const request: UpdatePurchaseRequestRequest = {
    description: input.description.trim(),
    quantity: input.quantity,
    uom: input.uom?.trim(),
    requiredDate: input.requiredDate,
  };

  return httpClient.put<CommandResult>(PURCHASE_REQUEST_ENDPOINTS.byId(input.id), request);
}
