/**
 * Internal GET operations for deliveries.
 * Used by query factory - not exported from entity barrel.
 */

import { httpClient, DELIVERY_ENDPOINTS } from '@/shared/api';
import type { DeliveryDetailResponse, DeliverySummaryResponse } from './delivery.mapper';
import type { DeliveryStatus } from '../model/delivery-status';

export interface DeliveryListParams {
  projectId?: number;
  status?: DeliveryStatus;
  page?: number;
  size?: number;
}

/**
 * Fetch deliveries list with optional filters.
 */
export async function getDeliveries(
  params: DeliveryListParams = {}
): Promise<DeliverySummaryResponse[]> {
  const searchParams = new URLSearchParams();

  if (params.projectId !== undefined) {
    searchParams.set('projectId', params.projectId.toString());
  }
  if (params.status) {
    searchParams.set('status', params.status);
  }
  if (params.page !== undefined) {
    searchParams.set('page', params.page.toString());
  }
  if (params.size !== undefined) {
    searchParams.set('size', params.size.toString());
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${DELIVERY_ENDPOINTS.BASE}?${queryString}`
    : DELIVERY_ENDPOINTS.BASE;

  return httpClient.get<DeliverySummaryResponse[]>(url);
}

/**
 * Fetch single delivery detail by ID.
 */
export async function getDeliveryById(id: number): Promise<DeliveryDetailResponse> {
  return httpClient.get<DeliveryDetailResponse>(DELIVERY_ENDPOINTS.byId(id));
}
