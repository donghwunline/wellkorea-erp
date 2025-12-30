/**
 * Unit tests for useProducts hook.
 * Tests product listing with pagination, search, filtering, and error handling.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useProducts } from './useProducts';
import { productService } from '@/services';
import type { PaginatedProducts, ProductSummary, ProductType } from '@/services';

// Mock the product service
vi.mock('@/services', () => ({
  productService: {
    getProducts: vi.fn(),
    getProductTypes: vi.fn(),
  },
}));

// Mock @/shared/utils
vi.mock('@/shared/utils', () => ({
  getErrorMessage: vi.fn((error: unknown) => {
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message: string }).message;
    }
    return 'An error occurred';
  }),
}));

describe('useProducts', () => {
  const mockGetProducts = productService.getProducts as Mock;
  const mockGetProductTypes = productService.getProductTypes as Mock;

  const mockProductTypes: ProductType[] = [
    { id: 1, name: 'Electronics', createdAt: '2024-01-01T00:00:00Z' },
    { id: 2, name: 'Machinery', createdAt: '2024-01-01T00:00:00Z' },
  ];

  const mockProducts: ProductSummary[] = [
    {
      id: 1,
      sku: 'SKU-001',
      name: 'Product A',
      productTypeId: 1,
      productTypeName: 'Electronics',
      baseUnitPrice: 10000,
      unit: 'EA',
      isActive: true,
    },
    {
      id: 2,
      sku: 'SKU-002',
      name: 'Product B',
      productTypeId: 2,
      productTypeName: 'Machinery',
      baseUnitPrice: 25000,
      unit: 'SET',
      isActive: true,
    },
  ];

  const mockPaginatedResponse: PaginatedProducts = {
    data: mockProducts,
    pagination: {
      totalElements: 2,
      totalPages: 1,
      size: 20,
      page: 0,
      first: true,
      last: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProducts.mockResolvedValue(mockPaginatedResponse);
    mockGetProductTypes.mockResolvedValue(mockProductTypes);
  });

  describe('initial state', () => {
    it('should start with empty products array', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }));

      expect(result.current.products).toEqual([]);
    });

    it('should start with page 0', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }));

      expect(result.current.page).toBe(0);
    });

    it('should start with loading false', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }));

      expect(result.current.loading).toBe(false);
    });

    it('should start with error null', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }));

      expect(result.current.error).toBeNull();
    });

    it('should start with empty search', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }));

      expect(result.current.search).toBe('');
    });

    it('should start with selectedTypeId null', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }));

      expect(result.current.selectedTypeId).toBeNull();
    });

    it('should return all action functions', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }));

      expect(typeof result.current.setPage).toBe('function');
      expect(typeof result.current.setSearch).toBe('function');
      expect(typeof result.current.setSelectedTypeId).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('auto-load behavior', () => {
    it('should load products on mount when autoLoad is true (default)', async () => {
      renderHook(() => useProducts());

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledTimes(1);
      });
    });

    it('should load product types on mount', async () => {
      renderHook(() => useProducts());

      await waitFor(() => {
        expect(mockGetProductTypes).toHaveBeenCalledTimes(1);
      });
    });

    it('should NOT load products when autoLoad is false', async () => {
      renderHook(() => useProducts({ autoLoad: false }));

      // Give it time to potentially load
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockGetProducts).not.toHaveBeenCalled();
    });

    it('should still load product types even when autoLoad is false', async () => {
      renderHook(() => useProducts({ autoLoad: false }));

      await waitFor(() => {
        expect(mockGetProductTypes).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('loading products', () => {
    it('should set loading true during fetch', async () => {
      let resolvePromise: (value: PaginatedProducts) => void;
      mockGetProducts.mockImplementation(
        () =>
          new Promise<PaginatedProducts>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useProducts());

      // Loading should be true during fetch
      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise(mockPaginatedResponse);
      });

      expect(result.current.loading).toBe(false);
    });

    it('should populate products on success', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.products).toEqual(mockProducts);
      });
    });

    it('should set pagination state on success', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.totalElements).toBe(2);
        expect(result.current.isFirst).toBe(true);
        expect(result.current.isLast).toBe(true);
      });
    });

    it('should set error message on API failure', async () => {
      mockGetProducts.mockRejectedValue({ message: 'Network error' });

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should set loading false on error', async () => {
      mockGetProducts.mockRejectedValue({ message: 'Network error' });

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('product types', () => {
    it('should populate productTypes on success', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.productTypes).toEqual(mockProductTypes);
      });
    });

    it('should log error but not throw when product types fail', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetProductTypes.mockRejectedValue(new Error('Failed to load types'));

      renderHook(() => useProducts());

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('should update search state', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearch('test');
      });

      expect(result.current.search).toBe('test');
    });

    it('should reset page to 0 when search changes', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Set page to 1 first
      act(() => {
        result.current.setPage(1);
      });

      expect(result.current.page).toBe(1);

      // Now search - should reset page
      act(() => {
        result.current.setSearch('test');
      });

      expect(result.current.page).toBe(0);
    });

    it('should trigger reload when search changes', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.setSearch('test');
      });

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledTimes(2);
      });
    });

    it('should pass search in API request params', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearch('test');
      });

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenLastCalledWith(
          expect.objectContaining({
            search: 'test',
          })
        );
      });
    });
  });

  describe('product type filter', () => {
    it('should update selectedTypeId state', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSelectedTypeId(1);
      });

      expect(result.current.selectedTypeId).toBe(1);
    });

    it('should reset page to 0 when type changes', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPage(1);
      });

      expect(result.current.page).toBe(1);

      act(() => {
        result.current.setSelectedTypeId(2);
      });

      expect(result.current.page).toBe(0);
    });

    it('should trigger reload when type changes', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.setSelectedTypeId(1);
      });

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledTimes(2);
      });
    });

    it('should pass productTypeId in API request params', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSelectedTypeId(1);
      });

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenLastCalledWith(
          expect.objectContaining({
            productTypeId: 1,
          })
        );
      });
    });
  });

  describe('pagination', () => {
    it('should update page state', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.page).toBe(2);
    });

    it('should trigger reload when page changes', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.setPage(1);
      });

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledTimes(2);
      });
    });

    it('should pass page in API request params', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenLastCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    });

    it('should use pageSize from options', async () => {
      renderHook(() => useProducts({ pageSize: 10 }));

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            size: 10,
          })
        );
      });
    });

    it('should use default pageSize of 20', async () => {
      renderHook(() => useProducts());

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            size: 20,
          })
        );
      });
    });
  });

  describe('error handling', () => {
    it('should clear error state with clearError', async () => {
      mockGetProducts.mockRejectedValueOnce({ message: 'Test error' });

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear error before new request', async () => {
      mockGetProducts.mockRejectedValueOnce({ message: 'First error' });

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      mockGetProducts.mockResolvedValueOnce(mockPaginatedResponse);

      act(() => {
        result.current.setPage(1);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('refresh', () => {
    it('should reload products when refresh is called', async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockGetProducts).toHaveBeenCalledTimes(2);
    });
  });

  describe('function stability', () => {
    it('should return stable function references', async () => {
      const { result, rerender } = renderHook(() => useProducts({ autoLoad: false }));

      const firstSetPage = result.current.setPage;
      const firstSetSearch = result.current.setSearch;
      const firstSetSelectedTypeId = result.current.setSelectedTypeId;
      const firstClearError = result.current.clearError;

      rerender();

      expect(result.current.setPage).toBe(firstSetPage);
      expect(result.current.setSearch).toBe(firstSetSearch);
      expect(result.current.setSelectedTypeId).toBe(firstSetSelectedTypeId);
      expect(result.current.clearError).toBe(firstClearError);
    });
  });
});
