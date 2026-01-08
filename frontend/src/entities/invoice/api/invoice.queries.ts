/**
 * Invoice query factory using TanStack Query v5 queryOptions pattern.
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import {
  getInvoices,
  getInvoiceById,
  getInvoicesByProject,
  getInvoicesByStatus,
} from './get-invoice';
import type { InvoiceListParams, InvoicesByStatusParams } from './get-invoice';
import { invoiceMapper } from './invoice.mapper';
import type { Invoice, InvoiceSummary } from '../model/invoice';
import type { Paginated } from '@/shared/lib/pagination';

/**
 * Query factory for invoice-related queries.
 * Usage: useQuery(invoiceQueries.list({ page: 0, size: 20 }))
 */
export const invoiceQueries = {
  /**
   * Base query key for all invoice queries.
   */
  all: () => ['invoices'] as const,

  /**
   * Query key for list queries.
   */
  lists: () => [...invoiceQueries.all(), 'list'] as const,

  /**
   * Query options for fetching paginated invoices list.
   */
  list: (params: InvoiceListParams = {}) =>
    queryOptions({
      queryKey: [...invoiceQueries.lists(), params.page, params.size, params.sort],
      queryFn: async (): Promise<Paginated<InvoiceSummary>> => {
        const response = await getInvoices(params);
        return {
          data: response.content.map(invoiceMapper.toSummary),
          pagination: {
            page: response.number,
            size: response.size,
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            first: response.first,
            last: response.last,
          },
        };
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Query options for fetching invoices by project.
   */
  byProject: (projectId: number) =>
    queryOptions({
      queryKey: [...invoiceQueries.lists(), 'project', projectId],
      queryFn: async (): Promise<InvoiceSummary[]> => {
        const response = await getInvoicesByProject(projectId);
        return response.map(invoiceMapper.toSummary);
      },
      enabled: projectId > 0,
    }),

  /**
   * Query options for fetching invoices by status.
   */
  byStatus: (params: InvoicesByStatusParams) =>
    queryOptions({
      queryKey: [
        ...invoiceQueries.lists(),
        'status',
        params.status,
        params.page,
        params.size,
      ],
      queryFn: async (): Promise<Paginated<InvoiceSummary>> => {
        const response = await getInvoicesByStatus(params);
        return {
          data: response.content.map(invoiceMapper.toSummary),
          pagination: {
            page: response.number,
            size: response.size,
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            first: response.first,
            last: response.last,
          },
        };
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Query key for detail queries.
   */
  details: () => [...invoiceQueries.all(), 'detail'] as const,

  /**
   * Query options for fetching single invoice detail.
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...invoiceQueries.details(), id],
      queryFn: async (): Promise<Invoice> => {
        const response = await getInvoiceById(id);
        return invoiceMapper.toDomain(response);
      },
      enabled: id > 0,
    }),
};
