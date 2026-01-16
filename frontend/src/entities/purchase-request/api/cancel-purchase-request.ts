/**
 * Cancel Purchase Request command.
 *
 * Cancels a purchase request.
 */

import { httpClient, PURCHASE_REQUEST_ENDPOINTS, DomainValidationError } from '@/shared/api';

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate cancel input.
 * @throws DomainValidationError if validation fails
 */
function validateCancelInput(id: number): void {
  if (!id) {
    throw new DomainValidationError('REQUIRED', 'id', 'Purchase request ID is required');
  }
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Cancel a purchase request.
 *
 * @param id - Purchase request ID to cancel
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function cancelPurchaseRequest(id: number): Promise<void> {
  validateCancelInput(id);

  await httpClient.delete(PURCHASE_REQUEST_ENDPOINTS.cancel(id));
}
