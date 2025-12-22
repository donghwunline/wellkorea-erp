/**
 * Approval utility functions and constants.
 *
 * Shared utilities for approval display components.
 * UI presentation constants are kept here (not in services layer).
 */

import type { BadgeVariant } from '@/components/ui';
import type { ApprovalStatus } from '@/services';

/**
 * Approval status display labels (Korean).
 * UI presentation constant.
 */
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

/**
 * Approval status badge variant mapping.
 */
export const APPROVAL_STATUS_BADGE_VARIANTS: Record<ApprovalStatus, BadgeVariant> = {
  PENDING: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
};
