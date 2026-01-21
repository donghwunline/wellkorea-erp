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
 * Email info for a vendor (TO and CC recipients).
 */
export interface VendorEmailInfo {
  /** Optional email override (defaults to vendor's registered email) */
  readonly to?: string;
  /** Optional CC recipients */
  readonly ccEmails?: readonly string[];
}

/**
 * Input for sending RFQ.
 */
export interface SendRfqInput {
  readonly purchaseRequestId: number;
  readonly vendorIds: readonly number[];
  /**
   * Optional email overrides per vendor.
   * Key: vendorId, Value: VendorEmailInfo with TO/CC email addresses.
   * If not provided for a vendor, the vendor's default email will be used.
   */
  readonly vendorEmails?: Readonly<Record<number, VendorEmailInfo>>;
}

// =============================================================================
// REQUEST TYPE (Internal)
// =============================================================================

/**
 * Vendor email info in API request format.
 * @internal
 */
interface VendorEmailInfoRequest {
  to?: string;
  ccEmails?: string[];
}

/**
 * API request payload.
 * @internal
 */
interface SendRfqRequest {
  vendorIds: number[];
  vendorEmails?: Record<number, VendorEmailInfoRequest>;
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
 * Build vendor emails request object from input.
 */
function buildVendorEmailsRequest(
  vendorEmails: Readonly<Record<number, VendorEmailInfo>> | undefined
): Record<number, VendorEmailInfoRequest> | undefined {
  if (!vendorEmails) {
    return undefined;
  }

  const result: Record<number, VendorEmailInfoRequest> = {};
  for (const [vendorId, emailInfo] of Object.entries(vendorEmails)) {
    result[Number(vendorId)] = {
      to: emailInfo.to,
      ccEmails: emailInfo.ccEmails ? [...emailInfo.ccEmails] : undefined,
    };
  }
  return result;
}

/**
 * Send RFQ to vendors with optional email notifications.
 *
 * @param input - RFQ data with vendor IDs and optional email overrides
 * @returns Command result
 * @throws DomainValidationError for validation failures
 * @throws ApiError for server errors
 */
export async function sendRfq(input: SendRfqInput): Promise<CommandResult> {
  validateSendRfqInput(input);

  const request: SendRfqRequest = {
    vendorIds: [...input.vendorIds],
    vendorEmails: buildVendorEmailsRequest(input.vendorEmails),
  };

  return httpClient.post<CommandResult>(
    PURCHASE_REQUEST_ENDPOINTS.sendRfq(input.purchaseRequestId),
    request
  );
}
