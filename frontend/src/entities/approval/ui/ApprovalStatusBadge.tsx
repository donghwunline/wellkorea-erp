/**
 * Approval Status Badge Component.
 *
 * Read-only display component for approval status.
 * Follows FSD rules: no router deps, no mutations, no feature-specific actions.
 */

import { Badge, type BadgeVariant } from '@/shared/ui';
import type { ApprovalStatus } from '../model';
import { ApprovalStatusConfig } from '../model';

/**
 * Props for ApprovalStatusBadge.
 */
export interface ApprovalStatusBadgeProps {
  /**
   * The approval status to display.
   */
  status: ApprovalStatus;

  /**
   * Size variant.
   * @default 'md'
   */
  size?: 'sm' | 'md';

  /**
   * Whether to show Korean label.
   * @default false
   */
  korean?: boolean;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

/**
 * Badge component for displaying approval status.
 *
 * Uses the design system Badge component with semantic colors:
 * - PENDING: warning (yellow/orange)
 * - APPROVED: success (green)
 * - REJECTED: danger (red)
 *
 * @example
 * ```tsx
 * <ApprovalStatusBadge status="PENDING" />
 * <ApprovalStatusBadge status="APPROVED" korean />
 * <ApprovalStatusBadge status="REJECTED" size="sm" />
 * ```
 */
export function ApprovalStatusBadge({
  status,
  size = 'md',
  korean = false,
  className = '',
}: Readonly<ApprovalStatusBadgeProps>) {
  const config = ApprovalStatusConfig[status];
  const label = korean ? config.labelKo : config.label;

  // Map our color names to BadgeVariant
  const variant: BadgeVariant = config.color;

  return (
    <Badge variant={variant} size={size} className={className}>
      {label}
    </Badge>
  );
}
