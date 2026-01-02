/**
 * Update Service Category Command.
 *
 * Command function with validation for updating an existing service category.
 *
 * @example
 * ```typescript
 * // In a feature's mutation hook
 * const mutation = useMutation({
 *   mutationFn: updateServiceCategory,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: catalogQueries.categories() });
 *   },
 * });
 *
 * // Call the mutation
 * mutation.mutate({ id: 1, name: 'Updated Name' });
 * ```
 */

import { httpClient, SERVICE_CATEGORY_ENDPOINTS } from '@/shared/api';
import type { CommandResult, UpdateServiceCategoryRequestDTO } from './catalog.dto';

// =============================================================================
// Input Type
// =============================================================================

/**
 * Input for updating a service category.
 * Validated before API call.
 */
export interface UpdateServiceCategoryInput {
  id: number;
  name?: string | null;
  description?: string | null;
  isActive?: boolean | null;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Domain validation error for service category update.
 */
export class ServiceCategoryValidationError extends Error {
  readonly field: string;

  constructor(message: string, field: string) {
    super(message);
    this.name = 'ServiceCategoryValidationError';
    this.field = field;
  }
}

/**
 * Validate update service category input.
 * @throws {ServiceCategoryValidationError} if validation fails
 */
function validateUpdateInput(input: UpdateServiceCategoryInput): void {
  if (!input.id || input.id <= 0) {
    throw new ServiceCategoryValidationError('Valid category ID is required', 'id');
  }

  // Validate name if provided
  if (input.name !== undefined && input.name !== null) {
    const trimmedName = input.name.trim();

    if (!trimmedName) {
      throw new ServiceCategoryValidationError('Category name cannot be empty', 'name');
    }

    if (trimmedName.length < 2) {
      throw new ServiceCategoryValidationError(
        'Category name must be at least 2 characters',
        'name'
      );
    }

    if (trimmedName.length > 100) {
      throw new ServiceCategoryValidationError(
        'Category name must not exceed 100 characters',
        'name'
      );
    }
  }

  // Validate description if provided
  if (input.description !== undefined && input.description !== null) {
    if (input.description.length > 500) {
      throw new ServiceCategoryValidationError(
        'Description must not exceed 500 characters',
        'description'
      );
    }
  }
}

// =============================================================================
// Request Mapping
// =============================================================================

/**
 * Map input to API request.
 */
function toUpdateRequest(input: UpdateServiceCategoryInput): UpdateServiceCategoryRequestDTO {
  const request: UpdateServiceCategoryRequestDTO = {};

  if (input.name !== undefined) {
    request.name = input.name?.trim() || null;
  }

  if (input.description !== undefined) {
    request.description = input.description?.trim() || null;
  }

  if (input.isActive !== undefined) {
    request.isActive = input.isActive;
  }

  return request;
}

// =============================================================================
// Command Function
// =============================================================================

/**
 * Update an existing service category.
 *
 * @param input - Service category update data
 * @returns Command result with updated ID
 * @throws {ServiceCategoryValidationError} if validation fails
 */
export async function updateServiceCategory(
  input: UpdateServiceCategoryInput
): Promise<CommandResult> {
  validateUpdateInput(input);
  const request = toUpdateRequest(input);
  return httpClient.put<CommandResult>(SERVICE_CATEGORY_ENDPOINTS.byId(input.id), request);
}
