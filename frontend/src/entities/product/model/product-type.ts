/**
 * ProductType domain model.
 *
 * Represents a category for products (e.g., Raw Material, Finished Good).
 */

/**
 * Product type (category) domain model.
 * Immutable structure using readonly properties.
 */
export interface ProductType {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly createdAt: string; // ISO datetime
}

/**
 * ProductType pure functions for business rules.
 */
export const productTypeRules = {
  /**
   * Check if product type has a description.
   */
  hasDescription(productType: ProductType): boolean {
    return productType.description !== null && productType.description.trim().length > 0;
  },

  /**
   * Get display label for product type.
   */
  getDisplayLabel(productType: ProductType): string {
    return productType.name;
  },
};
