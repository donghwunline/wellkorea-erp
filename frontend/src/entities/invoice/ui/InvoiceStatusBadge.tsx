/**
 * Invoice status badge component.
 * Displays invoice status with appropriate color coding.
 * Optionally shows warning overlay for outdated invoices.
 */

import { Badge, type BadgeVariant, Icon } from '@/shared/ui';
import type { InvoiceStatus } from '../model/invoice-status';
import { invoiceStatusConfig } from '../model/invoice-status';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  showKorean?: boolean;
  /** Whether invoice is outdated (references old quotation version) */
  isOutdated?: boolean;
}

export function InvoiceStatusBadge({
  status,
  showKorean = true,
  isOutdated = false,
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
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={variantMap[config.color]} dot>
        {showKorean ? config.labelKo : config.label}
      </Badge>
      {isOutdated && (
        <span
          className="inline-flex items-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400"
          title="Invoice references an outdated quotation version"
        >
          <Icon name="warning" className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}
