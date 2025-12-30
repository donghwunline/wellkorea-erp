/**
 * Product service types.
 * Matches backend Product domain DTOs.
 */

import type { Paginated } from '@/shared/api/types';

// ============================================================================
// Product Types
// ============================================================================

/**
 * Product type (category) for products.
 */
export interface ProductType {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
}

/**
 * Product summary for list views.
 */
export interface ProductSummary {
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
 * Full product details.
 */
export interface ProductDetails {
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

/**
 * Request to create a new product.
 */
export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string | null;
  productTypeId: number;
  baseUnitPrice?: number | null;
  unit?: string;
}

/**
 * Request to update a product.
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

// ============================================================================
// CQRS Command Result
// ============================================================================

/**
 * Command result returned by create/update operations.
 */
export interface ProductCommandResult {
  id: number;
  message: string;
}

// ============================================================================
// List/Search Parameters
// ============================================================================

/**
 * Parameters for listing products.
 */
export interface ProductListParams {
  page?: number;
  size?: number;
  productTypeId?: number;
  search?: string;
}

/**
 * Parameters for searching products (combobox/autocomplete).
 */
export interface ProductSearchParams {
  query: string;
  page?: number;
  size?: number;
}

/**
 * Paginated product response.
 */
export type PaginatedProducts = Paginated<ProductSummary>;
