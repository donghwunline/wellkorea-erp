/**
 * Quotation domain model.
 *
 * Represents the core quotation entity with business rules as pure functions.
 * Dates are stored as ISO strings for React Query cache serialization.
 */

import { daysBetween, getNow, isPast } from '@/shared/lib/formatting/date';
import { Money } from '@/shared/lib/formatting/money';
import type { LineItem } from './line-item';
import { lineItemRules } from './line-item';
import type { StatusConfig } from './quotation-status';
import { QuotationStatus, QuotationStatusConfig } from './quotation-status';

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
 * Common fields shared by Quotation and QuotationListItem.
 * Used for type-safe rule functions that work with both.
 */
type QuotationBase = Pick<Quotation, 'id' | 'status' | 'version'>;

/**
 * Quotation with optional lineItems (for rules that check lineItems).
 */
type QuotationWithOptionalLineItems = QuotationBase & {
  readonly lineItems?: readonly LineItem[];
  readonly totalAmount?: number;
  readonly expiryDate?: string;
  readonly notes?: string | null;
};

/**
 * Quotation pure functions for business rules.
 *
 * All business logic as pure functions that operate on Quotation objects.
 * This keeps domain logic testable and separate from UI.
 *
 * Most rules work with both Quotation and QuotationListItem.
 */
export const quotationRules = {
  // ==================== COMPUTED VALUES ====================

  /**
   * Calculate total amount from line items.
   * Returns 0 if no line items.
   */
  calculateTotal(quotation: Quotation): number {
    return quotation.lineItems.reduce((sum, item) => sum + lineItemRules.getLineTotal(item), 0);
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
   * Works with both Quotation and QuotationListItem.
   */
  canEdit(quotation: QuotationBase): boolean {
    return quotation.status === QuotationStatus.DRAFT;
  },

  /**
   * Check if quotation can be submitted for approval.
   * Requires DRAFT status, at least one line item, and positive total.
   * For QuotationListItem (no lineItems), returns true for DRAFT status.
   */
  canSubmit(quotation: QuotationWithOptionalLineItems): boolean {
    if (quotation.status !== QuotationStatus.DRAFT) return false;
    // If lineItems not available (list view), allow based on status only
    if (!quotation.lineItems) return true;
    return (
      quotation.lineItems.length > 0 && quotationRules.calculateTotal(quotation as Quotation) > 0
    );
  },

  /**
   * Check if quotation can be approved (approver's perspective).
   * Only PENDING quotations can be approved.
   * Works with both Quotation and QuotationListItem.
   */
  canApprove(quotation: QuotationBase): boolean {
    return quotation.status === QuotationStatus.PENDING;
  },

  /**
   * Check if quotation can be rejected (approver's perspective).
   * Only PENDING quotations can be rejected.
   * Works with both Quotation and QuotationListItem.
   */
  canReject(quotation: QuotationBase): boolean {
    return quotation.status === QuotationStatus.PENDING;
  },

  /**
   * Check if a new version can be created.
   * Available for APPROVED, REJECTED, SENT, or ACCEPTED quotations.
   * Works with both Quotation and QuotationListItem.
   */
  canCreateNewVersion(quotation: QuotationBase): boolean {
    const validStatuses: QuotationStatus[] = [
      QuotationStatus.APPROVED,
      QuotationStatus.REJECTED,
      QuotationStatus.SENT,
      QuotationStatus.ACCEPTED,
    ];
    return validStatuses.includes(quotation.status);
  },

  /**
   * Check if quotation can be sent to customer.
   * Requires APPROVED status and not expired.
   * For QuotationListItem (no expiryDate), returns true for APPROVED status.
   *
   * @param quotation - Quotation to check
   * @param now - Optional current date for testing
   */
  canSend(quotation: QuotationWithOptionalLineItems, now: Date = getNow()): boolean {
    if (quotation.status !== QuotationStatus.APPROVED) return false;
    // If expiryDate not available (list view), allow based on status only
    if (!quotation.expiryDate) return true;
    return !quotationRules.isExpired(quotation as Quotation, now);
  },

  /**
   * Check if PDF can be generated.
   * For full Quotation: requires at least one line item.
   * For QuotationListItem: assumes PDF can be generated (status-based).
   * Works with both Quotation and QuotationListItem.
   */
  canGeneratePdf(quotation: QuotationWithOptionalLineItems): boolean {
    // If lineItems not available (list view), check status instead
    if (!quotation.lineItems) {
      // PDF can be generated for any non-DRAFT quotation
      return quotation.status !== QuotationStatus.DRAFT;
    }
    return quotation.lineItems.length > 0;
  },

  /**
   * Check if revision notification can be sent.
   * Typically for SENT or later versions.
   * Works with both Quotation and QuotationListItem.
   * Note: SENDING is not included as user shouldn't re-trigger during send.
   */
  canSendNotification(quotation: QuotationBase): boolean {
    const validStatuses: QuotationStatus[] = [QuotationStatus.APPROVED, QuotationStatus.SENT];
    return quotation.version > 1 && validStatuses.includes(quotation.status);
  },

  /**
   * Check if quotation is currently being sent.
   * Works with both Quotation and QuotationListItem.
   */
  isSending(quotation: QuotationBase): boolean {
    return quotation.status === QuotationStatus.SENDING;
  },

  /**
   * Check if quotation is in a terminal state.
   * Terminal states: ACCEPTED, REJECTED (final)
   * Works with both Quotation and QuotationListItem.
   */
  isTerminal(quotation: QuotationBase): boolean {
    const terminalStatuses: QuotationStatus[] = [
      QuotationStatus.ACCEPTED,
      QuotationStatus.REJECTED,
    ];
    return terminalStatuses.includes(quotation.status);
  },

  /**
   * Check if quotation is pending any action.
   * Works with both Quotation and QuotationListItem.
   */
  isPending(quotation: QuotationBase): boolean {
    return quotation.status === QuotationStatus.PENDING;
  },

  /**
   * Check if quotation can be accepted by customer.
   * Available for SENT or APPROVED quotations.
   * Works with both Quotation and QuotationListItem.
   */
  canAccept(quotation: QuotationBase): boolean {
    return quotation.status === QuotationStatus.SENT || quotation.status === QuotationStatus.APPROVED;
  },
};
