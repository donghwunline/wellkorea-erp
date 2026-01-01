/**
 * Quotation getter functions.
 *
 * HTTP GET operations for quotation data.
 * Returns raw DTOs - mapping to domain models happens in query factory.
 */

import { httpClient, QUOTATION_ENDPOINTS, transformPagedResponse } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import type { Paginated } from '@/shared/lib/pagination';
import type { QuotationDetailsResponse, QuotationListParams } from './quotation.dto';

/**
 * Get a single quotation by ID (with line items).
 *
 * @param id - Quotation ID
 * @returns Raw quotation response DTO
 */
export async function getQuotation(id: number): Promise<QuotationDetailsResponse> {
  return httpClient.get<QuotationDetailsResponse>(QUOTATION_ENDPOINTS.byId(id));
}

/**
 * Get paginated list of quotations.
 *
 * @param params - Query parameters (pagination, filters)
 * @returns Paginated response with quotation DTOs
 */
export async function getQuotations(
  params?: QuotationListParams
): Promise<Paginated<QuotationDetailsResponse>> {
  const response = await httpClient.requestWithMeta<PagedResponse<QuotationDetailsResponse>>({
    method: 'GET',
    url: QUOTATION_ENDPOINTS.BASE,
    params,
  });

  return transformPagedResponse(response.data, response.metadata);
}
