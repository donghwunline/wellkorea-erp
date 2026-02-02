/**
 * Purchase Order getter functions.
 *
 * HTTP GET operations for purchase order data.
 * Internal to entity - not exported via index.ts.
 */

import { httpClient, type PagedResponse, PURCHASE_ORDER_ENDPOINTS } from '@/shared/api';
import { type Paginated, transformPagedResponse } from '@/shared/lib/pagination';
import type {
  PurchaseOrderDetailResponse,
  PurchaseOrderListParams,
  PurchaseOrderSummaryResponse,
} from './purchase-order.mapper';

/**
 * Get a single purchase order by ID.
 */
export async function getPurchaseOrder(id: number): Promise<PurchaseOrderDetailResponse> {
  return httpClient.get<PurchaseOrderDetailResponse>(PURCHASE_ORDER_ENDPOINTS.byId(id));
}

/**
 * Get paginated list of purchase orders.
 */
export async function getPurchaseOrders(
  params?: PurchaseOrderListParams
): Promise<Paginated<PurchaseOrderSummaryResponse>> {
  const response = await httpClient.requestWithMeta<PagedResponse<PurchaseOrderSummaryResponse>>({
    method: 'GET',
    url: PURCHASE_ORDER_ENDPOINTS.BASE,
    params,
  });

  return transformPagedResponse(response.data, response.metadata);
}
