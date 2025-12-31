/**
 * Quotation Query Factory.
 *
 * Centralized query factory following TanStack Query v5 + FSD pattern.
 * Combines query keys and functions using queryOptions for type safety.
 *
 * Usage:
 * - Direct in components: useQuery(quotationQueries.detail(id))
 * - Prefetching: queryClient.prefetchQuery(quotationQueries.detail(id))
 * - Invalidation: queryClient.invalidateQueries({ queryKey: quotationQueries.lists() })
 *
 * @see https://feature-sliced.github.io/documentation/docs/guides/tech/with-react-query
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import type { Quotation, QuotationListItem } from '../model/quotation';
import type { QuotationStatus } from '../model/quotation-status';
import { quotationMapper } from './quotation.mapper';
import { getQuotation, getQuotations } from './get-quotation';
import type { Paginated } from '@/shared/api/types';

/**
 * Parameters for list query.
 */
export interface QuotationListQueryParams {
  page: number;
  size: number;
  search: string;
  status: QuotationStatus | null;
  projectId: number | null;
}

/**
 * Paginated quotation list result with domain models.
 */
export interface PaginatedQuotations extends Paginated<QuotationListItem> {
  totalPages: number;
  totalElements: number;
  size: number;
  first: boolean;
  last: boolean;
}

/**
 * Quotation query factory.
 *
 * Follows FSD pattern with hierarchical keys and queryOptions.
 * All queries return domain models (not DTOs).
 */
export const quotationQueries = {
  /**
   * Base key for all quotation queries.
   */
  all: () => ['quotations'] as const,

  /**
   * Base key for list queries.
   */
  lists: () => [...quotationQueries.all(), 'list'] as const,

  /**
   * Paginated list query with filters.
   *
   * @example
   * const { data } = useQuery(quotationQueries.list({ page: 0, size: 10, search: '', status: null, projectId: null }));
   */
  list: (params: QuotationListQueryParams) =>
    queryOptions({
      queryKey: [
        ...quotationQueries.lists(),
        params.page,
        params.size,
        params.search,
        params.status,
        params.projectId,
      ] as const,
      queryFn: async (): Promise<PaginatedQuotations> => {
        const response = await getQuotations({
          page: params.page,
          size: params.size,
          search: params.search || undefined,
          status: params.status ?? undefined,
          projectId: params.projectId ?? undefined,
        });

        return {
          data: response.data.map(quotationMapper.responseToListItem),
          pagination: response.pagination,
          totalPages: response.pagination.totalPages,
          totalElements: response.pagination.totalElements,
          size: response.pagination.size,
          first: response.pagination.first,
          last: response.pagination.last,
        };
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Base key for detail queries.
   */
  details: () => [...quotationQueries.all(), 'detail'] as const,

  /**
   * Single quotation detail query.
   *
   * @example
   * const { data } = useQuery(quotationQueries.detail(123));
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...quotationQueries.details(), id] as const,
      queryFn: async (): Promise<Quotation> => {
        const dto = await getQuotation(id);
        return quotationMapper.toDomain(dto);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
