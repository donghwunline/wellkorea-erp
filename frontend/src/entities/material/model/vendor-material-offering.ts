/**
 * Vendor Material Offering domain model.
 *
 * Core domain types and business rules for vendor material offering entities.
 * Uses plain objects + pure functions pattern (not classes).
 */

/**
 * Full vendor material offering domain model.
 * Immutable structure using readonly properties.
 */
export interface VendorMaterialOffering {
  readonly id: number;
  readonly vendorId: number;
  readonly vendorName: string;
  readonly materialId: number;
  readonly materialName: string;
  readonly materialSku: string;
  readonly vendorMaterialCode: string | null;
  readonly vendorMaterialName: string | null;
  readonly unitPrice: number | null;
  readonly currency: string;
  readonly leadTimeDays: number | null;
  readonly minOrderQuantity: number | null;
  readonly effectiveFrom: string | null; // ISO date
  readonly effectiveTo: string | null; // ISO date
  readonly isPreferred: boolean;
  readonly notes: string | null;
  readonly createdAt: string; // ISO datetime
  readonly updatedAt: string; // ISO datetime
}

/**
 * Minimal vendor offering type for business rules.
 */
type VendorMaterialOfferingWithDates = Pick<VendorMaterialOffering, 'effectiveFrom' | 'effectiveTo'>;

/**
 * Vendor material offering pure functions for business rules.
 *
 * @example
 * ```typescript
 * const offering = await getVendorMaterialOffering(id);
 * if (vendorMaterialOfferingRules.isCurrentlyEffective(offering)) {
 *   // Show as active offering
 * }
 * if (vendorMaterialOfferingRules.hasPrice(offering)) {
 *   // Display price
 * }
 * ```
 */
export const vendorMaterialOfferingRules = {
  /**
   * Check if offering is currently effective.
   * An offering is effective if current date is within the effective date range.
   */
  isCurrentlyEffective(offering: VendorMaterialOfferingWithDates, now: Date = new Date()): boolean {
    const today = now.toISOString().split('T')[0];

    if (offering.effectiveFrom && today < offering.effectiveFrom) {
      return false;
    }
    if (offering.effectiveTo && today > offering.effectiveTo) {
      return false;
    }
    return true;
  },

  /**
   * Check if offering has expired.
   */
  isExpired(offering: VendorMaterialOfferingWithDates, now: Date = new Date()): boolean {
    if (!offering.effectiveTo) return false;
    const today = now.toISOString().split('T')[0];
    return today > offering.effectiveTo;
  },

  /**
   * Check if offering is not yet effective.
   */
  isFuture(offering: VendorMaterialOfferingWithDates, now: Date = new Date()): boolean {
    if (!offering.effectiveFrom) return false;
    const today = now.toISOString().split('T')[0];
    return today < offering.effectiveFrom;
  },

  /**
   * Check if offering has a price set.
   */
  hasPrice(offering: Pick<VendorMaterialOffering, 'unitPrice'>): boolean {
    return offering.unitPrice !== null && offering.unitPrice > 0;
  },

  /**
   * Check if offering has lead time set.
   */
  hasLeadTime(offering: Pick<VendorMaterialOffering, 'leadTimeDays'>): boolean {
    return offering.leadTimeDays !== null && offering.leadTimeDays > 0;
  },

  /**
   * Format price for display.
   */
  formatPrice(offering: Pick<VendorMaterialOffering, 'unitPrice' | 'currency'>): string | null {
    if (offering.unitPrice === null) return null;
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: offering.currency || 'KRW',
      maximumFractionDigits: 0,
    }).format(offering.unitPrice);
  },

  /**
   * Format lead time for display.
   */
  formatLeadTime(offering: Pick<VendorMaterialOffering, 'leadTimeDays'>): string | null {
    if (offering.leadTimeDays === null) return null;
    const days = offering.leadTimeDays;
    return days === 1 ? '1일' : `${days}일`;
  },

  /**
   * Get display name for offering.
   * Uses vendor material name if available, otherwise falls back to material name.
   */
  getDisplayName(
    offering: Pick<VendorMaterialOffering, 'vendorMaterialName' | 'materialName'>
  ): string {
    return offering.vendorMaterialName || offering.materialName;
  },
};
