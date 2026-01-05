/**
 * Step Status Badge.
 *
 * Pure display component for work progress step status.
 * Uses domain model status and configuration.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives all data via props
 */

import { Badge } from '@/shared/ui';
import { type StepStatus, StepStatusConfig } from '../model/step-status';

export interface StepStatusBadgeProps {
  /**
   * Step status to display.
   */
  status: StepStatus;

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
 * Status badge component for work progress steps.
 *
 * @example
 * ```tsx
 * <StepStatusBadge status={step.status} />
 * ```
 */
export function StepStatusBadge({
  status,
  size = 'md',
  className,
}: Readonly<StepStatusBadgeProps>) {
  const config = StepStatusConfig[status];

  return (
    <Badge variant={config.color} size={size} className={className}>
      {config.labelKo}
    </Badge>
  );
}
