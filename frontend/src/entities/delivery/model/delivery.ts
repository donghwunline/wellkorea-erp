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
};
