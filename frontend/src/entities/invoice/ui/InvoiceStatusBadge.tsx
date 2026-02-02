/**
 * Invoice status badge component.
 * Thin wrapper around generic StatusBadge with invoice-specific configuration.
 */

import { useTranslation } from 'react-i18next';
import { StatusBadge } from '@/shared/ui';
import type { InvoiceStatus } from '../model/invoice-status';
import { InvoiceStatusConfigs } from '../model/invoice-status';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  /** Whether invoice is outdated (references old quotation version) */
  isOutdated?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function InvoiceStatusBadge({
  status,
  isOutdated = false,
  size,
  className,
}: Readonly<InvoiceStatusBadgeProps>) {
  const { t } = useTranslation('invoices');

  return (
    <StatusBadge
      status={status}
      config={InvoiceStatusConfigs}
      i18nKey="invoices:status"
      size={size}
      dot
      warning={isOutdated ? t('warnings.outdatedQuotation') : undefined}
      className={className}
    />
  );
}
