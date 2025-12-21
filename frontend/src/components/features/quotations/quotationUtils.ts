/**
 * Quotation utility functions and constants.
 *
 * Shared utilities for quotation display components.
 * UI presentation constants are kept here (not in services layer).
 */

import type { BadgeVariant } from '@/components/ui';
import type { ApprovalStatus, QuotationStatus } from '@/services';

/**
 * Quotation status display labels (Korean).
 * UI presentation constant - moved from services layer.
 */
export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  DRAFT: '작성중',
  PENDING: '결재중',
  APPROVED: '승인됨',
  SENT: '발송완료',
  ACCEPTED: '수락됨',
  REJECTED: '반려됨',
};

/**
 * Approval status display labels (Korean).
 * UI presentation constant - moved from services layer.
 */
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

/**
 * Status badge variant mapping.
 */
export const QUOTATION_STATUS_BADGE_VARIANTS: Record<QuotationStatus, BadgeVariant> = {
  DRAFT: 'warning',
  PENDING: 'info',
  APPROVED: 'success',
  SENT: 'copper',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

/**
 * Format date for display.
 */
export function formatQuotationDate(dateStr: string | null, includeTime = false): string {
  if (!dateStr) return '-';
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  };
  return new Date(dateStr).toLocaleDateString('ko-KR', options);
}

/**
 * Format currency in KRW.
 */
export function formatQuotationCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}
