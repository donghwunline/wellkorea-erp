/**
 * Company mapper - Response DTOs to Domain models.
 *
 * Internal to entities/company - NOT exported in public API.
 * Handles transformation of backend DTOs to domain model interfaces.
 */

import type { Company, CompanyListItem } from '../model/company';
import type { CompanyRole } from '../model/company-role';
import type {
  CompanyDetailsResponse,
  CompanySummaryResponse,
  CompanyRoleResponse,
} from './company.dto';

/**
 * Map role DTO to domain model.
 */
function mapRoleToDomain(dto: CompanyRoleResponse): CompanyRole {
  return {
    id: dto.id,
    roleType: dto.roleType,
    creditLimit: dto.creditLimit ?? null,
    defaultPaymentDays: dto.defaultPaymentDays ?? null,
    notes: dto.notes ?? null,
    createdAt: dto.createdAt,
  };
}

/**
 * Company mapper with methods for different response types.
 */
export const companyMapper = {
  /**
   * Map detail response to full domain model.
   */
  toDomain(dto: CompanyDetailsResponse): Company {
    return {
      id: dto.id,
      name: dto.name,
      registrationNumber: dto.registrationNumber ?? null,
      representative: dto.representative ?? null,
      businessType: dto.businessType ?? null,
      businessCategory: dto.businessCategory ?? null,
      contactPerson: dto.contactPerson ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      bankAccount: dto.bankAccount ?? null,
      paymentTerms: dto.paymentTerms ?? null,
      roles: dto.roles.map(mapRoleToDomain),
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt ?? dto.createdAt,
    };
  },

  /**
   * Map summary response to list item domain model.
   */
  toListItem(dto: CompanySummaryResponse): CompanyListItem {
    return {
      id: dto.id,
      name: dto.name,
      registrationNumber: dto.registrationNumber ?? null,
      contactPerson: dto.contactPerson ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      roles: dto.roles.map(mapRoleToDomain),
      isActive: dto.isActive,
      createdAt: dto.createdAt,
    };
  },
};
