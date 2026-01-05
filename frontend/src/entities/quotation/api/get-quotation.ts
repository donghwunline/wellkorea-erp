/**
 * Quotation getter functions.
 *
 * HTTP GET operations for quotation data.
 * Returns raw responses - mapping to domain models happens in query factory.
 */

import { httpClient, QUOTATION_ENDPOINTS, type PagedResponse } from '@/shared/api';
import {
  transformPagedResponse,
  type Paginated,
} from '@/shared/lib/pagination';
import type { QuotationDetailsResponse, QuotationListParams } from './quotation.mapper';

/**
 * Get a single quotation by ID (with line items).
 *
 * @param id - Quotation ID
 * @returns Raw quotation response
 */
export async function getQuotation(id: number): Promise<QuotationDetailsResponse> {
  return httpClient.get<QuotationDetailsResponse>(QUOTATION_ENDPOINTS.byId(id));
}

/**
 * Get paginated list of quotations.
 *
 * @param params - Query parameters (pagination, filters)
 * @returns Paginated response with quotation responses
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
