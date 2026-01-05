/**
 * CompanyRole domain model.
 *
 * Represents a role (CUSTOMER, VENDOR, OUTSOURCE) assigned to a company.
 * Each role can have optional credit limit and payment terms.
 */

import type { RoleType } from './role-type';

/**
 * Company role domain model.
 * Immutable structure using readonly properties.
 */
export interface CompanyRole {
  readonly id: number;
  readonly roleType: RoleType;
  readonly creditLimit: number | null;
  readonly defaultPaymentDays: number | null;
  readonly notes: string | null;
  readonly createdAt: string; // ISO datetime
}

/**
 * CompanyRole pure functions for business rules.
 */
export const roleRules = {
  /**
   * Format credit limit as currency string.
   */
  formatCreditLimit(role: CompanyRole): string | null {
    if (role.creditLimit === null) return null;
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(role.creditLimit);
  },

  /**
   * Get payment days display text.
   */
  getPaymentDaysText(role: CompanyRole): string | null {
    if (role.defaultPaymentDays === null) return null;
    return `${role.defaultPaymentDays}일`;
  },

  /**
   * Check if role has financial settings configured.
   */
  hasFinancialSettings(role: CompanyRole): boolean {
    return role.creditLimit !== null || role.defaultPaymentDays !== null;
  },

  /**
   * Check if role has notes.
   */
  hasNotes(role: CompanyRole): boolean {
    return role.notes !== null && role.notes.trim().length > 0;
  },
};
