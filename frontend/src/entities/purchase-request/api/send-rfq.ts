/**
 * Send RFQ command.
 *
 * Sends Request for Quotation to selected vendors.
 */

import { httpClient, PURCHASE_REQUEST_ENDPOINTS, DomainValidationError } from '@/shared/api';
import type { CommandResult } from './purchase-request.mapper';

// =============================================================================
// INPUT TYPE (Public API)
// =============================================================================

/**
 * Input for sending RFQ.
 */
export interface SendRfqInput {
  readonly purchaseRequestId: number;
  readonly vendorIds: readonly number[];
}

// =============================================================================
// REQUEST TYPE (Internal)
// =============================================================================

/**
 * API request payload.
 * @internal
 */
interface SendRfqRequest {
  vendorIds: number[];
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate send RFQ input.
 * @throws DomainValidationError if validation fails
 */
function validateSendRfqInput(input: SendRfqInput): void {
  if (!input.purchaseRequestId) {
    throw new DomainValidationError('REQUIRED', 'purchaseRequestId', 'Purchase request ID is required');
  }
  if (!input.vendorIds || input.vendorIds.length === 0) {
    throw new DomainValidationError('REQUIRED', 'vendorIds', 'At least one vendor must be selected');
  }
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Send RFQ to vendors.
 *
 * @param input - RFQ data with vendor IDs
 * @returns Command result
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function sendRfq(input: SendRfqInput): Promise<CommandResult> {
  validateSendRfqInput(input);

  const request: SendRfqRequest = {
    vendorIds: [...input.vendorIds],
  };

  return httpClient.post<CommandResult>(
    PURCHASE_REQUEST_ENDPOINTS.sendRfq(input.purchaseRequestId),
    request
  );
}
