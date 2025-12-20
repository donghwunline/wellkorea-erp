/**
 * Quotation utility functions and constants.
 *
 * Shared utilities for quotation display components.
 */

import type { BadgeVariant } from '@/components/ui';
import type { QuotationStatus } from '@/services';

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
