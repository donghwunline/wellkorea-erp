/**
 * Update Material Category Command.
 *
 * Command function with validation for updating an existing material category.
 *
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: ({ id, input }) => updateMaterialCategory(id, input),
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: materialQueries.categories() });
 *   },
 * });
 * ```
 */

import { httpClient, MATERIAL_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './create-material-category';
import { MaterialCategoryValidationError } from './create-material-category';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Request to update a material category (internal).
 * All fields are optional (partial update).
 */
interface UpdateMaterialCategoryRequest {
  name?: string;
  description?: string | null;
  active?: boolean;
}

/**
 * Input for updating a material category.
 * All fields are optional (partial update).
 */
export interface UpdateMaterialCategoryInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate update material category input.
 * @throws {MaterialCategoryValidationError} if validation fails
 */
function validateUpdateInput(input: UpdateMaterialCategoryInput): void {
  if (input.name !== undefined) {
    const trimmedName = input.name.trim();

    if (!trimmedName) {
      throw new MaterialCategoryValidationError('Category name cannot be empty', 'name');
    }

    if (trimmedName.length < 2) {
      throw new MaterialCategoryValidationError(
        'Category name must be at least 2 characters',
        'name'
      );
    }

    if (trimmedName.length > 100) {
      throw new MaterialCategoryValidationError(
        'Category name must not exceed 100 characters',
        'name'
      );
    }
  }

  if (input.description !== undefined && input.description && input.description.length > 500) {
    throw new MaterialCategoryValidationError(
      'Description must not exceed 500 characters',
      'description'
    );
  }
}

// =============================================================================
// REQUEST MAPPING
// =============================================================================

/**
 * Map input to API request.
 */
function toUpdateRequest(input: UpdateMaterialCategoryInput): UpdateMaterialCategoryRequest {
  const request: UpdateMaterialCategoryRequest = {};

  if (input.name !== undefined) {
    request.name = input.name.trim();
  }

  if (input.description !== undefined) {
    request.description = input.description?.trim() || null;
  }

  if (input.isActive !== undefined) {
    request.active = input.isActive;
  }

  return request;
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Update an existing material category.
 *
 * @param id - Material category ID
 * @param input - Material category update data
 * @returns Command result with updated ID
 * @throws {MaterialCategoryValidationError} if validation fails
 */
export async function updateMaterialCategory(
  id: number,
  input: UpdateMaterialCategoryInput
): Promise<CommandResult> {
  if (!id || id <= 0) {
    throw new MaterialCategoryValidationError('Invalid category ID', 'id');
  }

  validateUpdateInput(input);
  const request = toUpdateRequest(input);
  return httpClient.put<CommandResult>(MATERIAL_ENDPOINTS.category(id), request);
}
