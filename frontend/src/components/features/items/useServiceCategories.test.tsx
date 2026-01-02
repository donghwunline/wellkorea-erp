/**
 * Unit tests for useServiceCategories hook.
 * Tests service category listing with pagination, search, and vendor offerings.
 * Uses TanStack Query mocking pattern.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useServiceCategories } from './useServiceCategories';
import type { ServiceCategoryListItem, VendorOffering } from '@/entities/catalog';
import type { Paginated } from '@/shared/lib/pagination';

// Mock the catalog entity API functions
const mockGetServiceCategories = vi.fn();
const mockGetCurrentOfferingsForCategory = vi.fn();

vi.mock('@/entities/catalog/api/get-catalog', () => ({
  getServiceCategories: (...args: unknown[]) => mockGetServiceCategories(...args),
  getCurrentOfferingsForCategory: (...args: unknown[]) =>
    mockGetCurrentOfferingsForCategory(...args),
}));

// Test data
const mockCategories: ServiceCategoryListItem[] = [
  {
    id: 1,
    name: 'Laser Cutting',
    description: 'Laser cutting services',
    isActive: true,
    vendorCount: 3,
  },
  {
    id: 2,
    name: 'CNC Machining',
    description: 'CNC machining services',
    isActive: true,
    vendorCount: 5,
  },
];

const mockPaginatedResponse: Paginated<ServiceCategoryListItem> = {
  data: mockCategories,
  pagination: {
    totalElements: 2,
    totalPages: 1,
    size: 20,
    page: 0,
    first: true,
    last: true,
  },
};

const mockOfferings: VendorOffering[] = [
  {
    id: 1,
    serviceCategoryId: 1,
    serviceCategoryName: 'Laser Cutting',
    vendorId: 10,
    vendorName: 'Vendor A',
    vendorServiceCode: null,
    vendorServiceName: null,
    unitPrice: 5000,
    currency: 'KRW',
    leadTimeDays: 3,
    minOrderQuantity: null,
    isPreferred: false,
    notes: 'Quality service',
    effectiveFrom: '2024-01-01',
    effectiveTo: '2024-12-31',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

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

describe('useServiceCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServiceCategories.mockResolvedValue(mockPaginatedResponse);
    mockGetCurrentOfferingsForCategory.mockResolvedValue(mockOfferings);
  });

  describe('initial state', () => {
    it('should start with empty categories array', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.categories).toEqual([]);
    });

    it('should start with page 0', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.page).toBe(0);
    });

    it('should start with loading false when autoLoad is false', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(false);
    });

    it('should start with error null', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBeNull();
    });

    it('should start with empty search', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.search).toBe('');
    });

    it('should return all action functions', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.setPage).toBe('function');
      expect(typeof result.current.setSearch).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.loadOfferings).toBe('function');
    });
  });

  describe('auto-load behavior', () => {
    it('should load categories on mount when autoLoad is true (default)', async () => {
      renderHook(() => useServiceCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockGetServiceCategories).toHaveBeenCalled();
      });
    });

    it('should NOT load categories when autoLoad is false', async () => {
      renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      // Give it time to potentially load
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockGetServiceCategories).not.toHaveBeenCalled();
    });
  });

  describe('loading categories', () => {
    it('should populate categories on success', async () => {
      const { result } = renderHook(() => useServiceCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });
    });

    it('should set pagination state on success', async () => {
      const { result } = renderHook(() => useServiceCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.totalElements).toBe(2);
        expect(result.current.isFirst).toBe(true);
        expect(result.current.isLast).toBe(true);
      });
    });

    it('should set error message on API failure', async () => {
      mockGetServiceCategories.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useServiceCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });
  });

  describe('search', () => {
    it('should update search state', async () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSearch('laser');
      });

      expect(result.current.search).toBe('laser');
    });

    it('should reset page to 0 when search changes', async () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }), {
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

  describe('pagination', () => {
    it('should update page state', async () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.page).toBe(2);
    });
  });

  describe('vendor offerings', () => {
    it('should call getCurrentOfferingsForCategory with categoryId', async () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadOfferings(1);
      });

      expect(mockGetCurrentOfferingsForCategory).toHaveBeenCalledWith(1);
    });

    it('should return offerings from service', async () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      let offerings: VendorOffering[] = [];
      await act(async () => {
        offerings = await result.current.loadOfferings(1);
      });

      expect(offerings).toEqual(mockOfferings);
    });
  });

  describe('refresh', () => {
    it('should reload categories when refresh is called', async () => {
      const { result } = renderHook(() => useServiceCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockGetServiceCategories).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockGetServiceCategories).toHaveBeenCalledTimes(2);
    });
  });

  describe('function stability', () => {
    it('should return stable function references', async () => {
      const { result, rerender } = renderHook(() => useServiceCategories({ autoLoad: false }), {
        wrapper: createWrapper(),
      });

      const firstSetPage = result.current.setPage;
      const firstSetSearch = result.current.setSearch;
      const firstClearError = result.current.clearError;

      rerender();

      expect(result.current.setPage).toBe(firstSetPage);
      expect(result.current.setSearch).toBe(firstSetSearch);
      expect(result.current.clearError).toBe(firstClearError);
    });
  });
});
