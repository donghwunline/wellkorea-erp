/**
 * Set Preferred Vendor Material Offering Command.
 *
 * Command function to set a vendor material offering as the preferred vendor for a material.
 * This will clear the preferred flag on all other offerings for the same material.
 *
 * @example
 * ```typescript
 * // In a feature's mutation hook
 * const mutation = useMutation({
 *   mutationFn: setPreferredVendorOffering,
 *   onSuccess: (_, offeringId) => {
 *     queryClient.invalidateQueries({
 *       queryKey: materialQueries.offerings(),
 *     });
 *   },
 * });
 *
 * // Call the mutation
 * mutation.mutate(42); // offeringId
 * ```
 */

import { httpClient, MATERIAL_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './create-material';

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Set a vendor material offering as preferred.
 * This clears the preferred flag on all other offerings for the same material.
 *
 * @param offeringId - ID of the offering to set as preferred
 * @returns Command result with updated ID
 */
export async function setPreferredVendorOffering(offeringId: number): Promise<CommandResult> {
  if (!offeringId || offeringId <= 0) {
    throw new Error('Valid offering ID is required');
  }
  return httpClient.put<CommandResult>(MATERIAL_ENDPOINTS.setPreferred(offeringId), {});
}
