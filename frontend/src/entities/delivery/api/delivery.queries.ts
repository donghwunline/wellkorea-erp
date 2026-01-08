/**
 * Delivery query factory using TanStack Query v5 queryOptions pattern.
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import { getDeliveries, getDeliveryById } from './get-delivery';
import type { DeliveryListParams } from './get-delivery';
import { deliveryMapper } from './delivery.mapper';
import type { Delivery } from '../model/delivery';

/**
 * Query factory for delivery-related queries.
 * Usage: useQuery(deliveryQueries.list({ projectId: 123 }))
 */
export const deliveryQueries = {
  /**
   * Base query key for all delivery queries.
   */
  all: () => ['deliveries'] as const,

  /**
   * Query key for list queries.
   */
  lists: () => [...deliveryQueries.all(), 'list'] as const,

  /**
   * Query options for fetching deliveries list.
   */
  list: (params: DeliveryListParams = {}) =>
    queryOptions({
      queryKey: [
        ...deliveryQueries.lists(),
        params.projectId,
        params.status,
        params.page,
        params.size,
      ],
      queryFn: async (): Promise<Delivery[]> => {
        const response = await getDeliveries(params);
        return response.map(deliveryMapper.summaryToDomain);
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Query key for detail queries.
   */
  details: () => [...deliveryQueries.all(), 'detail'] as const,

  /**
   * Query options for fetching single delivery detail.
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...deliveryQueries.details(), id],
      queryFn: async (): Promise<Delivery> => {
        const response = await getDeliveryById(id);
        return deliveryMapper.toDomain(response);
      },
      enabled: id > 0,
    }),
};
