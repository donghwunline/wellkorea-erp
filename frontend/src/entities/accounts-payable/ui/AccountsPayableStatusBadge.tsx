/**
 * Accounts payable status badge component.
 * Thin wrapper around generic StatusBadge with AP-specific configuration.
 */

import { StatusBadge } from '@/shared/ui';
import type { CalculatedAPStatus } from '../model/accounts-payable-status';
import { APStatusConfigs } from '../model/accounts-payable-status';

interface AccountsPayableStatusBadgeProps {
  status: CalculatedAPStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function AccountsPayableStatusBadge({
  status,
  size,
  className,
}: Readonly<AccountsPayableStatusBadgeProps>) {
  return (
    <StatusBadge
      status={status}
      config={APStatusConfigs}
      i18nKey="purchasing:accountsPayable.status"
      size={size}
      className={className}
    />
  );
}
