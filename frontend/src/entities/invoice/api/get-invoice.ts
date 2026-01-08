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
  BY_PROJECT: (projectId: number) => `/invoices/project/${projectId}`,
  BY_STATUS: (status: InvoiceStatus) => `/invoices/status/${status}`,
};

/**
 * Parameters for invoice list query.
 */
export interface InvoiceListParams {
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Parameters for invoices by status query.
 */
export interface InvoicesByStatusParams extends InvoiceListParams {
  status: InvoiceStatus;
}

/**
 * Get paginated list of invoices.
 */
export async function getInvoices(
  params: InvoiceListParams = {}
): Promise<PagedResponse<InvoiceSummaryResponse>> {
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.set('page', params.page.toString());
  if (params.size !== undefined) queryParams.set('size', params.size.toString());
  if (params.sort) queryParams.set('sort', params.sort);

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

/**
 * Get invoices for a specific project.
 */
export async function getInvoicesByProject(
  projectId: number
): Promise<InvoiceSummaryResponse[]> {
  return httpClient.get<InvoiceSummaryResponse[]>(
    INVOICE_ENDPOINTS.BY_PROJECT(projectId)
  );
}

/**
 * Get invoices by status with pagination.
 */
export async function getInvoicesByStatus(
  params: InvoicesByStatusParams
): Promise<PagedResponse<InvoiceSummaryResponse>> {
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.set('page', params.page.toString());
  if (params.size !== undefined) queryParams.set('size', params.size.toString());
  if (params.sort) queryParams.set('sort', params.sort);

  const url = queryParams.toString()
    ? `${INVOICE_ENDPOINTS.BY_STATUS(params.status)}?${queryParams.toString()}`
    : INVOICE_ENDPOINTS.BY_STATUS(params.status);

  return httpClient.get<PagedResponse<InvoiceSummaryResponse>>(url);
}
