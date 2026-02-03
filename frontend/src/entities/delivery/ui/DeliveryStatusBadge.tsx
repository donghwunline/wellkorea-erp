/**
 * Delivery status badge component.
 * Thin wrapper around generic StatusBadge with delivery-specific configuration.
 */

import { useTranslation } from 'react-i18next';
import { StatusBadge } from '@/shared/ui';
import type { DeliveryStatus } from '../model/delivery-status';
import { DeliveryStatusConfig } from '../model/delivery-status';

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus;
  /** Whether delivery is outdated (references old quotation version) */
  isOutdated?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function DeliveryStatusBadge({
  status,
  isOutdated = false,
  size,
  className,
}: Readonly<DeliveryStatusBadgeProps>) {
  const { t } = useTranslation('deliveries');

  return (
    <StatusBadge
      status={status}
      config={DeliveryStatusConfig}
      i18nKey="deliveries:status"
      size={size}
      dot
      warning={isOutdated ? t('warnings.outdatedQuotation') : undefined}
      className={className}
    />
  );
}
