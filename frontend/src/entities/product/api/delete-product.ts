/**
 * Delete Product Command.
 *
 * Combines input validation and HTTP DELETE in one module.
 * Follows FSD pattern: entities/{entity}/api/delete-{entity}.ts
 */

import { DomainValidationError, httpClient, PRODUCT_ENDPOINTS } from '@/shared/api';

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Delete product input.
 */
export interface DeleteProductInput {
  id: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate delete product input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateDeleteInput(input: DeleteProductInput): void {
  if (!input.id || input.id <= 0) {
    throw new DomainValidationError('REQUIRED', 'id', '품목 ID가 필요합니다');
  }
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Delete (deactivate) a product.
 *
 * Validates input and calls API.
 *
 * @param input - Delete input with product ID
 * @throws DomainValidationError if validation fails
 *
 * @example
 * ```typescript
 * await deleteProduct({ id: 123 });
 * console.log('Product deleted');
 * ```
 */
export async function deleteProduct(input: DeleteProductInput): Promise<void> {
  validateDeleteInput(input);
  await httpClient.delete<void>(PRODUCT_ENDPOINTS.byId(input.id));
}
