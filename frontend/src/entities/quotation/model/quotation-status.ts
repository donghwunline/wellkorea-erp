/**
 * Quotation status enum and display configuration.
 *
 * Defines the lifecycle states of a quotation and their UI representation.
 */

/**
 * Quotation lifecycle status.
 * Const object pattern provides both type safety and runtime values.
 */
export const QuotationStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
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
 */
export interface StatusConfig {
  readonly label: string;
  readonly labelKo: string;
  readonly color: BadgeColor;
}

/**
 * Display configuration for each quotation status.
 * Colors map to design system Badge variants.
 */
export const QuotationStatusConfig: Record<QuotationStatus, StatusConfig> = {
  DRAFT: { label: 'Draft', labelKo: '작성중', color: 'steel' },
  PENDING: { label: 'Pending', labelKo: '결재중', color: 'warning' },
  APPROVED: { label: 'Approved', labelKo: '승인됨', color: 'info' },
  SENT: { label: 'Sent', labelKo: '발송완료', color: 'purple' },
  ACCEPTED: { label: 'Accepted', labelKo: '수락됨', color: 'success' },
  REJECTED: { label: 'Rejected', labelKo: '반려됨', color: 'danger' },
};

/**
 * Get status label for display.
 *
 * @param status - Quotation status
 * @param korean - Use Korean label (default: false)
 */
export function getStatusLabel(status: QuotationStatus, korean = false): string {
  const config = QuotationStatusConfig[status];
  return korean ? config.labelKo : config.label;
}

/**
 * Get status color for badge display.
 *
 * @param status - Quotation status
 */
export function getStatusColor(status: QuotationStatus): StatusConfig['color'] {
  return QuotationStatusConfig[status].color;
}
