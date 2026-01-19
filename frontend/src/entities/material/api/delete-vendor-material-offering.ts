/**
 * Delete Vendor Material Offering Command.
 *
 * Command function for deleting an existing vendor material offering.
 *
 * @example
 * ```typescript
 * // In a feature's mutation hook
 * const mutation = useMutation({
 *   mutationFn: deleteVendorMaterialOffering,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: materialQueries.offerings() });
 *   },
 * });
 *
 * // Call the mutation
 * mutation.mutate({ id: 1 });
 * ```
 */

import { httpClient, MATERIAL_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './material.mapper';

// =============================================================================
// INPUT TYPE
// =============================================================================

/**
 * Input for deleting a vendor material offering.
 */
export interface DeleteVendorMaterialOfferingInput {
  id: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Domain validation error for vendor material offering deletion.
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
 * Validate delete vendor material offering input.
 * @throws {VendorMaterialOfferingValidationError} if validation fails
 */
function validateDeleteInput(input: DeleteVendorMaterialOfferingInput): void {
  if (!input.id || input.id <= 0) {
    throw new VendorMaterialOfferingValidationError('Valid offering ID is required', 'id');
  }
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Delete a vendor material offering.
 *
 * @param input - Vendor material offering deletion data
 * @returns Command result with deleted ID
 * @throws {VendorMaterialOfferingValidationError} if validation fails
 */
export async function deleteVendorMaterialOffering(
  input: DeleteVendorMaterialOfferingInput
): Promise<CommandResult> {
  validateDeleteInput(input);
  return httpClient.delete<CommandResult>(MATERIAL_ENDPOINTS.offering(input.id));
}
