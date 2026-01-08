/**
 * Delivery status badge component.
 * Displays delivery status with appropriate color coding.
 */

import { Badge, type BadgeVariant } from '@/shared/ui';
import type { DeliveryStatus } from '../model/delivery-status';
import { DELIVERY_STATUS_CONFIG } from '../model/delivery-status';

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus;
  showKorean?: boolean;
}

export function DeliveryStatusBadge({
  status,
  showKorean = true,
}: DeliveryStatusBadgeProps) {
  const config = DELIVERY_STATUS_CONFIG[status];

  const variantMap: Record<typeof config.color, BadgeVariant> = {
    yellow: 'warning',
    green: 'success',
    red: 'danger',
  };

  return (
    <Badge variant={variantMap[config.color]} dot>
      {showKorean ? config.labelKo : config.label}
    </Badge>
  );
}
