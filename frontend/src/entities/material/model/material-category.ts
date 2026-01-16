/**
 * Material Category Domain Model.
 *
 * Represents a category for physical materials.
 * Examples: Fasteners, Raw Materials, Tools, Consumables.
 */

// =============================================================================
// DOMAIN TYPES
// =============================================================================

/**
 * Material category domain model.
 */
export interface MaterialCategory {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly materialCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Material category list item - for dropdowns.
 */
export interface MaterialCategoryListItem {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly materialCount: number;
}

// =============================================================================
// BUSINESS RULES
// =============================================================================

/**
 * Pure functions for material category business rules.
 */
export const materialCategoryRules = {
  /**
   * Check if category can be deleted (no materials).
   */
  canDelete(category: MaterialCategory): boolean {
    return category.materialCount === 0;
  },

  /**
   * Check if category is active.
   */
  isActive(category: MaterialCategory): boolean {
    return category.isActive;
  },
};
