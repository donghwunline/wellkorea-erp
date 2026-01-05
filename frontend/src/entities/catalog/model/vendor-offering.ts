/**
 * Vendor Service Offering domain model.
 *
 * Core domain types and business rules for vendor offering entities.
 * Uses plain objects + pure functions pattern (not classes).
 */

/**
 * Full vendor service offering domain model.
 * Immutable structure using readonly properties.
 */
export interface VendorOffering {
  readonly id: number;
  readonly vendorId: number;
  readonly vendorName: string;
  readonly serviceCategoryId: number;
  readonly serviceCategoryName: string;
  readonly vendorServiceCode: string | null;
  readonly vendorServiceName: string | null;
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
type VendorOfferingWithDates = Pick<VendorOffering, 'effectiveFrom' | 'effectiveTo'>;

/**
 * Vendor offering pure functions for business rules.
 *
 * @example
 * ```typescript
 * const offering = await getVendorOffering(id);
 * if (vendorOfferingRules.isCurrentlyEffective(offering)) {
 *   // Show as active offering
 * }
 * if (vendorOfferingRules.hasPrice(offering)) {
 *   // Display price
 * }
 * ```
 */
export const vendorOfferingRules = {
  /**
   * Check if offering is currently effective.
   * An offering is effective if current date is within the effective date range.
   */
  isCurrentlyEffective(offering: VendorOfferingWithDates, now: Date = new Date()): boolean {
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
  isExpired(offering: VendorOfferingWithDates, now: Date = new Date()): boolean {
    if (!offering.effectiveTo) return false;
    const today = now.toISOString().split('T')[0];
    return today > offering.effectiveTo;
  },

  /**
   * Check if offering is not yet effective.
   */
  isFuture(offering: VendorOfferingWithDates, now: Date = new Date()): boolean {
    if (!offering.effectiveFrom) return false;
    const today = now.toISOString().split('T')[0];
    return today < offering.effectiveFrom;
  },

  /**
   * Check if offering has a price set.
   */
  hasPrice(offering: Pick<VendorOffering, 'unitPrice'>): boolean {
    return offering.unitPrice !== null && offering.unitPrice > 0;
  },

  /**
   * Check if offering has lead time set.
   */
  hasLeadTime(offering: Pick<VendorOffering, 'leadTimeDays'>): boolean {
    return offering.leadTimeDays !== null && offering.leadTimeDays > 0;
  },

  /**
   * Format price for display.
   */
  formatPrice(offering: Pick<VendorOffering, 'unitPrice' | 'currency'>): string | null {
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
  formatLeadTime(offering: Pick<VendorOffering, 'leadTimeDays'>): string | null {
    if (offering.leadTimeDays === null) return null;
    const days = offering.leadTimeDays;
    return days === 1 ? '1 day' : `${days} days`;
  },

  /**
   * Get display name for offering.
   * Uses vendor service name if available, otherwise falls back to service category name.
   */
  getDisplayName(
    offering: Pick<VendorOffering, 'vendorServiceName' | 'serviceCategoryName'>
  ): string {
    return offering.vendorServiceName || offering.serviceCategoryName;
  },
};
