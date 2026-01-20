/**
 * Delivery domain model and business rules.
 */

import type { DeliveryStatus } from './delivery-status';

/**
 * Delivery line item - represents a product in a delivery.
 */
export interface DeliveryLineItem {
  readonly id: number;
  readonly productId: number;
  readonly productName: string;
  readonly productSku: string | null;
  readonly quantityDelivered: number;
}

/**
 * Full delivery entity with all line items.
 */
export interface Delivery {
  readonly id: number;
  readonly projectId: number;
  readonly quotationId: number;
  readonly jobCode: string;
  readonly deliveryDate: string; // ISO date string
  readonly status: DeliveryStatus;
  readonly deliveredById: number;
  readonly deliveredByName: string;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lineItems: DeliveryLineItem[];
}

/**
 * Business rules for delivery domain.
 */
export const deliveryRules = {
  /**
   * Check if delivery can be edited (only PENDING can be edited).
   */
  canEdit(delivery: Delivery): boolean {
    return delivery.status === 'PENDING';
  },

  /**
   * Check if delivery can be marked as delivered.
   */
  canMarkDelivered(delivery: Delivery): boolean {
    return delivery.status === 'PENDING';
  },

  /**
   * Check if delivery can be marked as returned.
   */
  canMarkReturned(delivery: Delivery): boolean {
    return delivery.status === 'PENDING' || delivery.status === 'DELIVERED';
  },

  /**
   * Check if delivery is in a terminal state.
   */
  isTerminal(delivery: Delivery): boolean {
    return delivery.status === 'RETURNED';
  },

  /**
   * Calculate total quantity in delivery.
   */
  getTotalQuantity(delivery: Delivery): number {
    return delivery.lineItems.reduce((sum, item) => sum + item.quantityDelivered, 0);
  },

  /**
   * Get line item count.
   */
  getLineItemCount(delivery: Delivery): number {
    return delivery.lineItems.length;
  },

  /**
   * Calculate aggregate statistics for a collection of deliveries.
   * Excludes RETURNED deliveries from count calculations.
   */
  calculateStats(deliveries: readonly Delivery[]) {
    const activeDeliveries = deliveries.filter((d) => d.status !== 'RETURNED');

    return {
      totalDeliveries: activeDeliveries.length,
      totalItemsDelivered: activeDeliveries.reduce(
        (sum, d) => sum + this.getTotalQuantity(d),
        0
      ),
      pendingCount: activeDeliveries.filter((d) => d.status === 'PENDING').length,
      deliveredCount: activeDeliveries.filter((d) => d.status === 'DELIVERED').length,
    };
  },

  /**
   * Calculate total delivered quantity per product across multiple deliveries.
   * Excludes RETURNED deliveries from calculations.
   *
   * @param deliveries - Collection of deliveries to aggregate
   * @returns Map of productId to total delivered quantity
   */
  getDeliveredQuantityByProduct(deliveries: readonly Delivery[]): Map<number, number> {
    const activeDeliveries = deliveries.filter((d) => d.status !== 'RETURNED');
    const deliveredByProduct = new Map<number, number>();

    for (const delivery of activeDeliveries) {
      for (const item of delivery.lineItems) {
        const current = deliveredByProduct.get(item.productId) || 0;
        deliveredByProduct.set(item.productId, current + item.quantityDelivered);
      }
    }

    return deliveredByProduct;
  },

  /**
   * Check if delivery is outdated (references old quotation version).
   * A delivery is outdated when its quotationId differs from the latest accepted quotation.
   *
   * @param delivery - The delivery to check
   * @param latestAcceptedQuotationId - ID of the latest accepted quotation for the project
   * @returns true if delivery references an outdated quotation version
   */
  isOutdated(delivery: Delivery, latestAcceptedQuotationId: number | null): boolean {
    if (latestAcceptedQuotationId === null) {
      return false; // No accepted quotation means no way to be outdated
    }
    return delivery.quotationId !== latestAcceptedQuotationId;
  },

  /**
   * Check if delivery can be reassigned to a new quotation.
   * Only non-terminal deliveries can be reassigned.
   *
   * @param delivery - The delivery to check
   * @returns true if delivery can be reassigned
   */
  canReassign(delivery: Delivery): boolean {
    return !this.isTerminal(delivery);
  },
};
