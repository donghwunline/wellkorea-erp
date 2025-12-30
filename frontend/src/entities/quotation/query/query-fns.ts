/**
 * Quotation query functions.
 *
 * Reusable query functions that always return domain models.
 * Must be used in all query hooks, prefetchQuery, ensureQueryData calls
 * to maintain consistent cache data format.
 */

import type { Quotation } from '../model';
import type { QuotationStatus } from '../model';
import { quotationApi, quotationMapper } from '../api';
import type { Paginated } from '@/shared/api/types';

/**
 * Parameters for list query.
 */
export interface QuotationListParams {
  page: number;
  size: number;
  search: string;
  status: QuotationStatus | null;
  projectId: number | null;
}

/**
 * Paginated quotation result with domain models.
 * Extends Paginated with additional flattened pagination properties for convenience.
 */
export interface PaginatedQuotations extends Paginated<Quotation> {
  // Flattened pagination properties for convenience (from pagination object)
  totalPages: number;
  totalElements: number;
  size: number;
  first: boolean;
  last: boolean;
}

/**
 * Query functions for quotation data.
 *
 * These functions:
 * 1. Call the API
 * 2. Map DTOs to domain models
 * 3. Return domain models (never DTOs)
 *
 * Usage:
 * - useQuery({ queryKey: ..., queryFn: quotationQueryFns.detail(id) })
 * - queryClient.prefetchQuery({ queryKey: ..., queryFn: quotationQueryFns.detail(id) })
 */
export const quotationQueryFns = {
  /**
   * Query function for single quotation.
   * Returns a function that fetches and maps to domain model.
   *
   * @param id - Quotation ID
   */
  detail: (id: number) => async (): Promise<Quotation> => {
    const dto = await quotationApi.getById(id);
    return quotationMapper.toDomain(dto);
  },

  /**
   * Query function for paginated quotation list.
   * Returns a function that fetches and maps to domain models.
   *
   * @param params - Query parameters
   */
  list: (params: QuotationListParams) => async (): Promise<PaginatedQuotations> => {
    const response = await quotationApi.getList({
      page: params.page,
      size: params.size,
      search: params.search || undefined,
      status: params.status ?? undefined,
      projectId: params.projectId ?? undefined,
    });

    return {
      data: response.data.map(quotationMapper.toDomain),
      pagination: response.pagination,
      // Flatten pagination properties for convenience
      totalPages: response.pagination.totalPages,
      totalElements: response.pagination.totalElements,
      size: response.pagination.size,
      first: response.pagination.first,
      last: response.pagination.last,
    };
  },
};
