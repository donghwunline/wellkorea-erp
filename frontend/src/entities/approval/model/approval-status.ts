/**
 * Approval status enum and display configuration.
 *
 * Defines the lifecycle states of an approval request and their UI representation.
 */

/**
 * Approval request lifecycle status.
 * Const object pattern provides both type safety and runtime values.
 */
export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

/**
 * Badge color variants from the design system.
 */
export type BadgeColor = 'steel' | 'copper' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

/**
 * Status display configuration.
 * Labels are handled via i18n (approval.json status section).
 */
export interface StatusConfig {
  readonly color: BadgeColor;
}

/**
 * Display configuration for each approval status.
 * Colors map to design system Badge variants.
 * Labels are in locales/{lang}/approval.json under "status" key.
 */
export const ApprovalStatusConfig: Record<ApprovalStatus, StatusConfig> = {
  PENDING: { color: 'warning' },
  APPROVED: { color: 'success' },
  REJECTED: { color: 'danger' },
};

/**
 * Get status color for badge display.
 *
 * @param status - Approval status
 */
export function getStatusColor(status: ApprovalStatus): StatusConfig['color'] {
  return ApprovalStatusConfig[status].color;
}
