/**
 * Purchase request status constants and configuration.
 */

export const PurchaseRequestStatus = {
  DRAFT: 'DRAFT',
  RFQ_SENT: 'RFQ_SENT',
  VENDOR_SELECTED: 'VENDOR_SELECTED',
  CLOSED: 'CLOSED',
  CANCELED: 'CANCELED',
} as const;

export type PurchaseRequestStatus = typeof PurchaseRequestStatus[keyof typeof PurchaseRequestStatus];

export interface StatusConfig {
  readonly label: string;
  readonly labelKo: string;
  readonly color: 'steel' | 'info' | 'success' | 'warning' | 'danger';
  readonly description: string;
}

export const PurchaseRequestStatusConfig: Record<PurchaseRequestStatus, StatusConfig> = {
  [PurchaseRequestStatus.DRAFT]: {
    label: 'Draft',
    labelKo: '초안',
    color: 'steel',
    description: 'Request created, not yet sent to vendors',
  },
  [PurchaseRequestStatus.RFQ_SENT]: {
    label: 'RFQ Sent',
    labelKo: 'RFQ 발송',
    color: 'info',
    description: 'RFQ sent to vendors, awaiting quotes',
  },
  [PurchaseRequestStatus.VENDOR_SELECTED]: {
    label: 'Vendor Selected',
    labelKo: '업체 선정',
    color: 'warning',
    description: 'Vendor selected, awaiting PO completion',
  },
  [PurchaseRequestStatus.CLOSED]: {
    label: 'Closed',
    labelKo: '완료',
    color: 'success',
    description: 'Purchase order received, request closed',
  },
  [PurchaseRequestStatus.CANCELED]: {
    label: 'Canceled',
    labelKo: '취소',
    color: 'danger',
    description: 'Request cancelled',
  },
};
