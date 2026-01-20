/**
 * Purchase Order domain model.
 *
 * Represents a confirmed order to a vendor.
 * Dates are stored as ISO strings for React Query cache serialization.
 */

import { isPast, getNow } from '@/shared/lib/formatting';
import { Money } from '@/shared/lib/formatting';
import type { StatusConfig } from './purchase-order-status';
import { PurchaseOrderStatus, PurchaseOrderStatusConfig } from './purchase-order-status';

/**
 * Purchase order domain model (plain interface).
 */
export interface PurchaseOrder {
  readonly id: number;
  readonly poNumber: string;
  readonly rfqItemId: string; // UUID string
  readonly purchaseRequestId: number;
  readonly purchaseRequestNumber: string;
  readonly projectId: number;
  readonly jobCode: string;
  readonly projectName: string;
  readonly vendorId: number;
  readonly vendorName: string;
  readonly orderDate: string; // ISO date: "2025-01-20"
  readonly expectedDeliveryDate: string; // ISO date: "2025-02-15"
  readonly totalAmount: number;
  readonly currency: string;
  readonly status: PurchaseOrderStatus;
  readonly notes: string | null;
  readonly createdById: number;
  readonly createdByName: string;
  readonly createdAt: string; // ISO datetime
  readonly updatedAt: string; // ISO datetime
}

/**
 * Purchase order summary for list views.
 */
export interface PurchaseOrderListItem {
  readonly id: number;
  readonly poNumber: string;
  readonly purchaseRequestId: number;
  readonly rfqItemId: string; // UUID string
  readonly projectId: number;
  readonly jobCode: string;
  readonly vendorId: number;
  readonly vendorName: string;
  readonly orderDate: string;
  readonly expectedDeliveryDate: string;
  readonly totalAmount: number;
  readonly currency: string;
  readonly status: PurchaseOrderStatus;
  readonly createdByName: string;
  readonly createdAt: string;
}

/**
 * Base type for rules that work with both full and summary.
 */
type PurchaseOrderBase = Pick<PurchaseOrder, 'id' | 'status' | 'expectedDeliveryDate'>;

/**
 * Purchase order business rules (read-only focused).
 */
export const purchaseOrderRules = {
  // ==================== COMPUTED VALUES ====================

  /**
   * Get status display configuration.
   */
  getStatusConfig(order: Pick<PurchaseOrder, 'status'>): StatusConfig {
    return PurchaseOrderStatusConfig[order.status];
  },

  /**
   * Format total amount as currency.
   */
  getFormattedTotal(order: Pick<PurchaseOrder, 'totalAmount' | 'currency'>): string {
    return Money.format(order.totalAmount, { currency: order.currency });
  },

  /**
   * Check if expected delivery date is overdue.
   */
  isOverdue(order: PurchaseOrderBase, now: Date = getNow()): boolean {
    return (
      isPast(order.expectedDeliveryDate, now) &&
      order.status !== PurchaseOrderStatus.RECEIVED &&
      order.status !== PurchaseOrderStatus.CANCELED
    );
  },

  /**
   * Check if order has notes.
   */
  hasNotes(order: PurchaseOrder): boolean {
    return order.notes !== null && order.notes.trim().length > 0;
  },

  // ==================== BUSINESS RULES ====================

  /**
   * Check if order can be viewed in detail.
   */
  canViewDetails(/* order */): boolean {
    return true; // All orders can be viewed (read-only)
  },

  /**
   * Check if order is pending delivery.
   */
  isPendingDelivery(order: PurchaseOrderBase): boolean {
    return order.status === PurchaseOrderStatus.CONFIRMED;
  },

  /**
   * Check if order is completed.
   */
  isCompleted(order: PurchaseOrderBase): boolean {
    return order.status === PurchaseOrderStatus.RECEIVED;
  },

  // ==================== STATUS TRANSITION RULES ====================

  /**
   * Check if order can be sent to vendor.
   */
  canSend(order: PurchaseOrderBase): boolean {
    return order.status === PurchaseOrderStatus.DRAFT;
  },

  /**
   * Check if order can be confirmed (vendor confirmation).
   */
  canConfirm(order: PurchaseOrderBase): boolean {
    return order.status === PurchaseOrderStatus.SENT;
  },

  /**
   * Check if order can be marked as received.
   */
  canReceive(order: PurchaseOrderBase): boolean {
    return order.status === PurchaseOrderStatus.CONFIRMED;
  },

  /**
   * Check if order can be canceled.
   */
  canCancel(order: PurchaseOrderBase): boolean {
    return (
      order.status !== PurchaseOrderStatus.RECEIVED &&
      order.status !== PurchaseOrderStatus.CANCELED
    );
  },

  /**
   * Check if order can be updated (notes, dates).
   */
  canUpdate(order: PurchaseOrderBase): boolean {
    return order.status === PurchaseOrderStatus.DRAFT;
  },
};
