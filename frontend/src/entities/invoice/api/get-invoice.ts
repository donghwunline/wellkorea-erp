/**
 * Invoice GET operations.
 * Internal - not exported from entity barrel.
 */

import { httpClient, type PagedResponse } from '@/shared/api';
import type { InvoiceDetailResponse, InvoiceSummaryResponse } from './invoice.mapper';
import type { InvoiceStatus } from '../model/invoice-status';

const INVOICE_ENDPOINTS = {
  BASE: '/invoices',
  BY_ID: (id: number) => `/invoices/${id}`,
};

/**
 * Parameters for invoice list query.
 */
export interface InvoiceListParams {
  page?: number;
  size?: number;
  sort?: string;
  projectId?: number;
  status?: InvoiceStatus;
}

/**
 * Get paginated list of invoices with optional filters.
 */
export async function getInvoices(
  params: InvoiceListParams = {}
): Promise<PagedResponse<InvoiceSummaryResponse>> {
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.set('page', params.page.toString());
  if (params.size !== undefined) queryParams.set('size', params.size.toString());
  if (params.sort) queryParams.set('sort', params.sort);
  if (params.projectId !== undefined) queryParams.set('projectId', params.projectId.toString());
  if (params.status) queryParams.set('status', params.status);

  const url = queryParams.toString()
    ? `${INVOICE_ENDPOINTS.BASE}?${queryParams.toString()}`
    : INVOICE_ENDPOINTS.BASE;

  return httpClient.get<PagedResponse<InvoiceSummaryResponse>>(url);
}

/**
 * Get invoice by ID.
 */
export async function getInvoiceById(id: number): Promise<InvoiceDetailResponse> {
  return httpClient.get<InvoiceDetailResponse>(INVOICE_ENDPOINTS.BY_ID(id));
}

