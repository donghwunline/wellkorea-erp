/**
 * Update Product Command.
 *
 * Combines input validation, mapping, and HTTP PUT in one module.
 * Follows FSD pattern: entities/{entity}/api/update-{entity}.ts
 */

import { DomainValidationError, httpClient, PRODUCT_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './product.mapper';

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Update product request to backend.
 */
interface UpdateProductRequest {
  sku?: string | null;
  name?: string | null;
  description?: string | null;
  productTypeId?: number | null;
  baseUnitPrice?: number | null;
  unit?: string | null;
  isActive?: boolean | null;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Update product input from UI forms.
 *
 * All fields optional - only provided fields will be updated.
 */
export interface UpdateProductInput {
  id: number;
  sku?: string;
  name?: string;
  description?: string;
  productTypeId?: number;
  baseUnitPrice?: number;
  unit?: string;
  isActive?: boolean;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate update product input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateUpdateInput(input: UpdateProductInput): void {
  if (!input.id || input.id <= 0) {
    throw new DomainValidationError('REQUIRED', 'id', '품목 ID가 필요합니다');
  }

  if (input.sku !== undefined) {
    const skuTrimmed = input.sku.trim();
    if (!skuTrimmed) {
      throw new DomainValidationError('REQUIRED', 'sku', '품목코드를 입력해주세요');
    }
    if (skuTrimmed.length > 50) {
      throw new DomainValidationError('MAX_LENGTH', 'sku', '품목코드는 50자 이하여야 합니다');
    }
  }

  if (input.name !== undefined) {
    const nameTrimmed = input.name.trim();
    if (!nameTrimmed) {
      throw new DomainValidationError('REQUIRED', 'name', '품목명을 입력해주세요');
    }
    if (nameTrimmed.length > 200) {
      throw new DomainValidationError('MAX_LENGTH', 'name', '품목명은 200자 이하여야 합니다');
    }
  }

  if (input.productTypeId !== undefined && input.productTypeId <= 0) {
    throw new DomainValidationError('REQUIRED', 'productTypeId', '품목 유형을 선택해주세요');
  }

  if (input.baseUnitPrice !== undefined && input.baseUnitPrice < 0) {
    throw new DomainValidationError('INVALID_VALUE', 'baseUnitPrice', '단가는 0 이상이어야 합니다');
  }
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map update input to API request.
 * Only includes provided fields, trims whitespace from strings.
 */
function toUpdateRequest(input: UpdateProductInput): UpdateProductRequest {
  const request: UpdateProductRequest = {};

  if (input.sku !== undefined) {
    request.sku = input.sku.trim() || null;
  }

  if (input.name !== undefined) {
    request.name = input.name.trim() || null;
  }

  if (input.description !== undefined) {
    request.description = input.description.trim() || null;
  }

  if (input.productTypeId !== undefined) {
    request.productTypeId = input.productTypeId;
  }

  if (input.baseUnitPrice !== undefined) {
    request.baseUnitPrice = input.baseUnitPrice;
  }

  if (input.unit !== undefined) {
    request.unit = input.unit.trim() || null;
  }

  if (input.isActive !== undefined) {
    request.isActive = input.isActive;
  }

  return request;
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Update an existing product.
 *
 * Validates input, maps to request, and calls API.
 *
 * @param input - UI form input with product ID and fields to update
 * @returns Command result with updated product ID
 * @throws DomainValidationError if validation fails
 *
 * @example
 * ```typescript
 * const result = await updateProduct({
 *   id: 123,
 *   name: 'Updated Widget A',
 *   baseUnitPrice: 15000,
 * });
 * console.log(`Updated product: ${result.id}`);
 * ```
 */
export async function updateProduct(input: UpdateProductInput): Promise<CommandResult> {
  validateUpdateInput(input);
  const request = toUpdateRequest(input);
  return httpClient.put<CommandResult>(PRODUCT_ENDPOINTS.byId(input.id), request);
}
