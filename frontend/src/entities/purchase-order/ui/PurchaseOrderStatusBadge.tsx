/**
 * Purchase Order Status Badge component.
 *
 * Displays the status of a purchase order as a colored badge.
 */

import { Badge } from '@/shared/ui';
import type { PurchaseOrderStatus } from '../model/purchase-order-status';
import { PurchaseOrderStatusConfig } from '../model/purchase-order-status';

interface PurchaseOrderStatusBadgeProps {
  /** Status to display */
  status: PurchaseOrderStatus;
  /** Show Korean label instead of English */
  korean?: boolean;
}

/**
 * Badge showing purchase order status with appropriate color.
 */
export function PurchaseOrderStatusBadge({ status, korean = false }: Readonly<PurchaseOrderStatusBadgeProps>) {
  const config = PurchaseOrderStatusConfig[status];

  return (
    <Badge variant={config.color}>
      {korean ? config.labelKo : config.label}
    </Badge>
  );
}
