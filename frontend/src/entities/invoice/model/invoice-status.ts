/**
 * Invoice status enum and display configuration.
 */

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface InvoiceStatusConfig {
  label: string;
  labelKo: string;
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'orange';
  description: string;
}

export const invoiceStatusConfig: Record<InvoiceStatus, InvoiceStatusConfig> = {
  DRAFT: {
    label: 'Draft',
    labelKo: '작성중',
    color: 'gray',
    description: 'Invoice is being prepared',
  },
  ISSUED: {
    label: 'Issued',
    labelKo: '발행됨',
    color: 'blue',
    description: 'Invoice has been issued to customer',
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    labelKo: '일부납부',
    color: 'yellow',
    description: 'Customer has made partial payment',
  },
  PAID: {
    label: 'Paid',
    labelKo: '완납',
    color: 'green',
    description: 'Invoice has been fully paid',
  },
  OVERDUE: {
    label: 'Overdue',
    labelKo: '연체',
    color: 'red',
    description: 'Payment is past due date',
  },
  CANCELLED: {
    label: 'Cancelled',
    labelKo: '취소됨',
    color: 'orange',
    description: 'Invoice has been cancelled',
  },
};

/**
 * Get display label for status.
 */
export function getStatusLabel(status: InvoiceStatus, korean = false): string {
  return korean
    ? invoiceStatusConfig[status].labelKo
    : invoiceStatusConfig[status].label;
}

/**
 * Get color for status badge.
 */
export function getStatusColor(
  status: InvoiceStatus
): InvoiceStatusConfig['color'] {
  return invoiceStatusConfig[status].color;
}

/**
 * Check if status can transition to target status.
 */
export function canTransitionTo(
  current: InvoiceStatus,
  target: InvoiceStatus
): boolean {
  const transitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ['ISSUED', 'CANCELLED'],
    ISSUED: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
    PARTIALLY_PAID: ['PAID', 'OVERDUE', 'CANCELLED'],
    PAID: [], // Terminal state
    OVERDUE: ['PARTIALLY_PAID', 'PAID', 'CANCELLED'],
    CANCELLED: [], // Terminal state
  };

  return transitions[current].includes(target);
}

/**
 * Check if status can receive payments.
 */
export function canReceivePayment(status: InvoiceStatus): boolean {
  return ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(status);
}
