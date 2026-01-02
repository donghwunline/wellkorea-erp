/**
 * Unit tests for useProducts hook.
 * Tests product listing with pagination, search, filtering, and error handling.
 * Uses TanStack Query mocking pattern.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useProducts } from './useProducts';
import type { ProductListItem, ProductType } from '@/entities/product';
import type { Paginated } from '@/shared/lib/pagination';

// Mock the product entity API functions
const mockGetProducts = vi.fn();
const mockGetProductTypes = vi.fn();

vi.mock('@/entities/product/api/get-product', () => ({
  getProducts: (...args: unknown[]) => mockGetProducts(...args),
  getProductTypes: () => mockGetProductTypes(),
}));

// Test data
const mockProductTypes: ProductType[] = [
  { id: 1, name: 'Electronics', description: null, createdAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Machinery', description: null, createdAt: '2024-01-01T00:00:00Z' },
];

const mockProducts: ProductListItem[] = [
  {
    id: 1,
    sku: 'SKU-001',
    name: 'Product A',
    description: null,
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
    description: null,
    productTypeId: 2,
    productTypeName: 'Machinery',
    baseUnitPrice: 25000,
    unit: 'SET',
    isActive: true,
  },
];

const mockPaginatedResponse: Paginated<ProductListItem> = {
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

// Create wrapper with QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProducts.mockResolvedValue({
      data: mockProducts.map(p => ({
        ...p,
        description: p.description,
        baseUnitPrice: p.baseUnitPrice,
      })),
      pagination: mockPaginatedResponse.pagination,
    });
    mockGetProductTypes.mockResolvedValue(
      mockProductTypes.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        createdAt: t.createdAt,
      }))
    );
  });

  describe('initial state', () => {
    it('should start with empty products array', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.products).toEqual([]);
    });

    it('should start with page 0', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.page).toBe(0);
    });

    it('should start with loading false when autoLoad is false', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(false);
    });

    it('should start with error null', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBeNull();
    });

    it('should start with empty search', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.search).toBe('');
    });

    it('should start with selectedTypeId null', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.selectedTypeId).toBeNull();
    });

    it('should return all action functions', () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.setPage).toBe('function');
      expect(typeof result.current.setSearch).toBe('function');
      expect(typeof result.current.setSelectedTypeId).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('auto-load behavior', () => {
    it('should load products on mount when autoLoad is true (default)', async () => {
      renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalled();
      });
    });

    it('should load product types on mount', async () => {
      renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockGetProductTypes).toHaveBeenCalled();
      });
    });

    it('should NOT load products when autoLoad is false', async () => {
      renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      // Give it time to potentially load
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockGetProducts).not.toHaveBeenCalled();
    });
  });

  describe('loading products', () => {
    it('should populate products on success', async () => {
      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.products.length).toBeGreaterThan(0);
      });
    });

    it('should set pagination state on success', async () => {
      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.totalElements).toBe(2);
        expect(result.current.isFirst).toBe(true);
        expect(result.current.isLast).toBe(true);
      });
    });

    it('should set error message on API failure', async () => {
      mockGetProducts.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });
  });

  describe('product types', () => {
    it('should populate productTypes on success', async () => {
      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.productTypes.length).toBe(2);
      });
    });
  });

  describe('search', () => {
    it('should update search state', async () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSearch('test');
      });

      expect(result.current.search).toBe('test');
    });

    it('should reset page to 0 when search changes', async () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
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
  });

  describe('product type filter', () => {
    it('should update selectedTypeId state', async () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSelectedTypeId(1);
      });

      expect(result.current.selectedTypeId).toBe(1);
    });

    it('should reset page to 0 when type changes', async () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
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
  });

  describe('pagination', () => {
    it('should update page state', async () => {
      const { result } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.page).toBe(2);
    });
  });

  describe('refresh', () => {
    it('should reload products when refresh is called', async () => {
      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

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
      const { result, rerender } = renderHook(() => useProducts({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

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
