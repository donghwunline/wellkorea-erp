/**
 * Product Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 */

import type { Product, ProductListItem } from '../model/product';
import type { ProductType } from '../model/product-type';

// =============================================================================
// RESPONSE TYPES
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

/**
 * Command result returned by create/update/delete operations.
 */
export interface CommandResult {
  id: number;
  message: string;
}

// =============================================================================
// MAPPERS
// =============================================================================

/**
 * Product mapper functions.
 */
export const productMapper = {
  /**
   * Map product detail response to domain model.
   */
  toDomain(response: ProductDetailResponse): Product {
    return {
      id: response.id,
      sku: response.sku,
      name: response.name,
      description: response.description ?? null,
      productTypeId: response.productTypeId,
      productTypeName: response.productTypeName,
      baseUnitPrice: response.baseUnitPrice ?? null,
      unit: response.unit,
      isActive: response.isActive,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  },

  /**
   * Map product summary response to list item.
   */
  toListItem(response: ProductSummaryResponse): ProductListItem {
    return {
      id: response.id,
      sku: response.sku,
      name: response.name,
      description: response.description ?? null,
      productTypeId: response.productTypeId,
      productTypeName: response.productTypeName,
      baseUnitPrice: response.baseUnitPrice ?? null,
      unit: response.unit,
      isActive: response.isActive,
    };
  },
};

/**
 * ProductType mapper functions.
 */
export const productTypeMapper = {
  /**
   * Map product type response to domain model.
   */
  toDomain(response: ProductTypeResponse): ProductType {
    return {
      id: response.id,
      name: response.name,
      description: response.description ?? null,
      createdAt: response.createdAt,
    };
  },
};
