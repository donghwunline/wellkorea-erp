/**
 * Quotation Status Badge.
 *
 * Pure display component for quotation status.
 * Uses domain model status and configuration.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives all data via props
 */

import { Badge } from '@/components/ui';
import { type QuotationStatus, QuotationStatusConfig } from '../model';

export interface QuotationStatusBadgeProps {
  /**
   * Quotation status to display.
   */
  status: QuotationStatus;

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
 * Status badge component for quotations.
 *
 * @example
 * ```tsx
 * <QuotationStatusBadge status={quotation.status} />
 * ```
 */
export function QuotationStatusBadge({
  status,
  size = 'md',
  className,
}: Readonly<QuotationStatusBadgeProps>) {
  const config = QuotationStatusConfig[status];

  return (
    <Badge variant={config.color} size={size} className={className}>
      {config.labelKo}
    </Badge>
  );
}
