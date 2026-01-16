/**
 * Purchase Request domain model.
 *
 * Represents a request for purchasing services/materials from vendors.
 * Dates are stored as ISO strings for React Query cache serialization.
 */

import { isPast, getNow } from '@/shared/lib/formatting';
import type { RfqItem } from './rfq-item';
import type { StatusConfig } from './purchase-request-status';
import { PurchaseRequestStatus, PurchaseRequestStatusConfig } from './purchase-request-status';

/**
 * Purchase request domain model (plain interface).
 */
export interface PurchaseRequest {
  readonly id: number;
  readonly requestNumber: string;
  readonly projectId: number;
  readonly jobCode: string;
  readonly projectName: string;
  readonly serviceCategoryId: number;
  readonly serviceCategoryName: string;
  readonly description: string;
  readonly quantity: number;
  readonly uom: string; // Unit of measure
  readonly requiredDate: string; // ISO date: "2025-02-15"
  readonly status: PurchaseRequestStatus;
  readonly createdById: number;
  readonly createdByName: string;
  readonly createdAt: string; // ISO datetime
  readonly updatedAt: string; // ISO datetime
  readonly rfqItems: readonly RfqItem[];
}

/**
 * Purchase request summary for list views.
 */
export interface PurchaseRequestListItem {
  readonly id: number;
  readonly requestNumber: string;
  readonly projectId: number;
  readonly jobCode: string;
  readonly serviceCategoryId: number;
  readonly serviceCategoryName: string;
  readonly description: string;
  readonly quantity: number;
  readonly uom: string;
  readonly requiredDate: string;
  readonly status: PurchaseRequestStatus;
  readonly createdByName: string;
  readonly createdAt: string;
}

/**
 * Base type for rules that work with both full and summary.
 */
type PurchaseRequestBase = Pick<PurchaseRequest, 'id' | 'status' | 'requiredDate'>;

/**
 * Purchase request business rules (read-only focused).
 */
export const purchaseRequestRules = {
  // ==================== COMPUTED VALUES ====================

  /**
   * Get status display configuration.
   */
  getStatusConfig(request: Pick<PurchaseRequest, 'status'>): StatusConfig {
    return PurchaseRequestStatusConfig[request.status];
  },

  /**
   * Check if required date is overdue.
   */
  isOverdue(request: PurchaseRequestBase, now: Date = getNow()): boolean {
    return (
      isPast(request.requiredDate, now) &&
      request.status !== PurchaseRequestStatus.CLOSED &&
      request.status !== PurchaseRequestStatus.CANCELED
    );
  },

  /**
   * Get number of RFQ items.
   */
  getRfqItemCount(request: PurchaseRequest): number {
    return request.rfqItems.length;
  },

  /**
   * Get number of quotes received.
   */
  getQuoteCount(request: PurchaseRequest): number {
    return request.rfqItems.filter(
      item => item.status === 'REPLIED' || item.status === 'SELECTED'
    ).length;
  },

  // ==================== BUSINESS RULES ====================

  /**
   * Check if request can be viewed in detail.
   */
  canViewDetails(/* request */): boolean {
    return true; // All requests can be viewed (read-only)
  },

  /**
   * Check if request has quotes to compare.
   */
  hasQuotesToCompare(request: PurchaseRequest): boolean {
    return purchaseRequestRules.getQuoteCount(request) > 0;
  },
};
