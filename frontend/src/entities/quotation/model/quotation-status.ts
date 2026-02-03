/**
 * Quotation status enum and display configuration.
 *
 * Defines the lifecycle states of a quotation and their UI representation.
 */

/**
 * Quotation lifecycle status.
 * Const object pattern provides both type safety and runtime values.
 * Workflow: DRAFT → PENDING → APPROVED/REJECTED → SENDING → SENT → ACCEPTED
 */
export const QuotationStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

/**
 * Badge color variants from the design system.
 * Maps to: steel, copper, success, warning, danger, info, purple
 */
export type BadgeColor = 'steel' | 'copper' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

/**
 * Status display configuration.
 * Labels are handled via i18n (quotations.json status section).
 */
export interface StatusConfig {
  readonly color: BadgeColor;
}

/**
 * Display configuration for each quotation status.
 * Colors map to design system Badge variants.
 * Labels are in locales/{lang}/quotations.json under "status" key.
 */
export const QuotationStatusConfig: Record<QuotationStatus, StatusConfig> = {
  DRAFT: { color: 'steel' },
  PENDING: { color: 'warning' },
  APPROVED: { color: 'info' },
  SENDING: { color: 'copper' },
  SENT: { color: 'purple' },
  ACCEPTED: { color: 'success' },
  REJECTED: { color: 'danger' },
};

/**
 * Get status color for badge display.
 *
 * @param status - Quotation status
 */
export function getStatusColor(status: QuotationStatus): StatusConfig['color'] {
  return QuotationStatusConfig[status].color;
}
