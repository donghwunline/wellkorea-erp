/**
 * Purchase Request Status Badge component.
 *
 * Displays the status of a purchase request as a colored badge.
 */

import { Badge } from '@/shared/ui';
import type { PurchaseRequestStatus } from '../model/purchase-request-status';
import { PurchaseRequestStatusConfig } from '../model/purchase-request-status';

interface PurchaseRequestStatusBadgeProps {
  /** Status to display */
  status: PurchaseRequestStatus;
  /** Show Korean label instead of English */
  korean?: boolean;
}

/**
 * Badge showing purchase request status with appropriate color.
 */
export function PurchaseRequestStatusBadge({
  status,
  korean = false,
}: Readonly<PurchaseRequestStatusBadgeProps>) {
  const config = PurchaseRequestStatusConfig[status];

  return (
    <Badge variant={config.color}>
      {korean ? config.labelKo : config.label}
    </Badge>
  );
}
