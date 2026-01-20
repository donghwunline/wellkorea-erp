/**
 * Company Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 */

import type { Company, CompanyListItem } from '../model/company';
import type { CompanyRole } from '../model/company-role';
import type { RoleType } from '../model/role-type';

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Company role from backend response.
 */
export interface CompanyRoleResponse {
  roleType: RoleType;
  createdAt: string;
}

/**
 * Company summary from list endpoint.
 */
export interface CompanySummaryResponse {
  id: number;
  name: string;
  registrationNumber?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  roles: CompanyRoleResponse[];
  isActive: boolean;
  createdAt: string;
}

/**
 * Full company details from detail endpoint.
 */
export interface CompanyDetailsResponse {
  id: number;
  name: string;
  registrationNumber?: string | null;
  representative?: string | null;
  businessType?: string | null;
  businessCategory?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bankAccount?: string | null;
  paymentTerms?: string | null;
  roles: CompanyRoleResponse[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Command result returned by create/update/role operations.
 * CQRS pattern: commands return only ID, clients fetch fresh data via query endpoints.
 */
export interface CommandResult {
  id: number;
  message: string;
}

/**
 * Parameters for listing companies.
 */
export interface CompanyListParams {
  page?: number;
  size?: number;
  roleType?: RoleType;
  search?: string;
}

// =============================================================================
// MAPPERS
// =============================================================================

/**
 * Map role response to domain model.
 */
function mapRoleToDomain(response: CompanyRoleResponse): CompanyRole {
  return {
    roleType: response.roleType,
    createdAt: response.createdAt,
  };
}

/**
 * Company mapper with methods for different response types.
 */
export const companyMapper = {
  /**
   * Map detail response to full domain model.
   */
  toDomain(response: CompanyDetailsResponse): Company {
    return {
      id: response.id,
      name: response.name,
      registrationNumber: response.registrationNumber ?? null,
      representative: response.representative ?? null,
      businessType: response.businessType ?? null,
      businessCategory: response.businessCategory ?? null,
      contactPerson: response.contactPerson ?? null,
      phone: response.phone ?? null,
      email: response.email ?? null,
      address: response.address ?? null,
      bankAccount: response.bankAccount ?? null,
      paymentTerms: response.paymentTerms ?? null,
      roles: response.roles.map(mapRoleToDomain),
      isActive: response.isActive,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt ?? response.createdAt,
    };
  },

  /**
   * Map summary response to list item domain model.
   */
  toListItem(response: CompanySummaryResponse): CompanyListItem {
    return {
      id: response.id,
      name: response.name,
      registrationNumber: response.registrationNumber ?? null,
      contactPerson: response.contactPerson ?? null,
      phone: response.phone ?? null,
      email: response.email ?? null,
      roles: response.roles.map(mapRoleToDomain),
      isActive: response.isActive,
      createdAt: response.createdAt,
    };
  },
};
