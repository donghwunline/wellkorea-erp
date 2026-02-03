/**
 * Purchase order status constants and configuration.
 * Labels are handled via i18n (purchasing.json purchaseOrder.status section).
 */

export const PurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  CONFIRMED: 'CONFIRMED',
  RECEIVED: 'RECEIVED',
  CANCELED: 'CANCELED',
} as const;

export type PurchaseOrderStatus = typeof PurchaseOrderStatus[keyof typeof PurchaseOrderStatus];

export interface StatusConfig {
  readonly color: 'steel' | 'info' | 'success' | 'warning' | 'danger';
}

/**
 * Display configuration for each purchase order status.
 * Colors map to design system Badge variants.
 * Labels are in locales/{lang}/purchasing.json under "purchaseOrder.status" key.
 */
export const PurchaseOrderStatusConfig: Record<PurchaseOrderStatus, StatusConfig> = {
  [PurchaseOrderStatus.DRAFT]: { color: 'steel' },
  [PurchaseOrderStatus.SENT]: { color: 'info' },
  [PurchaseOrderStatus.CONFIRMED]: { color: 'warning' },
  [PurchaseOrderStatus.RECEIVED]: { color: 'success' },
  [PurchaseOrderStatus.CANCELED]: { color: 'danger' },
};
