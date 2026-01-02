/**
 * Product DTOs.
 *
 * Internal types matching backend API responses.
 * These should NOT be exported from the entity barrel.
 */

// =============================================================================
// RESPONSE DTOs (from backend)
// =============================================================================

/**
 * Product type response from backend.
 */
export interface ProductTypeResponse {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
}

/**
 * Product summary response from backend (list view).
 */
export interface ProductSummaryResponse {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  productTypeId: number;
  productTypeName: string;
  baseUnitPrice?: number | null;
  unit: string;
  isActive: boolean;
}

/**
 * Full product details response from backend.
 */
export interface ProductDetailResponse {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  productTypeId: number;
  productTypeName: string;
  baseUnitPrice?: number | null;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// REQUEST DTOs (to backend)
// =============================================================================

/**
 * Create product request to backend.
 */
export interface CreateProductRequest {
  sku: string;
  name: string;
  description: string | null;
  productTypeId: number;
  baseUnitPrice: number | null;
  unit: string;
}

/**
 * Update product request to backend.
 */
export interface UpdateProductRequest {
  sku?: string | null;
  name?: string | null;
  description?: string | null;
  productTypeId?: number | null;
  baseUnitPrice?: number | null;
  unit?: string | null;
  isActive?: boolean | null;
}

// =============================================================================
// COMMAND RESULT
// =============================================================================

/**
 * Command result returned by create/update/delete operations.
 */
export interface CommandResult {
  id: number;
  message: string;
}
