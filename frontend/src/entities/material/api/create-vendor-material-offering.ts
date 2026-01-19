/**
 * Create Vendor Material Offering Command.
 *
 * Command function with validation for creating a new vendor material offering.
 *
 * @example
 * ```typescript
 * // In a feature's mutation hook
 * const mutation = useMutation({
 *   mutationFn: createVendorMaterialOffering,
 *   onSuccess: (_, variables) => {
 *     queryClient.invalidateQueries({
 *       queryKey: materialQueries.offeringsByMaterial(variables.materialId),
 *     });
 *   },
 * });
 *
 * // Call the mutation
 * mutation.mutate({
 *   vendorId: 10,
 *   materialId: 1,
 *   unitPrice: 5000,
 *   currency: 'KRW',
 * });
 * ```
 */

import { httpClient, MATERIAL_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './material.mapper';

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Request to create a vendor material offering.
 */
interface CreateVendorMaterialOfferingRequest {
  vendorId: number;
  materialId: number;
  vendorMaterialCode?: string | null;
  vendorMaterialName?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  leadTimeDays?: number | null;
  minOrderQuantity?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPreferred?: boolean;
  notes?: string | null;
}

// =============================================================================
// INPUT TYPE
// =============================================================================

/**
 * Input for creating a vendor material offering.
 * Validated before API call.
 */
export interface CreateVendorMaterialOfferingInput {
  vendorId: number;
  materialId: number;
  vendorMaterialCode?: string | null;
  vendorMaterialName?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  leadTimeDays?: number | null;
  minOrderQuantity?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPreferred?: boolean;
  notes?: string | null;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Domain validation error for vendor material offering creation.
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
 * Validate create vendor material offering input.
 * @throws {VendorMaterialOfferingValidationError} if validation fails
 */
function validateCreateInput(input: CreateVendorMaterialOfferingInput): void {
  if (!input.vendorId || input.vendorId <= 0) {
    throw new VendorMaterialOfferingValidationError('Valid vendor ID is required', 'vendorId');
  }

  if (!input.materialId || input.materialId <= 0) {
    throw new VendorMaterialOfferingValidationError('Valid material ID is required', 'materialId');
  }

  if (input.unitPrice !== undefined && input.unitPrice !== null && input.unitPrice < 0) {
    throw new VendorMaterialOfferingValidationError('Unit price cannot be negative', 'unitPrice');
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
function toCreateRequest(input: CreateVendorMaterialOfferingInput): CreateVendorMaterialOfferingRequest {
  return {
    vendorId: input.vendorId,
    materialId: input.materialId,
    vendorMaterialCode: input.vendorMaterialCode?.trim() || null,
    vendorMaterialName: input.vendorMaterialName?.trim() || null,
    unitPrice: input.unitPrice ?? null,
    currency: input.currency || null,
    leadTimeDays: input.leadTimeDays ?? null,
    minOrderQuantity: input.minOrderQuantity ?? null,
    effectiveFrom: input.effectiveFrom || null,
    effectiveTo: input.effectiveTo || null,
    isPreferred: input.isPreferred ?? false,
    notes: input.notes?.trim() || null,
  };
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Create a new vendor material offering.
 *
 * @param input - Vendor material offering creation data
 * @returns Command result with created ID
 * @throws {VendorMaterialOfferingValidationError} if validation fails
 */
export async function createVendorMaterialOffering(
  input: CreateVendorMaterialOfferingInput
): Promise<CommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  return httpClient.post<CommandResult>(MATERIAL_ENDPOINTS.createOffering, request);
}
