/**
 * Product Query Factory.
 *
 * Centralized query factory following TanStack Query v5 + FSD pattern.
 * Combines query keys and functions using queryOptions for type safety.
 *
 * Usage:
 * - Direct in components: useQuery(productQueries.detail(id))
 * - Prefetching: queryClient.prefetchQuery(productQueries.detail(id))
 * - Invalidation: queryClient.invalidateQueries({ queryKey: productQueries.lists() })
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import type { Product, ProductListItem } from '../model/product';
import type { ProductType } from '../model/product-type';
import type { Paginated } from '@/shared/lib/pagination';
import { productMapper, productTypeMapper } from './product.mapper';
import { getProduct, getProducts, getProductTypes } from './get-product';

/**
 * Parameters for product list query.
 * Uses primitives for stable query keys.
 */
export interface ProductListQueryParams {
  page: number;
  size: number;
  search: string;
  productTypeId: number | null;
}

/**
 * Product query factory.
 *
 * Follows FSD pattern with hierarchical keys and queryOptions.
 * All queries return domain models (not DTOs).
 */
export const productQueries = {
  /**
   * Base key for all product queries.
   */
  all: () => ['products'] as const,

  /**
   * Base key for list queries.
   */
  lists: () => [...productQueries.all(), 'list'] as const,

  /**
   * Paginated list query with filters.
   *
   * @example
   * const { data } = useQuery(productQueries.list({
   *   page: 0, size: 20, search: '', productTypeId: null
   * }));
   */
  list: (params: ProductListQueryParams) =>
    queryOptions({
      queryKey: [
        ...productQueries.lists(),
        params.page,
        params.size,
        params.search,
        params.productTypeId,
      ] as const,
      queryFn: async (): Promise<Paginated<ProductListItem>> => {
        const response = await getProducts({
          page: params.page,
          size: params.size,
          search: params.search || undefined,
          productTypeId: params.productTypeId ?? undefined,
        });

        return {
          data: response.data.map(productMapper.toListItem),
          pagination: response.pagination,
        };
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Base key for detail queries.
   */
  details: () => [...productQueries.all(), 'detail'] as const,

  /**
   * Single product detail query.
   *
   * @example
   * const { data: product } = useQuery(productQueries.detail(123));
   * if (productRules.canEdit(product)) { ... }
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...productQueries.details(), id] as const,
      queryFn: async (): Promise<Product> => {
        const dto = await getProduct(id);
        return productMapper.toDomain(dto);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Base key for product types queries.
   */
  types: () => [...productQueries.all(), 'types'] as const,

  /**
   * All product types query.
   *
   * @example
   * const { data: types } = useQuery(productQueries.allTypes());
   */
  allTypes: () =>
    queryOptions({
      queryKey: productQueries.types(),
      queryFn: async (): Promise<ProductType[]> => {
        const dtos = await getProductTypes();
        return dtos.map(productTypeMapper.toDomain);
      },
      staleTime: 1000 * 60 * 30, // 30 minutes (product types rarely change)
    }),

  /**
   * Search products query (for combobox/autocomplete).
   *
   * @example
   * const { data } = useQuery(productQueries.search('widget', 20));
   */
  search: (query: string, limit: number = 20) =>
    queryOptions({
      queryKey: [...productQueries.all(), 'search', query, limit] as const,
      queryFn: async (): Promise<ProductListItem[]> => {
        const response = await getProducts({
          search: query,
          page: 0,
          size: limit,
        });
        return response.data.map(productMapper.toListItem);
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
      enabled: query.length > 0, // Only run when there's a search query
    }),
};
