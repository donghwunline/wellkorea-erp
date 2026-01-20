/**
 * Material Domain Model.
 *
 * Represents a physical material/item that can be purchased.
 * Examples: bolts, screws, raw materials, tools, consumables.
 */

// =============================================================================
// DOMAIN TYPES
// =============================================================================

/**
 * Material domain model - full representation.
 */
export interface Material {
  readonly id: number;
  readonly sku: string;
  readonly name: string;
  readonly description: string | null;
  readonly categoryId: number;
  readonly categoryName: string;
  readonly unit: string;
  readonly standardPrice: number | null;
  readonly preferredVendorId: number | null;
  readonly preferredVendorName: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Material list item - summary for list views.
 */
export interface MaterialListItem {
  readonly id: number;
  readonly sku: string;
  readonly name: string;
  readonly description: string | null;
  readonly categoryId: number;
  readonly categoryName: string;
  readonly unit: string;
  readonly standardPrice: number | null;
  readonly preferredVendorId: number | null;
  readonly preferredVendorName: string | null;
  readonly isActive: boolean;
}

// =============================================================================
// BUSINESS RULES
// =============================================================================

/**
 * Pure functions for material business rules.
 */
export const materialRules = {
  /**
   * Check if material can be edited.
   */
  canEdit(material: Material): boolean {
    return material.isActive;
  },

  /**
   * Check if material has a standard price.
   */
  hasPrice(material: Material): boolean {
    return material.standardPrice != null && material.standardPrice > 0;
  },

  /**
   * Check if material has a preferred vendor.
   */
  hasPreferredVendor(material: Material): boolean {
    return material.preferredVendorId != null;
  },
};
