/**
 * RFQ (Request for Quotation) operations.
 *
 * Post-RFQ operations for handling vendor responses:
 * - recordReply: Record vendor's quoted price and lead time
 * - markNoResponse: Mark vendor as non-responsive
 * - selectVendor: Select vendor for the purchase request
 * - rejectRfq: Reject vendor's quote
 */

import { httpClient, PURCHASE_REQUEST_ENDPOINTS, DomainValidationError } from '@/shared/api';
import type { CommandResult } from './purchase-request.mapper';

// =============================================================================
// INPUT TYPES (Public API)
// =============================================================================

/**
 * Input for recording vendor reply.
 */
export interface RecordRfqReplyInput {
  readonly purchaseRequestId: number;
  readonly itemId: string;
  readonly quotedPrice: number;
  readonly quotedLeadTime?: number | null;
  readonly notes?: string | null;
}

/**
 * Input for RFQ item operations (markNoResponse, selectVendor, rejectRfq).
 */
export interface RfqItemOperationInput {
  readonly purchaseRequestId: number;
  readonly itemId: string;
}

// =============================================================================
// REQUEST TYPES (Internal)
// =============================================================================

/**
 * API request payload for recording reply.
 * @internal
 */
interface RecordRfqReplyRequest {
  itemId: string;
  quotedPrice: number;
  quotedLeadTime?: number | null;
  notes?: string | null;
}

/**
 * API request payload for item operations.
 * @internal
 */
interface RfqItemActionRequest {
  itemId: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate record reply input.
 * @throws DomainValidationError if validation fails
 */
function validateRecordReplyInput(input: RecordRfqReplyInput): void {
  if (!input.purchaseRequestId) {
    throw new DomainValidationError('REQUIRED', 'purchaseRequestId', 'Purchase request ID is required');
  }
  if (!input.itemId) {
    throw new DomainValidationError('REQUIRED', 'itemId', 'RFQ item ID is required');
  }
  if (input.quotedPrice === undefined || input.quotedPrice === null) {
    throw new DomainValidationError('REQUIRED', 'quotedPrice', 'Quoted price is required');
  }
  if (input.quotedPrice < 0) {
    throw new DomainValidationError('INVALID', 'quotedPrice', 'Quoted price must be non-negative');
  }
  if (input.quotedLeadTime !== undefined && input.quotedLeadTime !== null && input.quotedLeadTime < 0) {
    throw new DomainValidationError('INVALID', 'quotedLeadTime', 'Lead time must be non-negative');
  }
}

/**
 * Validate RFQ item operation input.
 * @throws DomainValidationError if validation fails
 */
function validateRfqItemOperationInput(input: RfqItemOperationInput): void {
  if (!input.purchaseRequestId) {
    throw new DomainValidationError('REQUIRED', 'purchaseRequestId', 'Purchase request ID is required');
  }
  if (!input.itemId) {
    throw new DomainValidationError('REQUIRED', 'itemId', 'RFQ item ID is required');
  }
}

// =============================================================================
// COMMAND FUNCTIONS
// =============================================================================

/**
 * Record vendor's reply with quoted price and lead time.
 *
 * @param input - Reply data including quoted price
 * @returns Command result
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function recordRfqReply(input: RecordRfqReplyInput): Promise<CommandResult> {
  validateRecordReplyInput(input);

  const request: RecordRfqReplyRequest = {
    itemId: input.itemId,
    quotedPrice: input.quotedPrice,
    quotedLeadTime: input.quotedLeadTime,
    notes: input.notes,
  };

  return httpClient.post<CommandResult>(
    PURCHASE_REQUEST_ENDPOINTS.recordReply(input.purchaseRequestId),
    request
  );
}

/**
 * Mark vendor as non-responsive (no reply received).
 *
 * @param input - Purchase request ID and RFQ item ID
 * @returns Command result
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function markRfqNoResponse(input: RfqItemOperationInput): Promise<CommandResult> {
  validateRfqItemOperationInput(input);

  const request: RfqItemActionRequest = {
    itemId: input.itemId,
  };

  return httpClient.post<CommandResult>(
    PURCHASE_REQUEST_ENDPOINTS.markNoResponse(input.purchaseRequestId),
    request
  );
}

/**
 * Select vendor for the purchase request.
 *
 * @param input - Purchase request ID and RFQ item ID
 * @returns Command result
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function selectVendor(input: RfqItemOperationInput): Promise<CommandResult> {
  validateRfqItemOperationInput(input);

  const request: RfqItemActionRequest = {
    itemId: input.itemId,
  };

  return httpClient.post<CommandResult>(
    PURCHASE_REQUEST_ENDPOINTS.selectVendor(input.purchaseRequestId),
    request
  );
}

/**
 * Reject vendor's quote.
 *
 * @param input - Purchase request ID and RFQ item ID
 * @returns Command result
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function rejectRfq(input: RfqItemOperationInput): Promise<CommandResult> {
  validateRfqItemOperationInput(input);

  const request: RfqItemActionRequest = {
    itemId: input.itemId,
  };

  return httpClient.post<CommandResult>(
    PURCHASE_REQUEST_ENDPOINTS.rejectRfq(input.purchaseRequestId),
    request
  );
}
