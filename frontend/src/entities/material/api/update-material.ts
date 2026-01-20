/**
 * Update Material Command.
 *
 * Command function with validation for updating an existing material.
 *
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: ({ id, input }) => updateMaterial(id, input),
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: materialQueries.lists() });
 *     queryClient.invalidateQueries({ queryKey: materialQueries.details() });
 *   },
 * });
 * ```
 */

import { httpClient, MATERIAL_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './create-material';
import { MaterialValidationError } from './create-material';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Request to update a material (internal).
 * All fields are optional (partial update).
 */
interface UpdateMaterialRequest {
  name?: string;
  description?: string | null;
  categoryId?: number;
  unit?: string;
  standardPrice?: number | null;
  preferredVendorId?: number | null;
  active?: boolean;
}

/**
 * Input for updating a material.
 * All fields are optional (partial update).
 */
export interface UpdateMaterialInput {
  name?: string;
  description?: string | null;
  categoryId?: number;
  unit?: string;
  standardPrice?: number | null;
  preferredVendorId?: number | null;
  isActive?: boolean;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate update material input.
 * @throws {MaterialValidationError} if validation fails
 */
function validateUpdateInput(input: UpdateMaterialInput): void {
  if (input.name !== undefined) {
    const trimmedName = input.name.trim();

    if (!trimmedName) {
      throw new MaterialValidationError('Name cannot be empty', 'name');
    }

    if (trimmedName.length < 2) {
      throw new MaterialValidationError('Name must be at least 2 characters', 'name');
    }

    if (trimmedName.length > 200) {
      throw new MaterialValidationError('Name must not exceed 200 characters', 'name');
    }
  }

  if (input.categoryId !== undefined && input.categoryId <= 0) {
    throw new MaterialValidationError('Invalid category', 'categoryId');
  }

  if (input.unit !== undefined && input.unit.length > 20) {
    throw new MaterialValidationError('Unit must not exceed 20 characters', 'unit');
  }

  if (input.standardPrice !== undefined && input.standardPrice !== null && input.standardPrice < 0) {
    throw new MaterialValidationError('Standard price cannot be negative', 'standardPrice');
  }
}

// =============================================================================
// REQUEST MAPPING
// =============================================================================

/**
 * Map input to API request.
 */
function toUpdateRequest(input: UpdateMaterialInput): UpdateMaterialRequest {
  const request: UpdateMaterialRequest = {};

  if (input.name !== undefined) {
    request.name = input.name.trim();
  }

  if (input.description !== undefined) {
    request.description = input.description?.trim() || null;
  }

  if (input.categoryId !== undefined) {
    request.categoryId = input.categoryId;
  }

  if (input.unit !== undefined) {
    request.unit = input.unit.trim();
  }

  if (input.standardPrice !== undefined) {
    request.standardPrice = input.standardPrice;
  }

  if (input.preferredVendorId !== undefined) {
    request.preferredVendorId = input.preferredVendorId;
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
 * Update an existing material.
 *
 * @param id - Material ID
 * @param input - Material update data
 * @returns Command result with updated ID
 * @throws {MaterialValidationError} if validation fails
 */
export async function updateMaterial(
  id: number,
  input: UpdateMaterialInput
): Promise<CommandResult> {
  if (!id || id <= 0) {
    throw new MaterialValidationError('Invalid material ID', 'id');
  }

  validateUpdateInput(input);
  const request = toUpdateRequest(input);
  return httpClient.put<CommandResult>(MATERIAL_ENDPOINTS.byId(id), request);
}
