/**
 * Purchase order status badge component.
 * Thin wrapper around generic StatusBadge with purchase-order-specific configuration.
 */

import { StatusBadge } from '@/shared/ui';
import type { PurchaseOrderStatus } from '../model/purchase-order-status';
import { PurchaseOrderStatusConfig } from '../model/purchase-order-status';

interface PurchaseOrderStatusBadgeProps {
  status: PurchaseOrderStatus;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function PurchaseOrderStatusBadge({
  status,
  size,
  dot,
  className,
}: Readonly<PurchaseOrderStatusBadgeProps>) {
  return (
    <StatusBadge
      status={status}
      config={PurchaseOrderStatusConfig}
      i18nKey="purchasing:purchaseOrder.status"
      size={size}
      dot={dot}
      className={className}
    />
  );
}
