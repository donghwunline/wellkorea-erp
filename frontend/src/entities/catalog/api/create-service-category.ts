/**
 * Create Service Category Command.
 *
 * Command function with validation for creating a new service category.
 *
 * @example
 * ```typescript
 * // In a feature's mutation hook
 * const mutation = useMutation({
 *   mutationFn: createServiceCategory,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: catalogQueries.categories() });
 *   },
 * });
 *
 * // Call the mutation
 * mutation.mutate({ name: 'Laser Cutting', description: 'Metal cutting services' });
 * ```
 */

import { httpClient, SERVICE_CATEGORY_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './catalog.mapper';

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Request to create a new service category.
 */
interface CreateServiceCategoryRequest {
  name: string;
  description?: string | null;
}

// =============================================================================
// INPUT TYPE
// =============================================================================

/**
 * Input for creating a service category.
 * Validated before API call.
 */
export interface CreateServiceCategoryInput {
  name: string;
  description?: string | null;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Domain validation error for service category creation.
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
 * Validate create service category input.
 * @throws {ServiceCategoryValidationError} if validation fails
 */
function validateCreateInput(input: CreateServiceCategoryInput): void {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new ServiceCategoryValidationError('Category name is required', 'name');
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

  if (input.description && input.description.length > 500) {
    throw new ServiceCategoryValidationError(
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
function toCreateRequest(input: CreateServiceCategoryInput): CreateServiceCategoryRequest {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
  };
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Create a new service category.
 *
 * @param input - Service category creation data
 * @returns Command result with created ID
 * @throws {ServiceCategoryValidationError} if validation fails
 */
export async function createServiceCategory(
  input: CreateServiceCategoryInput
): Promise<CommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  return httpClient.post<CommandResult>(SERVICE_CATEGORY_ENDPOINTS.BASE, request);
}
