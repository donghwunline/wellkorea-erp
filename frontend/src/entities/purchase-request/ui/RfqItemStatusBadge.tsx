/**
 * RFQ Item Status Badge component.
 *
 * Displays the status of an RFQ item as a colored badge.
 */

import { Badge } from '@/shared/ui';
import type { RfqItemStatus } from '../model/rfq-item-status';
import { RfqItemStatusConfig } from '../model/rfq-item-status';

interface RfqItemStatusBadgeProps {
  /** Status to display */
  status: RfqItemStatus;
  /** Show Korean label instead of English */
  korean?: boolean;
}

/**
 * Badge showing RFQ item status with appropriate color.
 */
export function RfqItemStatusBadge({ status, korean = false }: Readonly<RfqItemStatusBadgeProps>) {
  const config = RfqItemStatusConfig[status];

  return (
    <Badge variant={config.color}>
      {korean ? config.labelKo : config.label}
    </Badge>
  );
}
