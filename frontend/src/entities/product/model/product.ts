/**
 * Product domain model.
 *
 * Core domain types and business rules for product entities.
 * Uses plain objects + pure functions pattern (not classes).
 */

import type { ProductType } from './product-type';

/**
 * Full product domain model.
 * Immutable structure using readonly properties.
 */
export interface Product {
  readonly id: number;
  readonly sku: string;
  readonly name: string;
  readonly description: string | null;
  readonly productTypeId: number;
  readonly productTypeName: string;
  readonly baseUnitPrice: number | null;
  readonly unit: string;
  readonly isActive: boolean;
  readonly createdAt: string; // ISO datetime
  readonly updatedAt: string; // ISO datetime
}

/**
 * Product summary for list views.
 * Contains only fields needed for table display.
 */
export interface ProductListItem {
  readonly id: number;
  readonly sku: string;
  readonly name: string;
  readonly description: string | null;
  readonly productTypeId: number;
  readonly productTypeName: string;
  readonly baseUnitPrice: number | null;
  readonly unit: string;
  readonly isActive: boolean;
}

/**
 * Minimal product type for business rules.
 * Allows rules to work with both Product and ProductListItem.
 */
type ProductWithStatus = Pick<Product, 'id' | 'isActive'>;

/**
 * Product pure functions for business rules.
 *
 * @example
 * ```typescript
 * const product = await getProduct(id);
 * if (productRules.canEdit(product)) {
 *   // Show edit button
 * }
 * if (productRules.hasPrice(product)) {
 *   // Display price
 * }
 * ```
 */
export const productRules = {
  /**
   * Check if product can be edited.
   * Only active products can be edited.
   */
  canEdit(product: ProductWithStatus): boolean {
    return product.isActive;
  },

  /**
   * Check if product can be deleted (deactivated).
   * Only active products can be deactivated.
   */
  canDelete(product: ProductWithStatus): boolean {
    return product.isActive;
  },

  /**
   * Check if product can be activated.
   * Only inactive products can be activated.
   */
  canActivate(product: ProductWithStatus): boolean {
    return !product.isActive;
  },

  /**
   * Check if product has a price set.
   */
  hasPrice(product: Pick<Product, 'baseUnitPrice'>): boolean {
    return product.baseUnitPrice !== null && product.baseUnitPrice > 0;
  },

  /**
   * Check if product has a description.
   */
  hasDescription(product: Pick<Product, 'description'>): boolean {
    return product.description !== null && product.description.trim().length > 0;
  },

  /**
   * Format product price for display.
   */
  formatPrice(product: Pick<Product, 'baseUnitPrice' | 'unit'>): string | null {
    if (product.baseUnitPrice === null) return null;
    const formatted = new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(product.baseUnitPrice);
    return `${formatted}/${product.unit}`;
  },

  /**
   * Get product display name with SKU.
   */
  getDisplayName(product: Pick<Product, 'name' | 'sku'>): string {
    return `[${product.sku}] ${product.name}`;
  },
};

// Re-export ProductType for convenience
export type { ProductType };
