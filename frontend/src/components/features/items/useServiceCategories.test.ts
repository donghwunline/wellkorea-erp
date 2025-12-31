/**
 * Unit tests for useServiceCategories hook.
 * Tests service category listing with pagination, search, and vendor offerings.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useServiceCategories } from './useServiceCategories';
import { serviceCategoryService } from '@/services';
import type {
  PaginatedServiceCategories,
  ServiceCategorySummary,
  VendorServiceOffering,
} from '@/services';

// Mock the service category service
vi.mock('@/services', () => ({
  serviceCategoryService: {
    getServiceCategories: vi.fn(),
    getCurrentOfferingsForCategory: vi.fn(),
  },
}));

// Mock @/shared/api
vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api');
  return {
    ...actual,
    getErrorMessage: vi.fn((error: unknown) => {
      if (error && typeof error === 'object' && 'message' in error) {
        return (error as { message: string }).message;
      }
      return 'An error occurred';
    }),
  };
});

describe('useServiceCategories', () => {
  const mockGetServiceCategories = serviceCategoryService.getServiceCategories as Mock;
  const mockGetCurrentOfferingsForCategory =
    serviceCategoryService.getCurrentOfferingsForCategory as Mock;

  const mockCategories: ServiceCategorySummary[] = [
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

  const mockPaginatedResponse: PaginatedServiceCategories = {
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

  const mockOfferings: VendorServiceOffering[] = [
    {
      id: 1,
      serviceCategoryId: 1,
      serviceCategoryName: 'Laser Cutting',
      vendorId: 10,
      vendorName: 'Vendor A',
      unitPrice: 5000,
      currency: 'KRW',
      leadTimeDays: 3,
      isPreferred: false,
      notes: 'Quality service',
      effectiveFrom: '2024-01-01',
      effectiveTo: '2024-12-31',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServiceCategories.mockResolvedValue(mockPaginatedResponse);
    mockGetCurrentOfferingsForCategory.mockResolvedValue(mockOfferings);
  });

  describe('initial state', () => {
    it('should start with empty categories array', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }));

      expect(result.current.categories).toEqual([]);
    });

    it('should start with page 0', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }));

      expect(result.current.page).toBe(0);
    });

    it('should start with loading false', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }));

      expect(result.current.loading).toBe(false);
    });

    it('should start with error null', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }));

      expect(result.current.error).toBeNull();
    });

    it('should start with empty search', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }));

      expect(result.current.search).toBe('');
    });

    it('should return all action functions', () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }));

      expect(typeof result.current.setPage).toBe('function');
      expect(typeof result.current.setSearch).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.loadOfferings).toBe('function');
    });
  });

  describe('auto-load behavior', () => {
    it('should load categories on mount when autoLoad is true (default)', async () => {
      renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(mockGetServiceCategories).toHaveBeenCalledTimes(1);
      });
    });

    it('should NOT load categories when autoLoad is false', async () => {
      renderHook(() => useServiceCategories({ autoLoad: false }));

      // Give it time to potentially load
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockGetServiceCategories).not.toHaveBeenCalled();
    });
  });

  describe('loading categories', () => {
    it('should set loading true during fetch', async () => {
      let resolvePromise: (value: PaginatedServiceCategories) => void;
      mockGetServiceCategories.mockImplementation(
        () =>
          new Promise<PaginatedServiceCategories>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useServiceCategories());

      // Loading should be true during fetch
      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise(mockPaginatedResponse);
      });

      expect(result.current.loading).toBe(false);
    });

    it('should populate categories on success', async () => {
      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(result.current.categories).toEqual(mockCategories);
      });
    });

    it('should set pagination state on success', async () => {
      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(result.current.totalElements).toBe(2);
        expect(result.current.isFirst).toBe(true);
        expect(result.current.isLast).toBe(true);
      });
    });

    it('should set error message on API failure', async () => {
      mockGetServiceCategories.mockRejectedValue({ message: 'Network error' });

      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should set loading false on error', async () => {
      mockGetServiceCategories.mockRejectedValue({ message: 'Network error' });

      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('search', () => {
    it('should update search state', async () => {
      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearch('laser');
      });

      expect(result.current.search).toBe('laser');
    });

    it('should reset page to 0 when search changes', async () => {
      const { result } = renderHook(() => useServiceCategories());

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
      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(mockGetServiceCategories).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.setSearch('laser');
      });

      await waitFor(() => {
        expect(mockGetServiceCategories).toHaveBeenCalledTimes(2);
      });
    });

    it('should pass search in API request params', async () => {
      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearch('laser');
      });

      await waitFor(() => {
        expect(mockGetServiceCategories).toHaveBeenLastCalledWith(
          expect.objectContaining({
            search: 'laser',
          })
        );
      });
    });
  });

  describe('pagination', () => {
    it('should update page state', async () => {
      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.page).toBe(2);
    });

    it('should trigger reload when page changes', async () => {
      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(mockGetServiceCategories).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.setPage(1);
      });

      await waitFor(() => {
        expect(mockGetServiceCategories).toHaveBeenCalledTimes(2);
      });
    });

    it('should pass page in API request params', async () => {
      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(mockGetServiceCategories).toHaveBeenLastCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    });

    it('should use pageSize from options', async () => {
      renderHook(() => useServiceCategories({ pageSize: 10 }));

      await waitFor(() => {
        expect(mockGetServiceCategories).toHaveBeenCalledWith(
          expect.objectContaining({
            size: 10,
          })
        );
      });
    });

    it('should use default pageSize of 20', async () => {
      renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(mockGetServiceCategories).toHaveBeenCalledWith(
          expect.objectContaining({
            size: 20,
          })
        );
      });
    });
  });

  describe('vendor offerings', () => {
    it('should call getCurrentOfferingsForCategory with categoryId', async () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }));

      await act(async () => {
        await result.current.loadOfferings(1);
      });

      expect(mockGetCurrentOfferingsForCategory).toHaveBeenCalledWith(1);
    });

    it('should return offerings from service', async () => {
      const { result } = renderHook(() => useServiceCategories({ autoLoad: false }));

      let offerings: VendorServiceOffering[] = [];
      await act(async () => {
        offerings = await result.current.loadOfferings(1);
      });

      expect(offerings).toEqual(mockOfferings);
    });
  });

  describe('error handling', () => {
    it('should clear error state with clearError', async () => {
      mockGetServiceCategories.mockRejectedValueOnce({ message: 'Test error' });

      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear error before new request', async () => {
      mockGetServiceCategories.mockRejectedValueOnce({ message: 'First error' });

      const { result } = renderHook(() => useServiceCategories());

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      mockGetServiceCategories.mockResolvedValueOnce(mockPaginatedResponse);

      act(() => {
        result.current.setPage(1);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('refresh', () => {
    it('should reload categories when refresh is called', async () => {
      const { result } = renderHook(() => useServiceCategories());

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
      const { result, rerender } = renderHook(() =>
        useServiceCategories({ autoLoad: false })
      );

      const firstSetPage = result.current.setPage;
      const firstSetSearch = result.current.setSearch;
      const firstClearError = result.current.clearError;
      const firstLoadOfferings = result.current.loadOfferings;

      rerender();

      expect(result.current.setPage).toBe(firstSetPage);
      expect(result.current.setSearch).toBe(firstSetSearch);
      expect(result.current.clearError).toBe(firstClearError);
      expect(result.current.loadOfferings).toBe(firstLoadOfferings);
    });
  });
});
