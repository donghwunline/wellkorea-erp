/**
 * Delete Service Category Command.
 *
 * Command function for deleting (deactivating) a service category.
 *
 * @example
 * ```typescript
 * // In a feature's mutation hook
 * const mutation = useMutation({
 *   mutationFn: deleteServiceCategory,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: catalogQueries.categories() });
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
 * Input for deleting a service category.
 */
export interface DeleteServiceCategoryInput {
  id: number;
}

// =============================================================================
// Command Function
// =============================================================================

/**
 * Delete (deactivate) a service category.
 *
 * @param input - Service category deletion data
 */
export async function deleteServiceCategory(input: DeleteServiceCategoryInput): Promise<void> {
  if (!input.id || input.id <= 0) {
    throw new Error('Valid category ID is required');
  }

  await httpClient.delete<void>(SERVICE_CATEGORY_ENDPOINTS.byId(input.id));
}
