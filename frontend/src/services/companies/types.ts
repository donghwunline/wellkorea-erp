/**
 * Company service types.
 * Matches backend Company domain DTOs.
 */

import type { Paginated } from '@/shared/api/types';

// ============================================================================
// Role Types
// ============================================================================

/**
 * Role type enum matching backend RoleType.
 */
export type RoleType = 'CUSTOMER' | 'VENDOR' | 'OUTSOURCE';

/**
 * Human-readable labels for role types.
 */
export const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  CUSTOMER: '고객사',
  VENDOR: '협력업체',
  OUTSOURCE: '외주업체',
};

// ============================================================================
// Company Role Types
// ============================================================================

/**
 * Company role details.
 */
export interface CompanyRole {
  id: number;
  roleType: RoleType;
  creditLimit?: number | null;
  defaultPaymentDays?: number | null;
  notes?: string | null;
  createdAt: string;
}

/**
 * Request to add a role to a company.
 */
export interface AddRoleRequest {
  roleType: RoleType;
  creditLimit?: number | null;
  defaultPaymentDays?: number | null;
  notes?: string | null;
}

// ============================================================================
// Company Types
// ============================================================================

/**
 * Company summary for list views.
 */
export interface CompanySummary {
  id: number;
  name: string;
  registrationNumber?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  roles: CompanyRole[];
  isActive: boolean;
  createdAt: string;
}

/**
 * Full company details including all fields.
 */
export interface CompanyDetails {
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
  roles: CompanyRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Request to create a new company.
 */
export interface CreateCompanyRequest {
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
  roles: RoleType[];
}

/**
 * Request to update a company.
 */
export interface UpdateCompanyRequest {
  name?: string | null;
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
}

// ============================================================================
// CQRS Command Result
// ============================================================================

/**
 * Command result returned by create/update operations.
 * CQRS pattern: commands return only ID, clients fetch fresh data via query endpoints.
 */
export interface CompanyCommandResult {
  id: number;
  message: string;
}

// ============================================================================
// List/Search Parameters
// ============================================================================

/**
 * Parameters for listing companies.
 */
export interface CompanyListParams {
  page?: number;
  size?: number;
  roleType?: RoleType;
  search?: string;
}

/**
 * Paginated company response.
 */
export type PaginatedCompanies = Paginated<CompanySummary>;
