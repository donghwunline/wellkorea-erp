/**
 * Purchase Request Query Factory.
 *
 * Centralized query factory following TanStack Query v5 + FSD pattern.
 * Provides type-safe queries for purchase request data.
 *
 * Usage:
 * - Direct: useQuery(purchaseRequestQueries.detail(id))
 * - Prefetch: queryClient.prefetchQuery(purchaseRequestQueries.detail(id))
 * - Invalidate: queryClient.invalidateQueries({ queryKey: purchaseRequestQueries.lists() })
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import type { PurchaseRequest, PurchaseRequestListItem } from '../model/purchase-request';
import type { PurchaseRequestStatus } from '../model/purchase-request-status';
import { purchaseRequestMapper } from './purchase-request.mapper';
import { getPurchaseRequest, getPurchaseRequests } from './get-purchase-request';
import type { Paginated } from '@/shared/lib/pagination';

/**
 * Parameters for list query.
 */
export interface PurchaseRequestListQueryParams {
  page: number;
  size: number;
  status: PurchaseRequestStatus | null;
  projectId: number | null;
  dtype: 'SERVICE' | 'MATERIAL' | null;
}

/**
 * Purchase request query factory.
 */
export const purchaseRequestQueries = {
  /**
   * Base key for all purchase request queries.
   */
  all: () => ['purchase-requests'] as const,

  /**
   * Base key for list queries.
   */
  lists: () => [...purchaseRequestQueries.all(), 'list'] as const,

  /**
   * Paginated list query with filters.
   *
   * @example
   * const { data } = useQuery(purchaseRequestQueries.list({ page: 0, size: 10, status: null, projectId: null }));
   */
  list: (params: PurchaseRequestListQueryParams) =>
    queryOptions({
      queryKey: [
        ...purchaseRequestQueries.lists(),
        params.page,
        params.size,
        params.status,
        params.projectId,
        params.dtype,
      ] as const,
      queryFn: async (): Promise<Paginated<PurchaseRequestListItem>> => {
        const response = await getPurchaseRequests({
          page: params.page,
          size: params.size,
          status: params.status ?? undefined,
          projectId: params.projectId ?? undefined,
          dtype: params.dtype ?? undefined,
        });

        return {
          data: response.data.map(purchaseRequestMapper.summaryToListItem),
          pagination: response.pagination,
        };
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Base key for detail queries.
   */
  details: () => [...purchaseRequestQueries.all(), 'detail'] as const,

  /**
   * Single purchase request detail query.
   *
   * @example
   * const { data } = useQuery(purchaseRequestQueries.detail(123));
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...purchaseRequestQueries.details(), id] as const,
      queryFn: async (): Promise<PurchaseRequest> => {
        const dto = await getPurchaseRequest(id);
        return purchaseRequestMapper.toDomain(dto);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
