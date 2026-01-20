/**
 * Purchase Request getter functions.
 *
 * HTTP GET operations for purchase request data.
 * Internal to entity - not exported via index.ts.
 */

import { httpClient, PURCHASE_REQUEST_ENDPOINTS, type PagedResponse } from '@/shared/api';
import { transformPagedResponse, type Paginated } from '@/shared/lib/pagination';
import type {
  PurchaseRequestDetailResponse,
  PurchaseRequestSummaryResponse,
  PurchaseRequestListParams,
} from './purchase-request.mapper';

/**
 * Get a single purchase request by ID (with RFQ items).
 */
export async function getPurchaseRequest(id: number): Promise<PurchaseRequestDetailResponse> {
  return httpClient.get<PurchaseRequestDetailResponse>(PURCHASE_REQUEST_ENDPOINTS.byId(id));
}

/**
 * Get paginated list of purchase requests.
 */
export async function getPurchaseRequests(
  params?: PurchaseRequestListParams
): Promise<Paginated<PurchaseRequestSummaryResponse>> {
  const response = await httpClient.requestWithMeta<PagedResponse<PurchaseRequestSummaryResponse>>({
    method: 'GET',
    url: PURCHASE_REQUEST_ENDPOINTS.BASE,
    params,
  });

  return transformPagedResponse(response.data, response.metadata);
}
