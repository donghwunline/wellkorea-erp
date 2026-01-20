/**
 * Delete Material Category Command.
 *
 * Soft deletes (deactivates) a material category.
 *
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: deleteMaterialCategory,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: materialQueries.categories() });
 *   },
 * });
 *
 * mutation.mutate({ id: 1 });
 * ```
 */

import { httpClient, MATERIAL_ENDPOINTS } from '@/shared/api';
import { MaterialCategoryValidationError } from './create-material-category';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input for deleting a material category.
 */
export interface DeleteMaterialCategoryInput {
  id: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate delete material category input.
 * @throws {MaterialCategoryValidationError} if validation fails
 */
function validateDeleteInput(input: DeleteMaterialCategoryInput): void {
  if (!input.id || input.id <= 0) {
    throw new MaterialCategoryValidationError('Invalid category ID', 'id');
  }
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Delete (deactivate) a material category.
 *
 * @param input - Contains category ID to delete
 * @throws {MaterialCategoryValidationError} if validation fails
 */
export async function deleteMaterialCategory(input: DeleteMaterialCategoryInput): Promise<void> {
  validateDeleteInput(input);
  await httpClient.delete(MATERIAL_ENDPOINTS.category(input.id));
}
