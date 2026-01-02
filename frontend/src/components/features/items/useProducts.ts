/**
 * Products Hook
 *
 * Manages product listing with pagination, search, and filtering.
 * Uses TanStack Query via product entity queries.
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  productQueries,
  type ProductListItem,
  type ProductType,
} from '@/entities/product';

interface UseProductsOptions {
  /** Initial page size */
  pageSize?: number;
  /** Auto-load on mount */
  autoLoad?: boolean;
}

interface UseProductsReturn {
  // Data
  products: ProductListItem[];
  productTypes: ProductType[];

  // Pagination
  page: number;
  totalElements: number;
  isFirst: boolean;
  isLast: boolean;

  // State
  loading: boolean;
  error: string | null;

  // Filters
  search: string;
  selectedTypeId: number | null;

  // Actions
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setSelectedTypeId: (typeId: number | null) => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing product list with pagination and filtering.
 * Uses TanStack Query for data fetching and caching.
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { pageSize = 20, autoLoad = true } = options;

  // Filter state
  const [page, setPageState] = useState(0);
  const [search, setSearchState] = useState('');
  const [selectedTypeId, setSelectedTypeIdState] = useState<number | null>(null);

  // Products list query
  const productsQuery = useQuery({
    ...productQueries.list({
      page,
      size: pageSize,
      search,
      productTypeId: selectedTypeId,
    }),
    enabled: autoLoad,
  });

  // Product types query
  const productTypesQuery = useQuery(productQueries.allTypes());

  // Derived data
  const products = productsQuery.data?.data ?? [];
  const pagination = productsQuery.data?.pagination;

  // Reset page when filters change
  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPageState(0);
  }, []);

  const setSelectedTypeId = useCallback((typeId: number | null) => {
    setSelectedTypeIdState(typeId);
    setPageState(0);
  }, []);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const clearError = useCallback(() => {
    // Errors are managed by TanStack Query, this is a no-op for compatibility
  }, []);

  const refresh = useCallback(async () => {
    await productsQuery.refetch();
  }, [productsQuery]);

  return {
    products,
    productTypes: productTypesQuery.data ?? [],
    page,
    totalElements: pagination?.totalElements ?? 0,
    isFirst: pagination?.first ?? true,
    isLast: pagination?.last ?? true,
    loading: productsQuery.isLoading || productsQuery.isFetching,
    error: productsQuery.error?.message ?? null,
    search,
    selectedTypeId,
    setPage,
    setSearch,
    setSelectedTypeId,
    refresh,
    clearError,
  };
}
