/**
 * Service Categories Hook
 *
 * Manages service category listing with pagination and search.
 * Uses TanStack Query via catalog entity queries.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  catalogQueries,
  type ServiceCategoryListItem,
  type VendorOffering,
} from '@/entities/catalog';

interface UseServiceCategoriesOptions {
  /** Initial page size */
  pageSize?: number;
  /** Auto-load on mount */
  autoLoad?: boolean;
}

interface UseServiceCategoriesReturn {
  // Data
  categories: ServiceCategoryListItem[];

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

  // Actions
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  refresh: () => Promise<void>;
  clearError: () => void;

  // Vendor offerings
  loadOfferings: (categoryId: number) => Promise<VendorOffering[]>;
}

/**
 * Hook for managing service category list with pagination.
 * Uses TanStack Query for data fetching and caching.
 */
export function useServiceCategories(
  options: UseServiceCategoriesOptions = {}
): UseServiceCategoriesReturn {
  const { pageSize = 20, autoLoad = true } = options;
  const queryClient = useQueryClient();

  // Filter state
  const [page, setPageState] = useState(0);
  const [search, setSearchState] = useState('');

  // Categories list query
  const categoriesQuery = useQuery({
    ...catalogQueries.categoryList({
      page,
      size: pageSize,
      search,
    }),
    enabled: autoLoad,
  });

  // Derived data
  const categories = categoriesQuery.data?.data ?? [];
  const pagination = categoriesQuery.data?.pagination;

  // Reset page when search changes
  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPageState(0);
  }, []);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const clearError = useCallback(() => {
    // Errors are managed by TanStack Query, this is a no-op for compatibility
  }, []);

  const refresh = useCallback(async () => {
    await categoriesQuery.refetch();
  }, [categoriesQuery]);

  // Load offerings for a category - uses query client directly
  const loadOfferings = useCallback(
    async (categoryId: number): Promise<VendorOffering[]> => {
      return queryClient.fetchQuery(catalogQueries.currentOfferings(categoryId));
    },
    [queryClient]
  );

  return {
    categories,
    page,
    totalElements: pagination?.totalElements ?? 0,
    isFirst: pagination?.first ?? true,
    isLast: pagination?.last ?? true,
    loading: categoriesQuery.isLoading || categoriesQuery.isFetching,
    error: categoriesQuery.error?.message ?? null,
    search,
    setPage,
    setSearch,
    refresh,
    clearError,
    loadOfferings,
  };
}
