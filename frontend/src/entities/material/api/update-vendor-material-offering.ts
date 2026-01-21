/**
 * Update Vendor Material Offering Command.
 *
 * Command function with validation for updating an existing vendor material offering.
 *
 * @example
 * ```typescript
 * // In a feature's mutation hook
 * const mutation = useMutation({
 *   mutationFn: updateVendorMaterialOffering,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: materialQueries.offerings() });
 *   },
 * });
 *
 * // Call the mutation
 * mutation.mutate({ id: 1, unitPrice: 6000 });
 * ```
 */

import { httpClient, MATERIAL_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './create-material';

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Request to update a vendor material offering.
 */
interface UpdateVendorMaterialOfferingRequest {
  vendorMaterialCode?: string | null;
  vendorMaterialName?: string | null;
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
 * Input for updating a vendor material offering.
 * Validated before API call.
 */
export interface UpdateVendorMaterialOfferingInput {
  id: number;
  vendorMaterialCode?: string | null;
  vendorMaterialName?: string | null;
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
 * Domain validation error for vendor material offering update.
 */
export class VendorMaterialOfferingValidationError extends Error {
  readonly field: string;

  constructor(message: string, field: string) {
    super(message);
    this.name = 'VendorMaterialOfferingValidationError';
    this.field = field;
  }
}

/**
 * Validate update vendor material offering input.
 * @throws {VendorMaterialOfferingValidationError} if validation fails
 */
function validateUpdateInput(input: UpdateVendorMaterialOfferingInput): void {
  if (!input.id || input.id <= 0) {
    throw new VendorMaterialOfferingValidationError('Valid offering ID is required', 'id');
  }

  // vendorMaterialCode max 50 chars
  if (input.vendorMaterialCode && input.vendorMaterialCode.length > 50) {
    throw new VendorMaterialOfferingValidationError(
      'Vendor material code must not exceed 50 characters',
      'vendorMaterialCode'
    );
  }

  // vendorMaterialName max 200 chars
  if (input.vendorMaterialName && input.vendorMaterialName.length > 200) {
    throw new VendorMaterialOfferingValidationError(
      'Vendor material name must not exceed 200 characters',
      'vendorMaterialName'
    );
  }

  if (input.unitPrice !== undefined && input.unitPrice !== null && input.unitPrice < 0) {
    throw new VendorMaterialOfferingValidationError('Unit price cannot be negative', 'unitPrice');
  }

  // currency max 3 chars (ISO 4217)
  if (input.currency && input.currency.length > 3) {
    throw new VendorMaterialOfferingValidationError(
      'Currency code must not exceed 3 characters',
      'currency'
    );
  }

  if (input.leadTimeDays !== undefined && input.leadTimeDays !== null && input.leadTimeDays < 0) {
    throw new VendorMaterialOfferingValidationError('Lead time cannot be negative', 'leadTimeDays');
  }

  if (
    input.minOrderQuantity !== undefined &&
    input.minOrderQuantity !== null &&
    input.minOrderQuantity < 0
  ) {
    throw new VendorMaterialOfferingValidationError(
      'Minimum order quantity cannot be negative',
      'minOrderQuantity'
    );
  }

  // Validate date range
  if (input.effectiveFrom && input.effectiveTo) {
    if (input.effectiveFrom > input.effectiveTo) {
      throw new VendorMaterialOfferingValidationError(
        'Effective from date must be before effective to date',
        'effectiveFrom'
      );
    }
  }

  if (input.notes && input.notes.length > 1000) {
    throw new VendorMaterialOfferingValidationError('Notes must not exceed 1000 characters', 'notes');
  }
}

// =============================================================================
// REQUEST MAPPING
// =============================================================================

/**
 * Map input to API request.
 */
function toUpdateRequest(input: UpdateVendorMaterialOfferingInput): UpdateVendorMaterialOfferingRequest {
  const request: UpdateVendorMaterialOfferingRequest = {};

  if (input.vendorMaterialCode !== undefined) {
    request.vendorMaterialCode = input.vendorMaterialCode?.trim() || null;
  }

  if (input.vendorMaterialName !== undefined) {
    request.vendorMaterialName = input.vendorMaterialName?.trim() || null;
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
 * Update an existing vendor material offering.
 *
 * @param input - Vendor material offering update data
 * @returns Command result with updated ID
 * @throws {VendorMaterialOfferingValidationError} if validation fails
 */
export async function updateVendorMaterialOffering(
  input: UpdateVendorMaterialOfferingInput
): Promise<CommandResult> {
  validateUpdateInput(input);
  const request = toUpdateRequest(input);
  return httpClient.put<CommandResult>(MATERIAL_ENDPOINTS.offering(input.id), request);
}
