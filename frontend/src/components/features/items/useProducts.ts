/**
 * Products Hook
 *
 * Manages product listing with pagination, search, and filtering.
 */

import { useState, useCallback, useEffect } from 'react';
import { productService } from '@/services';
import type { ProductSummary, ProductType, ProductListParams } from '@/services';
import type { ApiError } from '@/api/types';
import { getErrorMessage } from '@/shared/utils';

interface UseProductsOptions {
  /** Initial page size */
  pageSize?: number;
  /** Auto-load on mount */
  autoLoad?: boolean;
}

interface UseProductsReturn {
  // Data
  products: ProductSummary[];
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
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { pageSize = 20, autoLoad = true } = options;

  // Data state
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

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
  const [selectedTypeId, setSelectedTypeIdState] = useState<number | null>(null);

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ProductListParams = {
        page,
        size: pageSize,
        search: search || undefined,
        productTypeId: selectedTypeId || undefined,
      };
      const result = await productService.getProducts(params);
      setProducts(result.data);
      setTotalElements(result.pagination.totalElements);
      setIsFirst(result.pagination.first);
      setIsLast(result.pagination.last);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedTypeId]);

  // Load product types for filter
  const loadProductTypes = useCallback(async () => {
    try {
      const types = await productService.getProductTypes();
      setProductTypes(types);
    } catch (err) {
      console.error('Failed to load product types:', err);
    }
  }, []);

  // Reset page when filters change
  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(0);
  }, []);

  const setSelectedTypeId = useCallback((typeId: number | null) => {
    setSelectedTypeIdState(typeId);
    setPage(0);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    loadProductTypes();
  }, [loadProductTypes]);

  useEffect(() => {
    if (autoLoad) {
      loadProducts();
    }
  }, [autoLoad, loadProducts]);

  return {
    products,
    productTypes,
    page,
    totalElements,
    isFirst,
    isLast,
    loading,
    error,
    search,
    selectedTypeId,
    setPage,
    setSearch,
    setSelectedTypeId,
    refresh: loadProducts,
    clearError,
  };
}
