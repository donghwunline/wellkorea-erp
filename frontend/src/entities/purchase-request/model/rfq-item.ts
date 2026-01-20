/**
 * RFQ Item (Request for Quotation Item) domain model.
 */

import { RfqItemStatus, RfqItemStatusConfig, type StatusConfig } from './rfq-item-status';

export interface RfqItem {
  readonly itemId: string; // UUID string
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
  readonly purchaseOrderId: number | null; // null if no PO created yet
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
   * Must be SELECTED status (vendor was selected for PO) and no existing PO.
   */
  canCreateOrder(item: RfqItem): boolean {
    return (
      item.status === RfqItemStatus.SELECTED &&
      item.quotedPrice !== null &&
      item.purchaseOrderId === null
    );
  },

  /**
   * Check if a purchase order has been created for this RFQ item.
   */
  hasPurchaseOrder(item: RfqItem): boolean {
    return item.purchaseOrderId !== null;
  },

  /**
   * Check if the RFQ item can record a reply.
   */
  canRecordReply(item: RfqItem): boolean {
    return item.status === RfqItemStatus.SENT;
  },

  /**
   * Check if the RFQ item can be marked as no response.
   */
  canMarkNoResponse(item: RfqItem): boolean {
    return item.status === RfqItemStatus.SENT;
  },

  /**
   * Check if the RFQ item can be rejected.
   */
  canReject(item: RfqItem): boolean {
    return item.status === RfqItemStatus.REPLIED;
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
