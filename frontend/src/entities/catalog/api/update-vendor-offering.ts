/**
 * Update Vendor Offering Command.
 *
 * Command function with validation for updating an existing vendor offering.
 *
 * @example
 * ```typescript
 * // In a feature's mutation hook
 * const mutation = useMutation({
 *   mutationFn: updateVendorOffering,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: catalogQueries.offerings() });
 *   },
 * });
 *
 * // Call the mutation
 * mutation.mutate({ id: 1, unitPrice: 6000 });
 * ```
 */

import { httpClient, SERVICE_CATEGORY_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './catalog.mapper';

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Request to update a vendor service offering.
 */
interface UpdateVendorOfferingRequest {
  vendorServiceCode?: string | null;
  vendorServiceName?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  leadTimeDays?: number | null;
  minOrderQuantity?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPreferred?: boolean | null;
  notes?: string | null;
}

// =============================================================================
// INPUT TYPE
// =============================================================================

/**
 * Input for updating a vendor offering.
 * Validated before API call.
 */
export interface UpdateVendorOfferingInput {
  id: number;
  vendorServiceCode?: string | null;
  vendorServiceName?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  leadTimeDays?: number | null;
  minOrderQuantity?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPreferred?: boolean | null;
  notes?: string | null;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Domain validation error for vendor offering update.
 */
export class VendorOfferingValidationError extends Error {
  readonly field: string;

  constructor(message: string, field: string) {
    super(message);
    this.name = 'VendorOfferingValidationError';
    this.field = field;
  }
}

/**
 * Validate update vendor offering input.
 * @throws {VendorOfferingValidationError} if validation fails
 */
function validateUpdateInput(input: UpdateVendorOfferingInput): void {
  if (!input.id || input.id <= 0) {
    throw new VendorOfferingValidationError('Valid offering ID is required', 'id');
  }

  if (input.unitPrice !== undefined && input.unitPrice !== null && input.unitPrice < 0) {
    throw new VendorOfferingValidationError('Unit price cannot be negative', 'unitPrice');
  }

  if (input.leadTimeDays !== undefined && input.leadTimeDays !== null && input.leadTimeDays < 0) {
    throw new VendorOfferingValidationError('Lead time cannot be negative', 'leadTimeDays');
  }

  if (
    input.minOrderQuantity !== undefined &&
    input.minOrderQuantity !== null &&
    input.minOrderQuantity < 0
  ) {
    throw new VendorOfferingValidationError(
      'Minimum order quantity cannot be negative',
      'minOrderQuantity'
    );
  }

  // Validate date range
  if (input.effectiveFrom && input.effectiveTo) {
    if (input.effectiveFrom > input.effectiveTo) {
      throw new VendorOfferingValidationError(
        'Effective from date must be before effective to date',
        'effectiveFrom'
      );
    }
  }

  if (input.notes && input.notes.length > 1000) {
    throw new VendorOfferingValidationError('Notes must not exceed 1000 characters', 'notes');
  }
}

// =============================================================================
// REQUEST MAPPING
// =============================================================================

/**
 * Map input to API request.
 */
function toUpdateRequest(input: UpdateVendorOfferingInput): UpdateVendorOfferingRequest {
  const request: UpdateVendorOfferingRequest = {};

  if (input.vendorServiceCode !== undefined) {
    request.vendorServiceCode = input.vendorServiceCode?.trim() || null;
  }

  if (input.vendorServiceName !== undefined) {
    request.vendorServiceName = input.vendorServiceName?.trim() || null;
  }

  if (input.unitPrice !== undefined) {
    request.unitPrice = input.unitPrice;
  }

  if (input.currency !== undefined) {
    request.currency = input.currency;
  }

  if (input.leadTimeDays !== undefined) {
    request.leadTimeDays = input.leadTimeDays;
  }

  if (input.minOrderQuantity !== undefined) {
    request.minOrderQuantity = input.minOrderQuantity;
  }

  if (input.effectiveFrom !== undefined) {
    request.effectiveFrom = input.effectiveFrom;
  }

  if (input.effectiveTo !== undefined) {
    request.effectiveTo = input.effectiveTo;
  }

  if (input.isPreferred !== undefined) {
    request.isPreferred = input.isPreferred;
  }

  if (input.notes !== undefined) {
    request.notes = input.notes?.trim() || null;
  }

  return request;
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Update an existing vendor offering.
 *
 * @param input - Vendor offering update data
 * @returns Command result with updated ID
 * @throws {VendorOfferingValidationError} if validation fails
 */
export async function updateVendorOffering(
  input: UpdateVendorOfferingInput
): Promise<CommandResult> {
  validateUpdateInput(input);
  const request = toUpdateRequest(input);
  return httpClient.put<CommandResult>(SERVICE_CATEGORY_ENDPOINTS.offering(input.id), request);
}
