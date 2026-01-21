/**
 * Badge component for displaying calculated AP status.
 */

import { Badge, type BadgeVariant } from '@/shared/ui';
import type { CalculatedAPStatus } from '../model/accounts-payable-status';
import { getAPStatusConfig } from '../model/accounts-payable-status';

interface AccountsPayableStatusBadgeProps {
  status: CalculatedAPStatus;
}

const variantMap: Record<CalculatedAPStatus, BadgeVariant> = {
  PENDING: 'warning',
  PARTIALLY_PAID: 'copper',
  PAID: 'success',
};

export function AccountsPayableStatusBadge({ status }: AccountsPayableStatusBadgeProps) {
  const config = getAPStatusConfig(status);

  return <Badge variant={variantMap[status]}>{config.label}</Badge>;
}
