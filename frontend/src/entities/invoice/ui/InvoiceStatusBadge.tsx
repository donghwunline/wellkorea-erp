/**
 * Invoice status badge component.
 * Displays invoice status with appropriate color coding.
 */

import { Badge, type BadgeVariant } from '@/shared/ui';
import type { InvoiceStatus } from '../model/invoice-status';
import { invoiceStatusConfig } from '../model/invoice-status';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  showKorean?: boolean;
}

export function InvoiceStatusBadge({
  status,
  showKorean = true,
}: InvoiceStatusBadgeProps) {
  const config = invoiceStatusConfig[status];

  const variantMap: Record<typeof config.color, BadgeVariant> = {
    gray: 'steel',
    blue: 'info',
    yellow: 'warning',
    green: 'success',
    red: 'danger',
    orange: 'warning',
  };

  return (
    <Badge variant={variantMap[config.color]} dot>
      {showKorean ? config.labelKo : config.label}
    </Badge>
  );
}
