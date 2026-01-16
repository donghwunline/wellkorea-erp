/**
 * Purchase order status constants and configuration.
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
  readonly label: string;
  readonly labelKo: string;
  readonly color: 'steel' | 'info' | 'success' | 'warning' | 'danger';
  readonly description: string;
}

export const PurchaseOrderStatusConfig: Record<PurchaseOrderStatus, StatusConfig> = {
  [PurchaseOrderStatus.DRAFT]: {
    label: 'Draft',
    labelKo: '초안',
    color: 'steel',
    description: 'Order created, not yet sent to vendor',
  },
  [PurchaseOrderStatus.SENT]: {
    label: 'Sent',
    labelKo: '발송',
    color: 'info',
    description: 'Order sent to vendor, awaiting confirmation',
  },
  [PurchaseOrderStatus.CONFIRMED]: {
    label: 'Confirmed',
    labelKo: '확정',
    color: 'warning',
    description: 'Vendor confirmed order',
  },
  [PurchaseOrderStatus.RECEIVED]: {
    label: 'Received',
    labelKo: '수령',
    color: 'success',
    description: 'Items received',
  },
  [PurchaseOrderStatus.CANCELED]: {
    label: 'Canceled',
    labelKo: '취소',
    color: 'danger',
    description: 'Order cancelled',
  },
};
