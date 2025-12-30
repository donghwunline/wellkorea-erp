/**
 * Quotation domain model.
 *
 * Represents the core quotation entity with business rules as pure functions.
 * Dates are stored as ISO strings for React Query cache serialization.
 */

import { isPast, daysBetween, getNow } from '@/shared/lib/date';
import { Money } from '@/shared/lib/money';
import type { LineItem } from './line-item';
import { lineItemRules } from './line-item';
import { QuotationStatus, QuotationStatusConfig } from './quotation-status';
import type { StatusConfig } from './quotation-status';

/**
 * Quotation domain model (plain interface).
 *
 * All properties are readonly to enforce immutability.
 * Dates stored as ISO strings for serialization compatibility.
 */
export interface Quotation {
  readonly id: number;
  readonly projectId: number;
  readonly projectName: string;
  readonly jobCode: string;
  readonly version: number;
  readonly status: QuotationStatus;
  readonly quotationDate: string; // ISO date: "2025-01-15"
  readonly validityDays: number;
  readonly expiryDate: string; // ISO date: "2025-01-30"
  readonly totalAmount: number;
  readonly notes: string | null;
  readonly createdById: number;
  readonly createdByName: string;
  readonly submittedAt: string | null; // ISO datetime
  readonly approvedAt: string | null; // ISO datetime
  readonly approvedById: number | null;
  readonly approvedByName: string | null;
  readonly rejectionReason: string | null;
  readonly createdAt: string; // ISO datetime
  readonly updatedAt: string; // ISO datetime
  readonly lineItems: readonly LineItem[];
}

/**
 * Quotation summary for list views (lighter than full Quotation).
 */
export interface QuotationListItem {
  readonly id: number;
  readonly jobCode: string;
  readonly projectId: number;
  readonly projectName: string;
  readonly version: number;
  readonly status: QuotationStatus;
  readonly totalAmount: number;
  readonly createdAt: string;
  readonly createdByName: string;
}

/**
 * Quotation pure functions for business rules.
 *
 * All business logic as pure functions that operate on Quotation objects.
 * This keeps domain logic testable and separate from UI.
 */
export const quotationRules = {
  // ==================== COMPUTED VALUES ====================

  /**
   * Calculate total amount from line items.
   * Returns 0 if no line items.
   */
  calculateTotal(quotation: Quotation): number {
    return quotation.lineItems.reduce(
      (sum, item) => sum + lineItemRules.getLineTotal(item),
      0
    );
  },

  /**
   * Format total amount as currency.
   */
  getFormattedTotal(quotation: Quotation): string {
    return Money.format(quotationRules.calculateTotal(quotation));
  },

  /**
   * Get status display configuration.
   */
  getStatusConfig(quotation: Quotation): StatusConfig {
    return QuotationStatusConfig[quotation.status];
  },

  /**
   * Check if quotation is expired.
   *
   * @param quotation - Quotation to check
   * @param now - Optional current date for testing
   */
  isExpired(quotation: Quotation, now: Date = getNow()): boolean {
    return isPast(quotation.expiryDate, now);
  },

  /**
   * Get days until expiry (negative if expired).
   *
   * @param quotation - Quotation to check
   * @param now - Optional current date for testing
   */
  daysUntilExpiry(quotation: Quotation, now: Date = getNow()): number {
    return daysBetween(quotation.expiryDate, now);
  },

  /**
   * Get number of line items.
   */
  getItemCount(quotation: Quotation): number {
    return quotation.lineItems.length;
  },

  /**
   * Check if quotation has notes.
   */
  hasNotes(quotation: Quotation): boolean {
    return quotation.notes !== null && quotation.notes.trim().length > 0;
  },

  // ==================== BUSINESS RULES ====================

  /**
   * Check if quotation can be edited.
   * Only DRAFT quotations can be edited.
   */
  canEdit(quotation: Quotation): boolean {
    return quotation.status === QuotationStatus.DRAFT;
  },

  /**
   * Check if quotation can be submitted for approval.
   * Requires DRAFT status, at least one line item, and positive total.
   */
  canSubmit(quotation: Quotation): boolean {
    return (
      quotation.status === QuotationStatus.DRAFT &&
      quotation.lineItems.length > 0 &&
      quotationRules.calculateTotal(quotation) > 0
    );
  },

  /**
   * Check if quotation can be approved (approver's perspective).
   * Only PENDING quotations can be approved.
   */
  canApprove(quotation: Quotation): boolean {
    return quotation.status === QuotationStatus.PENDING;
  },

  /**
   * Check if quotation can be rejected (approver's perspective).
   * Only PENDING quotations can be rejected.
   */
  canReject(quotation: Quotation): boolean {
    return quotation.status === QuotationStatus.PENDING;
  },

  /**
   * Check if a new version can be created.
   * Available for APPROVED, REJECTED, or SENT quotations.
   */
  canCreateNewVersion(quotation: Quotation): boolean {
    const validStatuses: QuotationStatus[] = [
      QuotationStatus.APPROVED,
      QuotationStatus.REJECTED,
      QuotationStatus.SENT,
    ];
    return validStatuses.includes(quotation.status);
  },

  /**
   * Check if quotation can be sent to customer.
   * Requires APPROVED status and not expired.
   *
   * @param quotation - Quotation to check
   * @param now - Optional current date for testing
   */
  canSend(quotation: Quotation, now: Date = getNow()): boolean {
    return (
      quotation.status === QuotationStatus.APPROVED &&
      !quotationRules.isExpired(quotation, now)
    );
  },

  /**
   * Check if PDF can be generated.
   * Requires at least one line item.
   */
  canGeneratePdf(quotation: Quotation): boolean {
    return quotation.lineItems.length > 0;
  },

  /**
   * Check if revision notification can be sent.
   * Typically for SENT or later versions.
   */
  canSendNotification(quotation: Quotation): boolean {
    const validStatuses: QuotationStatus[] = [QuotationStatus.APPROVED, QuotationStatus.SENT];
    return quotation.version > 1 && validStatuses.includes(quotation.status);
  },

  /**
   * Check if quotation is in a terminal state.
   * Terminal states: ACCEPTED, REJECTED (final)
   */
  isTerminal(quotation: Quotation): boolean {
    const terminalStatuses: QuotationStatus[] = [QuotationStatus.ACCEPTED, QuotationStatus.REJECTED];
    return terminalStatuses.includes(quotation.status);
  },

  /**
   * Check if quotation is pending any action.
   */
  isPending(quotation: Quotation): boolean {
    return quotation.status === QuotationStatus.PENDING;
  },
};
