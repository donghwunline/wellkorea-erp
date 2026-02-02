/**
 * Purchase request status constants and configuration.
 * Labels are handled via i18n (purchasing.json purchaseRequest.status section).
 */

export const PurchaseRequestStatus = {
  DRAFT: 'DRAFT',
  RFQ_SENT: 'RFQ_SENT',
  PENDING_VENDOR_APPROVAL: 'PENDING_VENDOR_APPROVAL',
  VENDOR_SELECTED: 'VENDOR_SELECTED',
  ORDERED: 'ORDERED',
  CLOSED: 'CLOSED',
  CANCELED: 'CANCELED',
} as const;

export type PurchaseRequestStatus = typeof PurchaseRequestStatus[keyof typeof PurchaseRequestStatus];

export interface StatusConfig {
  readonly color: 'steel' | 'info' | 'success' | 'warning' | 'danger';
}

/**
 * Display configuration for each purchase request status.
 * Colors map to design system Badge variants.
 * Labels are in locales/{lang}/purchasing.json under "purchaseRequest.status" key.
 */
export const PurchaseRequestStatusConfig: Record<PurchaseRequestStatus, StatusConfig> = {
  [PurchaseRequestStatus.DRAFT]: { color: 'steel' },
  [PurchaseRequestStatus.RFQ_SENT]: { color: 'info' },
  [PurchaseRequestStatus.PENDING_VENDOR_APPROVAL]: { color: 'warning' },
  [PurchaseRequestStatus.VENDOR_SELECTED]: { color: 'warning' },
  [PurchaseRequestStatus.ORDERED]: { color: 'info' },
  [PurchaseRequestStatus.CLOSED]: { color: 'success' },
  [PurchaseRequestStatus.CANCELED]: { color: 'danger' },
};
