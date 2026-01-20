/**
 * Create Material Command.
 *
 * Command function with validation for creating a new material.
 *
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: createMaterial,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: materialQueries.lists() });
 *   },
 * });
 *
 * mutation.mutate({
 *   sku: 'BOLT-M8X20',
 *   name: 'M8x20 Hex Bolt',
 *   categoryId: 1,
 *   unit: 'EA',
 * });
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
 * Request to create a new material (internal).
 */
interface CreateMaterialRequest {
  sku: string;
  name: string;
  description?: string | null;
  categoryId: number;
  unit?: string;
  standardPrice?: number | null;
  preferredVendorId?: number | null;
}

/**
 * Input for creating a material.
 * Validated before API call.
 */
export interface CreateMaterialInput {
  sku: string;
  name: string;
  description?: string | null;
  categoryId: number;
  unit?: string;
  standardPrice?: number | null;
  preferredVendorId?: number | null;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validation error for material operations.
 */
export class MaterialValidationError extends Error {
  readonly field: string;

  constructor(message: string, field: string) {
    super(message);
    this.name = 'MaterialValidationError';
    this.field = field;
  }
}

/**
 * Validate create material input.
 * @throws {MaterialValidationError} if validation fails
 */
function validateCreateInput(input: CreateMaterialInput): void {
  const trimmedSku = input.sku.trim();
  const trimmedName = input.name.trim();

  if (!trimmedSku) {
    throw new MaterialValidationError('SKU is required', 'sku');
  }

  if (trimmedSku.length > 50) {
    throw new MaterialValidationError('SKU must not exceed 50 characters', 'sku');
  }

  if (!trimmedName) {
    throw new MaterialValidationError('Name is required', 'name');
  }

  if (trimmedName.length < 2) {
    throw new MaterialValidationError('Name must be at least 2 characters', 'name');
  }

  if (trimmedName.length > 200) {
    throw new MaterialValidationError('Name must not exceed 200 characters', 'name');
  }

  if (!input.categoryId || input.categoryId <= 0) {
    throw new MaterialValidationError('Category is required', 'categoryId');
  }

  if (input.unit && input.unit.length > 20) {
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
function toCreateRequest(input: CreateMaterialInput): CreateMaterialRequest {
  return {
    sku: input.sku.trim(),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    categoryId: input.categoryId,
    unit: input.unit?.trim() || 'EA',
    standardPrice: input.standardPrice ?? null,
    preferredVendorId: input.preferredVendorId ?? null,
  };
}

// =============================================================================
// COMMAND FUNCTION
// =============================================================================

/**
 * Create a new material.
 *
 * @param input - Material creation data
 * @returns Command result with created ID
 * @throws {MaterialValidationError} if validation fails
 */
export async function createMaterial(input: CreateMaterialInput): Promise<CommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  return httpClient.post<CommandResult>(MATERIAL_ENDPOINTS.BASE, request);
}
