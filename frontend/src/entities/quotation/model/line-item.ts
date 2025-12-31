/**
 * Line item domain model.
 *
 * Represents a single product line in a quotation.
 * All properties are readonly to enforce immutability.
 */

import { Money } from '@/shared/formatting/money';

/**
 * Line item in a quotation (domain model).
 *
 * Note: All properties are readonly. Modifications create new objects.
 */
export interface LineItem {
  readonly id: number;
  readonly productId: number;
  readonly productSku: string;
  readonly productName: string;
  readonly sequence: number;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
  readonly notes: string | null;
}

/**
 * Line item pure functions for calculations.
 *
 * Business logic as pure functions rather than class methods.
 * This approach works better with React Query cache serialization.
 */
export const lineItemRules = {
  /**
   * Calculate line total (quantity * unit price).
   */
  getLineTotal(item: LineItem): number {
    return item.quantity * item.unitPrice;
  },

  /**
   * Format line total as currency.
   */
  getFormattedLineTotal(item: LineItem): string {
    return Money.format(lineItemRules.getLineTotal(item));
  },

  /**
   * Format unit price as currency.
   */
  getFormattedUnitPrice(item: LineItem): string {
    return Money.format(item.unitPrice);
  },

  /**
   * Check if line item has notes.
   */
  hasNotes(item: LineItem): boolean {
    return item.notes !== null && item.notes.trim().length > 0;
  },
};
