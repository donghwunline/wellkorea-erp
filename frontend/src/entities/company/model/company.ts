/**
 * Company domain model.
 *
 * Core domain types and business rules for company entities.
 * Uses plain objects + pure functions pattern (not classes).
 */

import type { CompanyRole } from './company-role';
import type { RoleType } from './role-type';

/**
 * Full company domain model.
 * Immutable structure using readonly properties.
 */
export interface Company {
  readonly id: number;
  readonly name: string;
  readonly registrationNumber: string | null;
  readonly representative: string | null;
  readonly businessType: string | null;
  readonly businessCategory: string | null;
  readonly contactPerson: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly address: string | null;
  readonly bankAccount: string | null;
  readonly paymentTerms: string | null;
  readonly roles: readonly CompanyRole[];
  readonly isActive: boolean;
  readonly createdAt: string; // ISO datetime
  readonly updatedAt: string; // ISO datetime
}

/**
 * Company summary for list views.
 * Contains only fields needed for table display.
 */
export interface CompanyListItem {
  readonly id: number;
  readonly name: string;
  readonly registrationNumber: string | null;
  readonly contactPerson: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly roles: readonly CompanyRole[];
  readonly isActive: boolean;
  readonly createdAt: string;
}

/**
 * Minimal company type for role-related business rules.
 * Allows rules to work with both Company and CompanyListItem.
 */
type CompanyWithRoles = Pick<Company, 'id' | 'roles' | 'isActive'>;

/**
 * Company pure functions for business rules.
 *
 * @example
 * ```typescript
 * const company = await getCompany(id);
 * if (companyRules.canEdit(company)) {
 *   // Show edit button
 * }
 * if (companyRules.isCustomer(company)) {
 *   // Show customer-specific features
 * }
 * ```
 */
export const companyRules = {
  /**
   * Check if company has a specific role.
   */
  hasRole(company: CompanyWithRoles, roleType: RoleType): boolean {
    return company.roles.some(r => r.roleType === roleType);
  },

  /**
   * Check if company is a customer.
   */
  isCustomer(company: CompanyWithRoles): boolean {
    return companyRules.hasRole(company, 'CUSTOMER');
  },

  /**
   * Check if company is a vendor.
   */
  isVendor(company: CompanyWithRoles): boolean {
    return companyRules.hasRole(company, 'VENDOR');
  },

  /**
   * Check if company is an outsource partner.
   */
  isOutsource(company: CompanyWithRoles): boolean {
    return companyRules.hasRole(company, 'OUTSOURCE');
  },

  /**
   * Get role by type if it exists.
   */
  getRoleByType(company: CompanyWithRoles, roleType: RoleType): CompanyRole | undefined {
    return company.roles.find(r => r.roleType === roleType);
  },

  /**
   * Check if company can be edited.
   * Only active companies can be edited.
   */
  canEdit(company: CompanyWithRoles): boolean {
    return company.isActive;
  },

  /**
   * Check if company can be deleted (deactivated).
   * Only active companies can be deactivated.
   */
  canDelete(company: CompanyWithRoles): boolean {
    return company.isActive;
  },

  /**
   * Check if a role can be removed.
   * Cannot remove the last role from a company.
   */
  canRemoveRole(company: CompanyWithRoles, roleType: RoleType): boolean {
    if (company.roles.length <= 1) return false;
    return company.roles.some(r => r.roleType === roleType);
  },

  /**
   * Check if a role can be added.
   * Cannot add duplicate roles.
   */
  canAddRole(company: CompanyWithRoles, roleType: RoleType): boolean {
    return !companyRules.hasRole(company, roleType);
  },

  /**
   * Get the number of roles.
   */
  getRoleCount(company: CompanyWithRoles): number {
    return company.roles.length;
  },

  /**
   * Check if company has contact information.
   */
  hasContactInfo(company: Company): boolean {
    return !!(company.contactPerson || company.phone || company.email);
  },

  /**
   * Check if company has business information.
   */
  hasBusinessInfo(company: Company): boolean {
    return !!(company.representative || company.businessType || company.businessCategory);
  },

  /**
   * Check if company has financial information.
   */
  hasFinancialInfo(company: Company): boolean {
    return !!(company.bankAccount || company.paymentTerms);
  },
};
