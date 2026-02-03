/**
 * Purchase request status badge component.
 * Thin wrapper around generic StatusBadge with purchase-request-specific configuration.
 */

import { StatusBadge } from '@/shared/ui';
import type { PurchaseRequestStatus } from '../model/purchase-request-status';
import { PurchaseRequestStatusConfig } from '../model/purchase-request-status';

interface PurchaseRequestStatusBadgeProps {
  status: PurchaseRequestStatus;
  size?: 'sm' | 'md';
  dot?: boolean;
  warning?: string;
  className?: string;
}

export function PurchaseRequestStatusBadge({
  status,
  size,
  dot,
  warning,
  className,
}: Readonly<PurchaseRequestStatusBadgeProps>) {
  return (
    <StatusBadge
      status={status}
      config={PurchaseRequestStatusConfig}
      i18nKey="purchasing:purchaseRequest.status"
      size={size}
      dot={dot}
      warning={warning}
      className={className}
    />
  );
}
