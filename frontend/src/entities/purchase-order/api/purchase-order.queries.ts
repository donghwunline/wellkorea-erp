/**
 * Purchase Order Query Factory.
 *
 * Centralized query factory following TanStack Query v5 + FSD pattern.
 * Provides type-safe queries for purchase order data.
 *
 * Usage:
 * - Direct: useQuery(purchaseOrderQueries.detail(id))
 * - Prefetch: queryClient.prefetchQuery(purchaseOrderQueries.detail(id))
 * - Invalidate: queryClient.invalidateQueries({ queryKey: purchaseOrderQueries.lists() })
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import type { PurchaseOrder, PurchaseOrderListItem } from '../model/purchase-order';
import type { PurchaseOrderStatus } from '../model/purchase-order-status';
import { purchaseOrderMapper } from './purchase-order.mapper';
import { getPurchaseOrder, getPurchaseOrders } from './get-purchase-order';
import type { Paginated } from '@/shared/lib/pagination';

/**
 * Parameters for list query.
 */
export interface PurchaseOrderListQueryParams {
  page: number;
  size: number;
  status: PurchaseOrderStatus | null;
  projectId: number | null;
  vendorId: number | null;
}

/**
 * Purchase order query factory.
 */
export const purchaseOrderQueries = {
  /**
   * Base key for all purchase order queries.
   */
  all: () => ['purchase-orders'] as const,

  /**
   * Base key for list queries.
   */
  lists: () => [...purchaseOrderQueries.all(), 'list'] as const,

  /**
   * Paginated list query with filters.
   *
   * @example
   * const { data } = useQuery(purchaseOrderQueries.list({ page: 0, size: 10, status: null, projectId: null, vendorId: null }));
   */
  list: (params: PurchaseOrderListQueryParams) =>
    queryOptions({
      queryKey: [
        ...purchaseOrderQueries.lists(),
        params.page,
        params.size,
        params.status,
        params.projectId,
        params.vendorId,
      ] as const,
      queryFn: async (): Promise<Paginated<PurchaseOrderListItem>> => {
        const response = await getPurchaseOrders({
          page: params.page,
          size: params.size,
          status: params.status ?? undefined,
          projectId: params.projectId ?? undefined,
          vendorId: params.vendorId ?? undefined,
        });

        return {
          data: response.data.map(purchaseOrderMapper.summaryToListItem),
          pagination: response.pagination,
        };
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Base key for detail queries.
   */
  details: () => [...purchaseOrderQueries.all(), 'detail'] as const,

  /**
   * Single purchase order detail query.
   *
   * @example
   * const { data } = useQuery(purchaseOrderQueries.detail(123));
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...purchaseOrderQueries.details(), id] as const,
      queryFn: async (): Promise<PurchaseOrder> => {
        const dto = await getPurchaseOrder(id);
        return purchaseOrderMapper.toDomain(dto);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
