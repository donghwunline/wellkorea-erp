/**
 * Create Product Command.
 *
 * Combines input validation, mapping, and HTTP POST in one module.
 * Follows FSD pattern: entities/{entity}/api/create-{entity}.ts
 */

import { DomainValidationError, httpClient, PRODUCT_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './product.mapper';

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Create product request to backend.
 */
interface CreateProductRequest {
  sku: string;
  name: string;
  description: string | null;
  productTypeId: number;
  baseUnitPrice: number | null;
  unit: string;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Create product input from UI forms.
 *
 * UI-friendly types that will be validated and converted to CreateProductRequest.
 */
export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  productTypeId: number;
  baseUnitPrice?: number;
  unit?: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate create product input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateCreateInput(input: CreateProductInput): void {
  const skuTrimmed = input.sku.trim();
  if (!skuTrimmed) {
    throw new DomainValidationError('REQUIRED', 'sku', '품목코드를 입력해주세요');
  }

  if (skuTrimmed.length > 50) {
    throw new DomainValidationError('MAX_LENGTH', 'sku', '품목코드는 50자 이하여야 합니다');
  }

  const nameTrimmed = input.name.trim();
  if (!nameTrimmed) {
    throw new DomainValidationError('REQUIRED', 'name', '품목명을 입력해주세요');
  }

  if (nameTrimmed.length > 200) {
    throw new DomainValidationError('MAX_LENGTH', 'name', '품목명은 200자 이하여야 합니다');
  }

  if (!input.productTypeId || input.productTypeId <= 0) {
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
 * Map create input to API request.
 * Trims whitespace from all string fields.
 */
function toCreateRequest(input: CreateProductInput): CreateProductRequest {
  return {
    sku: input.sku.trim(),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    productTypeId: input.productTypeId,
    baseUnitPrice: input.baseUnitPrice ?? null,
    unit: input.unit?.trim() || 'EA', // Default unit
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Create a new product.
 *
 * Validates input, maps to request, and calls API.
 *
 * @param input - UI form input
 * @returns Command result with created product ID
 * @throws DomainValidationError if validation fails
 *
 * @example
 * ```typescript
 * const result = await createProduct({
 *   sku: 'PRD-001',
 *   name: 'Widget A',
 *   productTypeId: 1,
 *   baseUnitPrice: 10000,
 *   unit: 'EA',
 * });
 * console.log(`Created product: ${result.id}`);
 * ```
 */
export async function createProduct(input: CreateProductInput): Promise<CommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  return httpClient.post<CommandResult>(PRODUCT_ENDPOINTS.BASE, request);
}
