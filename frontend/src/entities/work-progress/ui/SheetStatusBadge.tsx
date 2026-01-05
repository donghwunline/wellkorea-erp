/**
 * Sheet Status Badge.
 *
 * Pure display component for work progress sheet status.
 * Uses domain model status and configuration.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives all data via props
 */

import { Badge } from '@/shared/ui';
import { type SheetStatus, SheetStatusConfig } from '../model/step-status';

export interface SheetStatusBadgeProps {
  /**
   * Sheet status to display.
   */
  status: SheetStatus;

  /**
   * Optional size variant.
   */
  size?: 'sm' | 'md';

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Status badge component for work progress sheets.
 *
 * @example
 * ```tsx
 * <SheetStatusBadge status={sheet.status} />
 * ```
 */
export function SheetStatusBadge({
  status,
  size = 'md',
  className,
}: Readonly<SheetStatusBadgeProps>) {
  const config = SheetStatusConfig[status];

  return (
    <Badge variant={config.color} size={size} className={className}>
      {config.labelKo}
    </Badge>
  );
}
