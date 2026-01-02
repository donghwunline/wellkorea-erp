/**
 * Create Vendor Offering Command.
 *
 * Command function with validation for creating a new vendor offering.
 *
 * @example
 * ```typescript
 * // In a feature's mutation hook
 * const mutation = useMutation({
 *   mutationFn: createVendorOffering,
 *   onSuccess: (_, variables) => {
 *     queryClient.invalidateQueries({
 *       queryKey: catalogQueries.offeringsByCategory(variables.serviceCategoryId),
 *     });
 *   },
 * });
 *
 * // Call the mutation
 * mutation.mutate({
 *   vendorId: 10,
 *   serviceCategoryId: 1,
 *   unitPrice: 5000,
 *   currency: 'KRW',
 * });
 * ```
 */

import { httpClient, SERVICE_CATEGORY_ENDPOINTS } from '@/shared/api';
import type { CommandResult, CreateVendorOfferingRequestDTO } from './catalog.dto';

// =============================================================================
// Input Type
// =============================================================================

/**
 * Input for creating a vendor offering.
 * Validated before API call.
 */
export interface CreateVendorOfferingInput {
  vendorId: number;
  serviceCategoryId: number;
  vendorServiceCode?: string | null;
  vendorServiceName?: string | null;
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
// Validation
// =============================================================================

/**
 * Domain validation error for vendor offering creation.
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
 * Validate create vendor offering input.
 * @throws {VendorOfferingValidationError} if validation fails
 */
function validateCreateInput(input: CreateVendorOfferingInput): void {
  if (!input.vendorId || input.vendorId <= 0) {
    throw new VendorOfferingValidationError('Valid vendor ID is required', 'vendorId');
  }

  if (!input.serviceCategoryId || input.serviceCategoryId <= 0) {
    throw new VendorOfferingValidationError(
      'Valid service category ID is required',
      'serviceCategoryId'
    );
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
// Request Mapping
// =============================================================================

/**
 * Map input to API request.
 */
function toCreateRequest(input: CreateVendorOfferingInput): CreateVendorOfferingRequestDTO {
  return {
    vendorId: input.vendorId,
    serviceCategoryId: input.serviceCategoryId,
    vendorServiceCode: input.vendorServiceCode?.trim() || null,
    vendorServiceName: input.vendorServiceName?.trim() || null,
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
// Command Function
// =============================================================================

/**
 * Create a new vendor offering.
 *
 * @param input - Vendor offering creation data
 * @returns Command result with created ID
 * @throws {VendorOfferingValidationError} if validation fails
 */
export async function createVendorOffering(
  input: CreateVendorOfferingInput
): Promise<CommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  return httpClient.post<CommandResult>(SERVICE_CATEGORY_ENDPOINTS.createOffering, request);
}
