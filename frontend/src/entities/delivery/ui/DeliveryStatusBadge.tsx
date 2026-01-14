/**
 * Delivery status badge component.
 * Displays delivery status with appropriate color coding.
 * Optionally shows warning overlay for outdated deliveries.
 */

import { Badge, type BadgeVariant, Icon } from '@/shared/ui';
import type { DeliveryStatus } from '../model/delivery-status';
import { DELIVERY_STATUS_CONFIG } from '../model/delivery-status';

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus;
  showKorean?: boolean;
  /** Whether delivery is outdated (references old quotation version) */
  isOutdated?: boolean;
}

export function DeliveryStatusBadge({
  status,
  showKorean = true,
  isOutdated = false,
}: DeliveryStatusBadgeProps) {
  const config = DELIVERY_STATUS_CONFIG[status];

  const variantMap: Record<typeof config.color, BadgeVariant> = {
    yellow: 'warning',
    green: 'success',
    red: 'danger',
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={variantMap[config.color]} dot>
        {showKorean ? config.labelKo : config.label}
      </Badge>
      {isOutdated && (
        <span
          className="inline-flex items-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400"
          title="Delivery references an outdated quotation version"
        >
          <Icon name="warning" className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}
