/**
 * RFQ Item (Request for Quotation Item) domain model.
 */

import { RfqItemStatus, RfqItemStatusConfig, type StatusConfig } from './rfq-item-status';

export interface RfqItem {
  readonly id: number;
  readonly purchaseRequestId: number;
  readonly vendorId: number;
  readonly vendorName: string;
  readonly vendorOfferingId: number | null;
  readonly status: RfqItemStatus;
  readonly quotedPrice: number | null;
  readonly quotedLeadTime: number | null; // days
  readonly notes: string | null;
  readonly sentAt: string | null; // ISO datetime
  readonly repliedAt: string | null; // ISO datetime
  readonly createdAt: string; // ISO datetime
}

/**
 * RFQ Item business rules.
 */
export const rfqItemRules = {
  /**
   * Check if RFQ item has been quoted (vendor responded).
   */
  isQuoted(item: RfqItem): boolean {
    return item.status === RfqItemStatus.REPLIED || item.status === RfqItemStatus.SELECTED;
  },

  /**
   * Check if RFQ item can be selected for order creation.
   */
  canCreateOrder(item: RfqItem): boolean {
    return item.status === RfqItemStatus.REPLIED && item.quotedPrice !== null;
  },

  /**
   * Get formatted lead time.
   */
  getFormattedLeadTime(item: RfqItem): string {
    if (item.quotedLeadTime === null) return 'N/A';
    return `${item.quotedLeadTime}일`;
  },

  /**
   * Get status configuration.
   */
  getStatusConfig(item: RfqItem): StatusConfig {
    return RfqItemStatusConfig[item.status];
  },
};

// Re-export status types for convenience
export { RfqItemStatus, RfqItemStatusConfig } from './rfq-item-status';
export type { StatusConfig as RfqItemStatusConfigType } from './rfq-item-status';
