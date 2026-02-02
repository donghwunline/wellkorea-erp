/**
 * Invoice status enum and display configuration.
 * Labels are handled via i18n (invoices.json status section).
 */

import type { BadgeVariant } from '@/shared/ui';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface InvoiceStatusConfig {
  color: BadgeVariant;
}

/**
 * Display configuration for each invoice status.
 * Colors map to design system Badge variants.
 * Labels are in locales/{lang}/invoices.json under "status" key.
 */
export const InvoiceStatusConfigs: Record<InvoiceStatus, InvoiceStatusConfig> = {
  DRAFT: { color: 'steel' },
  ISSUED: { color: 'info' },
  PARTIALLY_PAID: { color: 'warning' },
  PAID: { color: 'success' },
  OVERDUE: { color: 'danger' },
  CANCELLED: { color: 'copper' },
};

/**
 * Get color for status badge.
 */
export function getStatusColor(
  status: InvoiceStatus
): InvoiceStatusConfig['color'] {
  return InvoiceStatusConfigs[status].color;
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
