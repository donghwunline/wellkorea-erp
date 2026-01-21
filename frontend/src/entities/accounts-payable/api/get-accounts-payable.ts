/**
 * HTTP GET operations for accounts payable.
 * INTERNAL: Used by query factory, not exported from entity public API.
 */

import { httpClient } from '@/shared/api';
import type { CalculatedAPStatus } from '../model/accounts-payable-status';
import type { AccountsPayable, APAgingSummary } from '../model/accounts-payable';
import type { AccountsPayableResponse, APAgingSummaryResponse } from './accounts-payable.mapper';
import { mapToAccountsPayable, mapToAPAgingSummary } from './accounts-payable.mapper';

const ENDPOINTS = {
  list: '/accounts-payable',
  detail: (id: number) => `/accounts-payable/${id}`,
  byVendor: (vendorId: number) => `/accounts-payable/vendor/${vendorId}`,
  overdue: '/accounts-payable/overdue',
  aging: '/accounts-payable/aging-summary',
};

/**
 * Spring Page response structure.
 */
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Get paginated list of accounts payable with calculated status.
 */
export async function getAccountsPayableList(
  page: number = 0,
  size: number = 20,
  vendorId?: number,
  calculatedStatus?: CalculatedAPStatus,
  overdueOnly?: boolean
): Promise<AccountsPayable[]> {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('size', String(size));
  if (vendorId) params.append('vendorId', String(vendorId));
  if (calculatedStatus) params.append('calculatedStatus', calculatedStatus);
  if (overdueOnly !== undefined) params.append('overdueOnly', String(overdueOnly));

  const response = await httpClient.get<PageResponse<AccountsPayableResponse>>(
    `${ENDPOINTS.list}?${params.toString()}`
  );
  return response.content.map(mapToAccountsPayable);
}

/**
 * Get accounts payable detail by ID.
 */
export async function getAccountsPayableById(id: number): Promise<AccountsPayable> {
  const response = await httpClient.get<AccountsPayableResponse>(ENDPOINTS.detail(id));
  return mapToAccountsPayable(response);
}

/**
 * Get accounts payable for a specific vendor.
 */
export async function getAccountsPayableByVendor(vendorId: number): Promise<AccountsPayable[]> {
  const response = await httpClient.get<AccountsPayableResponse[]>(ENDPOINTS.byVendor(vendorId));
  return response.map(mapToAccountsPayable);
}

/**
 * Get overdue accounts payable.
 */
export async function getOverdueAccountsPayable(): Promise<AccountsPayable[]> {
  const response = await httpClient.get<AccountsPayableResponse[]>(ENDPOINTS.overdue);
  return response.map(mapToAccountsPayable);
}

/**
 * Get AP aging summary.
 */
export async function getAPAgingSummary(): Promise<APAgingSummary[]> {
  const response = await httpClient.get<APAgingSummaryResponse[]>(ENDPOINTS.aging);
  return response.map(mapToAPAgingSummary);
}
