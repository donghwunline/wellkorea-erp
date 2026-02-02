/**
 * RFQ item status badge component.
 * Thin wrapper around generic StatusBadge with RFQ-item-specific configuration.
 */

import { StatusBadge } from '@/shared/ui';
import type { RfqItemStatus } from '../model/rfq-item-status';
import { RfqItemStatusConfig } from '../model/rfq-item-status';

interface RfqItemStatusBadgeProps {
  status: RfqItemStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function RfqItemStatusBadge({
  status,
  size,
  className,
}: Readonly<RfqItemStatusBadgeProps>) {
  return (
    <StatusBadge
      status={status}
      config={RfqItemStatusConfig}
      i18nKey="purchasing:rfq.itemStatus"
      size={size}
      className={className}
    />
  );
}
