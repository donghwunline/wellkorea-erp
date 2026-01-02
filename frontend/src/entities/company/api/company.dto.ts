/**
 * Company DTOs matching backend responses.
 *
 * Internal to entities/company - NOT exported in public API.
 * These types match the backend API contract exactly.
 */

import type { RoleType } from '../model/role-type';

// =============================================================================
// Response DTOs
// =============================================================================

/**
 * Company role from backend response.
 */
export interface CompanyRoleResponse {
  id: number;
  roleType: RoleType;
  creditLimit?: number | null;
  defaultPaymentDays?: number | null;
  notes?: string | null;
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

// =============================================================================
// Request DTOs
// =============================================================================

/**
 * Create company request.
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
 * Update company request.
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

/**
 * Add role to company request.
 */
export interface AddRoleRequest {
  roleType: RoleType;
  creditLimit?: number | null;
  defaultPaymentDays?: number | null;
  notes?: string | null;
}

// =============================================================================
// Command Result
// =============================================================================

/**
 * Command result returned by create/update/role operations.
 * CQRS pattern: commands return only ID, clients fetch fresh data via query endpoints.
 */
export interface CommandResult {
  id: number;
  message: string;
}

// =============================================================================
// List Parameters
// =============================================================================

/**
 * Parameters for listing companies.
 */
export interface CompanyListParams {
  page?: number;
  size?: number;
  roleType?: RoleType;
  search?: string;
}
