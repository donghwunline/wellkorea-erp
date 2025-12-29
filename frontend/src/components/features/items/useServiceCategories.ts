/**
 * Service Categories Hook
 *
 * Manages service category listing with pagination and search.
 */

import { useState, useCallback, useEffect } from 'react';
import { serviceCategoryService } from '@/services';
import type { ServiceCategorySummary, VendorServiceOffering } from '@/services';
import type { ApiError } from '@/api/types';
import { getErrorMessage } from '@/shared/utils';

interface UseServiceCategoriesOptions {
  /** Initial page size */
  pageSize?: number;
  /** Auto-load on mount */
  autoLoad?: boolean;
}

interface UseServiceCategoriesReturn {
  // Data
  categories: ServiceCategorySummary[];

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
  loadOfferings: (categoryId: number) => Promise<VendorServiceOffering[]>;
}

/**
 * Hook for managing service category list with pagination.
 */
export function useServiceCategories(
  options: UseServiceCategoriesOptions = {}
): UseServiceCategoriesReturn {
  const { pageSize = 20, autoLoad = true } = options;

  // Data state
  const [categories, setCategories] = useState<ServiceCategorySummary[]>([]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(true);

  // Loading/error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearchState] = useState('');

  // Load categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await serviceCategoryService.getServiceCategories({
        page,
        size: pageSize,
        search: search || undefined,
      });
      setCategories(result.data);
      setTotalElements(result.pagination.totalElements);
      setIsFirst(result.pagination.first);
      setIsLast(result.pagination.last);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  // Load offerings for a category
  const loadOfferings = useCallback(async (categoryId: number) => {
    return serviceCategoryService.getCurrentOfferingsForCategory(categoryId);
  }, []);

  // Reset page when search changes
  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(0);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    if (autoLoad) {
      loadCategories();
    }
  }, [autoLoad, loadCategories]);

  return {
    categories,
    page,
    totalElements,
    isFirst,
    isLast,
    loading,
    error,
    search,
    setPage,
    setSearch,
    refresh: loadCategories,
    clearError,
    loadOfferings,
  };
}
