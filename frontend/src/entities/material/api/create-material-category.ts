/**
 * Create Material Category Command.
 *
 * Command function with validation for creating a new material category.
 *
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: createMaterialCategory,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: materialQueries.categories() });
 *   },
 * });
 *
 * mutation.mutate({ name: 'Fasteners', description: 'Bolts, screws, and nuts' });
 * ```
 */

import { httpClient, MATERIAL_ENDPOINTS } from '@/shared/api';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Command result from create/update operations.
 */
export interface CommandResult {
  id: number;
  message: string;
}

/**
 * Request to create a new material category (internal).
 */
interface CreateMaterialCategoryRequest {
  name: string;
  description?: string | null;
}

/**
 * Input for creating a material category.
 * Validated before API call.
 */
export interface CreateMaterialCategoryInput {
  name: string;
  description?: string | null;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validation error for material category operations.
 */
export class MaterialCategoryValidationError extends Error {
  readonly field: string;

  constructor(message: string, field: string) {
    super(message);
    this.name = 'MaterialCategoryValidationError';
    this.field = field;
  }
}

/**
 * Validate create material category input.
 * @throws {MaterialCategoryValidationError} if validation fails
 */
function validateCreateInput(input: CreateMaterialCategoryInput): void {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new MaterialCategoryValidationError('Category name is required', 'name');
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

  if (input.description && input.description.length > 500) {
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
function toCreateRequest(input: CreateMaterialCategoryInput): CreateMaterialCategoryRequest {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
  };
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Create a new material category.
 *
 * @param input - Material category creation data
 * @returns Command result with created ID
 * @throws {MaterialCategoryValidationError} if validation fails
 */
export async function createMaterialCategory(
  input: CreateMaterialCategoryInput
): Promise<CommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  return httpClient.post<CommandResult>(MATERIAL_ENDPOINTS.categories, request);
}
