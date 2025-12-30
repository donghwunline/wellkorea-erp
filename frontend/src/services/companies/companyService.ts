/**
 * Company management service.
 * Business logic layer for company operations.
 *
 * Features:
 * - Company CRUD operations
 * - Role management (add/remove roles)
 * - CQRS pattern: commands return IDs, queries return full data
 * - Role-based filtering (CUSTOMER, VENDOR, OUTSOURCE)
 */

import { httpClient, COMPANY_ENDPOINTS } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import { transformPagedResponse } from '@/services/shared';
import type {
  AddRoleRequest,
  CompanyCommandResult,
  CompanyDetails,
  CompanyListParams,
  CompanySummary,
  CreateCompanyRequest,
  PaginatedCompanies,
  UpdateCompanyRequest,
} from './types';

/**
 * Company management service.
 */
export const companyService = {
  // ========== QUERY OPERATIONS ==========

  /**
   * Get paginated list of companies.
   * Supports filtering by role type and search.
   *
   * @param params List parameters (page, size, roleType, search)
   * @returns Paginated companies
   */
  async getCompanies(params?: CompanyListParams): Promise<PaginatedCompanies> {
    const response = await httpClient.requestWithMeta<PagedResponse<CompanySummary>>({
      method: 'GET',
      url: COMPANY_ENDPOINTS.BASE,
      params,
    });

    return transformPagedResponse(response.data, response.metadata);
  },

  /**
   * Get company details by ID.
   * Returns full company details including all roles.
   *
   * @param id Company ID
   * @returns Company details
   */
  async getCompany(id: number): Promise<CompanyDetails> {
    return httpClient.get<CompanyDetails>(COMPANY_ENDPOINTS.byId(id));
  },

  // ========== COMMAND OPERATIONS ==========

  /**
   * Create a new company with initial roles.
   * CQRS: Returns only ID, fetch fresh data via getCompany if needed.
   *
   * @param request Company creation request
   * @returns Command result with created company ID
   */
  async createCompany(request: CreateCompanyRequest): Promise<CompanyCommandResult> {
    return httpClient.post<CompanyCommandResult>(COMPANY_ENDPOINTS.BASE, request);
  },

  /**
   * Update an existing company.
   * CQRS: Returns only ID, fetch fresh data via getCompany if needed.
   *
   * @param id Company ID
   * @param request Update request
   * @returns Command result with updated company ID
   */
  async updateCompany(id: number, request: UpdateCompanyRequest): Promise<CompanyCommandResult> {
    return httpClient.put<CompanyCommandResult>(COMPANY_ENDPOINTS.byId(id), request);
  },

  /**
   * Delete (deactivate) a company.
   *
   * @param id Company ID
   */
  async deleteCompany(id: number): Promise<void> {
    await httpClient.delete<void>(COMPANY_ENDPOINTS.byId(id));
  },

  // ========== ROLE MANAGEMENT ==========

  /**
   * Add a role to a company.
   * CQRS: Returns only role ID.
   *
   * @param companyId Company ID
   * @param request Role to add
   * @returns Command result with created role ID
   */
  async addRole(companyId: number, request: AddRoleRequest): Promise<CompanyCommandResult> {
    return httpClient.post<CompanyCommandResult>(COMPANY_ENDPOINTS.roles(companyId), request);
  },

  /**
   * Remove a role from a company.
   * Note: Cannot remove the last role from a company.
   *
   * @param companyId Company ID
   * @param roleId Role ID to remove
   */
  async removeRole(companyId: number, roleId: number): Promise<void> {
    await httpClient.delete<void>(COMPANY_ENDPOINTS.role(companyId, roleId));
  },
};
