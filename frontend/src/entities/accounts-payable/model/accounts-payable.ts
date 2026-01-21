/**
 * AccountsPayable domain model.
 *
 * Represents a payment obligation to a vendor.
 * Status is CALCULATED from company_payments, not stored.
 * Dates are stored as ISO strings for React Query cache serialization.
 */

import { Money } from '@/shared/lib/formatting/money';
import type { CalculatedAPStatus } from './accounts-payable-status';
import { getAPStatusConfig } from './accounts-payable-status';

/**
 * AccountsPayable domain model (plain interface).
 * All properties are readonly to enforce immutability.
 */
export interface AccountsPayable {
  readonly id: number;
  readonly purchaseOrderId: number;
  readonly poNumber: string;
  readonly vendorId: number;
  readonly vendorName: string;
  readonly totalAmount: number;
  readonly currency: string;
  readonly dueDate: string | null; // ISO date
  readonly notes: string | null;
  readonly createdAt: string; // ISO datetime
  // CALCULATED fields (from payments)
  readonly totalPaid: number;
  readonly remainingBalance: number;
  readonly isOverdue: boolean;
  readonly daysOverdue: number;
  readonly agingBucket: string;
  readonly calculatedStatus: CalculatedAPStatus;
}

/**
 * AccountsPayable summary for list views (same as full model for now).
 */
export type AccountsPayableSummary = AccountsPayable;

/**
 * AP Aging summary for reports.
 */
export interface APAgingSummary {
  readonly agingBucket: string;
  readonly count: number;
  readonly totalAmount: number;
  readonly totalPaid: number;
  readonly remainingBalance: number;
}

/**
 * AccountsPayable pure functions for business rules and formatting.
 */
export const accountsPayableRules = {
  /**
   * Check if AP can receive a payment.
   */
  canReceivePayment(ap: AccountsPayable): boolean {
    return ap.calculatedStatus !== 'PAID';
  },

  /**
   * Get payment progress as percentage.
   */
  getPaymentProgress(ap: AccountsPayable): number {
    if (ap.totalAmount <= 0) return 0;
    return Math.round((ap.totalPaid / ap.totalAmount) * 100);
  },

  /**
   * Check if AP is fully paid.
   */
  isFullyPaid(ap: AccountsPayable): boolean {
    return ap.calculatedStatus === 'PAID';
  },

  /**
   * Check if AP is pending (no payments).
   */
  isPending(ap: AccountsPayable): boolean {
    return ap.calculatedStatus === 'PENDING';
  },

  /**
   * Check if AP is partially paid.
   */
  isPartiallyPaid(ap: AccountsPayable): boolean {
    return ap.calculatedStatus === 'PARTIALLY_PAID';
  },

  /**
   * Format total amount.
   */
  formatTotalAmount(ap: AccountsPayable): string {
    return Money.format(ap.totalAmount, { currency: ap.currency });
  },

  /**
   * Format remaining balance.
   */
  formatRemainingBalance(ap: AccountsPayable): string {
    return Money.format(ap.remainingBalance, { currency: ap.currency });
  },

  /**
   * Format total paid.
   */
  formatTotalPaid(ap: AccountsPayable): string {
    return Money.format(ap.totalPaid, { currency: ap.currency });
  },

  /**
   * Get status label.
   */
  getStatusLabel(ap: AccountsPayable): string {
    return getAPStatusConfig(ap.calculatedStatus).label;
  },

  /**
   * Get status label in Korean.
   */
  getStatusLabelKo(ap: AccountsPayable): string {
    return getAPStatusConfig(ap.calculatedStatus).labelKo;
  },

  /**
   * Check if AP has due date.
   */
  hasDueDate(ap: AccountsPayable): boolean {
    return ap.dueDate !== null;
  },

  /**
   * Check if AP has notes.
   */
  hasNotes(ap: AccountsPayable): boolean {
    return ap.notes !== null && ap.notes.trim().length > 0;
  },
};
