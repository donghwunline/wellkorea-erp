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
 */
export interface StatusConfig {
  readonly label: string;
  readonly labelKo: string;
  readonly color: BadgeColor;
}

/**
 * Display configuration for each approval status.
 * Colors map to design system Badge variants.
 */
export const ApprovalStatusConfig: Record<ApprovalStatus, StatusConfig> = {
  PENDING: { label: 'Pending', labelKo: '대기중', color: 'warning' },
  APPROVED: { label: 'Approved', labelKo: '승인됨', color: 'success' },
  REJECTED: { label: 'Rejected', labelKo: '반려됨', color: 'danger' },
};

/**
 * Get status label for display.
 *
 * @param status - Approval status
 * @param korean - Use Korean label (default: true for Korean-first app)
 */
export function getStatusLabel(status: ApprovalStatus, korean = true): string {
  const config = ApprovalStatusConfig[status];
  return korean ? config.labelKo : config.label;
}

/**
 * Get status color for badge display.
 *
 * @param status - Approval status
 */
export function getStatusColor(status: ApprovalStatus): StatusConfig['color'] {
  return ApprovalStatusConfig[status].color;
}
