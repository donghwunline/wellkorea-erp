/**
 * GET company requests.
 *
 * Internal to entities/company - used by query factory.
 * Provides raw HTTP functions for fetching company data.
 */

import { httpClient, COMPANY_ENDPOINTS, type PagedResponse } from '@/shared/api';
import {
  transformPagedResponse,
  type Paginated,
} from '@/shared/lib/pagination';
import type {
  CompanyDetailsResponse,
  CompanySummaryResponse,
  CompanyListParams,
} from './company.mapper';

/**
 * Get company by ID.
 *
 * @param id - Company ID
 * @returns Company details response
 */
export async function getCompany(id: number): Promise<CompanyDetailsResponse> {
  return httpClient.get<CompanyDetailsResponse>(COMPANY_ENDPOINTS.byId(id));
}

/**
 * Get paginated list of companies.
 *
 * @param params - List parameters (page, size, search, roleType)
 * @returns Paginated company summaries
 */
export async function getCompanies(
  params?: CompanyListParams
): Promise<Paginated<CompanySummaryResponse>> {
  const response = await httpClient.requestWithMeta<PagedResponse<CompanySummaryResponse>>({
    method: 'GET',
    url: COMPANY_ENDPOINTS.BASE,
    params,
  });

  return transformPagedResponse(response.data, response.metadata);
}
