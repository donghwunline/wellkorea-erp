/**
 * Quotation status badge component.
 * Thin wrapper around generic StatusBadge with quotation-specific configuration.
 */

import { StatusBadge } from '@/shared/ui';
import type { QuotationStatus } from '../model/quotation-status';
import { QuotationStatusConfig } from '../model/quotation-status';

export interface QuotationStatusBadgeProps {
  status: QuotationStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuotationStatusBadge({
  status,
  size,
  className,
}: Readonly<QuotationStatusBadgeProps>) {
  return (
    <StatusBadge
      status={status}
      config={QuotationStatusConfig}
      i18nKey="quotations:status"
      size={size}
      className={className}
    />
  );
}
