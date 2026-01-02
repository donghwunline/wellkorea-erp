/**
 * Delete Vendor Offering Command.
 *
 * Command function for deleting a vendor offering.
 *
 * @example
 * ```typescript
 * // In a feature's mutation hook
 * const mutation = useMutation({
 *   mutationFn: deleteVendorOffering,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: catalogQueries.offerings() });
 *   },
 * });
 *
 * // Call the mutation
 * mutation.mutate({ id: 1 });
 * ```
 */

import { httpClient, SERVICE_CATEGORY_ENDPOINTS } from '@/shared/api';

// =============================================================================
// Input Type
// =============================================================================

/**
 * Input for deleting a vendor offering.
 */
export interface DeleteVendorOfferingInput {
  id: number;
}

// =============================================================================
// Command Function
// =============================================================================

/**
 * Delete a vendor offering.
 *
 * @param input - Vendor offering deletion data
 */
export async function deleteVendorOffering(input: DeleteVendorOfferingInput): Promise<void> {
  if (!input.id || input.id <= 0) {
    throw new Error('Valid offering ID is required');
  }

  await httpClient.delete<void>(SERVICE_CATEGORY_ENDPOINTS.offering(input.id));
}
