/**
 * Delete Material Command.
 *
 * Soft deletes (deactivates) a material.
 *
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: deleteMaterial,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: materialQueries.lists() });
 *   },
 * });
 *
 * mutation.mutate({ id: 1 });
 * ```
 */

import { httpClient, MATERIAL_ENDPOINTS } from '@/shared/api';
import { MaterialValidationError } from './create-material';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input for deleting a material.
 */
export interface DeleteMaterialInput {
  id: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate delete material input.
 * @throws {MaterialValidationError} if validation fails
 */
function validateDeleteInput(input: DeleteMaterialInput): void {
  if (!input.id || input.id <= 0) {
    throw new MaterialValidationError('Invalid material ID', 'id');
  }
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Delete (deactivate) a material.
 *
 * @param input - Contains material ID to delete
 * @throws {MaterialValidationError} if validation fails
 */
export async function deleteMaterial(input: DeleteMaterialInput): Promise<void> {
  validateDeleteInput(input);
  await httpClient.delete(MATERIAL_ENDPOINTS.byId(input.id));
}
