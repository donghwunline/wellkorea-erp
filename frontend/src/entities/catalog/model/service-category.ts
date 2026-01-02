/**
 * Service Category domain model.
 *
 * Core domain types and business rules for service category entities.
 * Uses plain objects + pure functions pattern (not classes).
 */

/**
 * Full service category domain model.
 * Immutable structure using readonly properties.
 */
export interface ServiceCategory {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly vendorCount: number;
  readonly createdAt: string; // ISO datetime
  readonly updatedAt: string; // ISO datetime
}

/**
 * Service category summary for list views.
 * Contains only fields needed for table display.
 */
export interface ServiceCategoryListItem {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly vendorCount: number;
}

/**
 * Minimal service category type for business rules.
 * Allows rules to work with both ServiceCategory and ServiceCategoryListItem.
 */
type ServiceCategoryWithStatus = Pick<ServiceCategory, 'id' | 'isActive'>;

/**
 * Service category pure functions for business rules.
 *
 * @example
 * ```typescript
 * const category = await getServiceCategory(id);
 * if (serviceCategoryRules.canEdit(category)) {
 *   // Show edit button
 * }
 * if (serviceCategoryRules.hasVendors(category)) {
 *   // Display vendor count
 * }
 * ```
 */
export const serviceCategoryRules = {
  /**
   * Check if service category can be edited.
   * Only active categories can be edited.
   */
  canEdit(category: ServiceCategoryWithStatus): boolean {
    return category.isActive;
  },

  /**
   * Check if service category can be deleted (deactivated).
   * Only active categories can be deactivated.
   */
  canDelete(category: ServiceCategoryWithStatus): boolean {
    return category.isActive;
  },

  /**
   * Check if service category can be activated.
   * Only inactive categories can be activated.
   */
  canActivate(category: ServiceCategoryWithStatus): boolean {
    return !category.isActive;
  },

  /**
   * Check if service category has vendors.
   */
  hasVendors(category: Pick<ServiceCategory, 'vendorCount'>): boolean {
    return category.vendorCount > 0;
  },

  /**
   * Check if service category has a description.
   */
  hasDescription(category: Pick<ServiceCategory, 'description'>): boolean {
    return category.description !== null && category.description.trim().length > 0;
  },

  /**
   * Format vendor count for display.
   */
  formatVendorCount(category: Pick<ServiceCategory, 'vendorCount'>): string {
    const count = category.vendorCount;
    return count === 1 ? '1 vendor' : `${count} vendors`;
  },
};
