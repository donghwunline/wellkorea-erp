/**
 * Approval status badge component.
 * Thin wrapper around generic StatusBadge with approval-specific configuration.
 */

import { StatusBadge } from '@/shared/ui';
import type { ApprovalStatus } from '../model/approval-status';
import { ApprovalStatusConfig } from '../model/approval-status';

export interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function ApprovalStatusBadge({
  status,
  size,
  className,
}: Readonly<ApprovalStatusBadgeProps>) {
  return (
    <StatusBadge
      status={status}
      config={ApprovalStatusConfig}
      i18nKey="approval:status"
      size={size}
      className={className}
    />
  );
}
