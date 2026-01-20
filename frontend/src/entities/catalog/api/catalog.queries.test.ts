/**
 * Catalog Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  catalogQueries,
  type ServiceCategoryListQueryParams,
  type VendorOfferingListQueryParams,
} from './catalog.queries';
import { expectValidQueryOptions, expectQueryKey, invokeQueryFn } from '@/test/entity-test-utils';
import type { Paginated } from '@/shared/lib/pagination';
import type { ServiceCategory, ServiceCategoryListItem } from '../model/service-category';
import type { VendorOffering } from '../model/vendor-offering';

// Mock dependencies
vi.mock('./get-catalog', () => ({
  getServiceCategories: vi.fn(),
  getAllServiceCategories: vi.fn(),
  getServiceCategory: vi.fn(),
  getOfferingsForCategory: vi.fn(),
  getCurrentOfferingsForCategory: vi.fn(),
  getVendorOffering: vi.fn(),
}));

// Import mocked modules
import {
  getServiceCategories,
  getAllServiceCategories,
  getServiceCategory,
  getOfferingsForCategory,
  getCurrentOfferingsForCategory,
  getVendorOffering,
} from './get-catalog';

// =============================================================================
// Test Fixtures - Domain types (mapping happens inside get-catalog.ts)
// =============================================================================

function createMockServiceCategoryListItem(
  overrides: Partial<ServiceCategoryListItem> = {}
): ServiceCategoryListItem {
  return {
    id: 1,
    name: '',
    description: null,
    isActive: true,
    vendorCount: 0,
    ...overrides,
  };
}

function createMockServiceCategory(
  overrides: Partial<ServiceCategory> = {}
): ServiceCategory {
  return {
    id: 1,
    name: '',
    description: null,
    isActive: true,
    vendorCount: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function createMockVendorOffering(
  overrides: Partial<VendorOffering> = {}
): VendorOffering {
  return {
    id: 1,
    vendorId: 1,
    vendorName: '',
    serviceCategoryId: 1,
    serviceCategoryName: '',
    vendorServiceCode: null,
    vendorServiceName: null,
    unitPrice: null,
    currency: 'KRW',
    leadTimeDays: null,
    minOrderQuantity: null,
    effectiveFrom: null,
    effectiveTo: null,
    isPreferred: false,
    notes: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function createMockPaginatedCategories(
  data: ServiceCategoryListItem[]
): Paginated<ServiceCategoryListItem> {
  return {
    data,
    pagination: { page: 0, size: 20, totalElements: data.length, totalPages: 1, first: true, last: true },
  };
}

function createMockPaginatedOfferings(
  data: VendorOffering[]
): Paginated<VendorOffering> {
  return {
    data,
    pagination: { page: 0, size: 20, totalElements: data.length, totalPages: 1, first: true, last: true },
  };
}

describe('catalogQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(catalogQueries.all(), ['catalog']);
      });
    });

    describe('categories()', () => {
      it('should return categories query key segment', () => {
        expectQueryKey(catalogQueries.categories(), ['catalog', 'categories']);
      });
    });

    describe('categoryLists()', () => {
      it('should return category list query key', () => {
        expectQueryKey(catalogQueries.categoryLists(), ['catalog', 'categories', 'list']);
      });
    });

    describe('categoryDetails()', () => {
      it('should return category detail query key', () => {
        expectQueryKey(catalogQueries.categoryDetails(), ['catalog', 'categories', 'detail']);
      });
    });

    describe('offerings()', () => {
      it('should return offerings query key segment', () => {
        expectQueryKey(catalogQueries.offerings(), ['catalog', 'offerings']);
      });
    });

    describe('offeringsByCategory()', () => {
      it('should include category id in query key', () => {
        const key = catalogQueries.offeringsByCategory(123);
        expect(key).toEqual(['catalog', 'offerings', 'byCategory', 123]);
      });
    });
  });

  // ==========================================================================
  // Category List Query Tests
  // ==========================================================================

  describe('categoryList()', () => {
    const defaultParams: ServiceCategoryListQueryParams = {};

    it('should return valid queryOptions', () => {
      const options = catalogQueries.categoryList(defaultParams);
      expectValidQueryOptions(options);
    });

    it('should include all params in query key for cache separation', () => {
      const params: ServiceCategoryListQueryParams = {
        page: 1,
        size: 50,
        search: 'laser',
        isActive: true,
      };
      const options = catalogQueries.categoryList(params);

      expect(options.queryKey).toEqual([
        'catalog',
        'categories',
        'list',
        1,
        50,
        'laser',
        true,
      ]);
    });

    it('should include default values in query key when params are empty', () => {
      const options = catalogQueries.categoryList({});

      expect(options.queryKey).toEqual(['catalog', 'categories', 'list', 0, 20, '', undefined]);
    });

    it('should include isActive=false in query key', () => {
      const params: ServiceCategoryListQueryParams = {
        isActive: false,
      };
      const options = catalogQueries.categoryList(params);

      expect(options.queryKey).toEqual(['catalog', 'categories', 'list', 0, 20, '', false]);
    });

    it('should have placeholderData set for smooth transitions', () => {
      const options = catalogQueries.categoryList(defaultParams);
      expect(options.placeholderData).toBeDefined();
    });

    it('should call getServiceCategories with correct params in queryFn', async () => {
      const mockResponse = createMockPaginatedCategories([
        createMockServiceCategoryListItem({ id: 1, name: 'Category 1' }),
      ]);
      vi.mocked(getServiceCategories).mockResolvedValue(mockResponse);

      const params: ServiceCategoryListQueryParams = {
        page: 0,
        size: 20,
        search: 'test',
        isActive: true,
      };
      const options = catalogQueries.categoryList(params);
      const result = await invokeQueryFn(options);

      expect(getServiceCategories).toHaveBeenCalledWith({
        page: 0,
        size: 20,
        search: 'test',
        isActive: true,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should pass isActive undefined when not specified', async () => {
      const mockResponse = createMockPaginatedCategories([]);
      vi.mocked(getServiceCategories).mockResolvedValue(mockResponse);

      const options = catalogQueries.categoryList({});
      await invokeQueryFn(options);

      expect(getServiceCategories).toHaveBeenCalledWith({
        page: 0,
        size: 20,
        search: undefined,
        isActive: undefined,
      });
    });
  });

  // ==========================================================================
  // All Categories Query Tests
  // ==========================================================================

  describe('allCategories()', () => {
    it('should return valid queryOptions', () => {
      const options = catalogQueries.allCategories();
      expectValidQueryOptions(options);
    });

    it('should have correct query key', () => {
      const options = catalogQueries.allCategories();
      expect(options.queryKey).toEqual(['catalog', 'categories', 'all']);
    });

    it('should have 5-minute staleTime', () => {
      const options = catalogQueries.allCategories();
      expect(options.staleTime).toBe(5 * 60 * 1000);
    });

    it('should call getAllServiceCategories in queryFn', async () => {
      const mockCategories = [
        createMockServiceCategoryListItem({ id: 1, name: 'Category 1' }),
        createMockServiceCategoryListItem({ id: 2, name: 'Category 2' }),
      ];
      vi.mocked(getAllServiceCategories).mockResolvedValue(mockCategories);

      const options = catalogQueries.allCategories();
      const result = await invokeQueryFn(options);

      expect(getAllServiceCategories).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });
  });

  // ==========================================================================
  // Category Detail Query Tests
  // ==========================================================================

  describe('categoryDetail()', () => {
    it('should return valid queryOptions', () => {
      const options = catalogQueries.categoryDetail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = catalogQueries.categoryDetail(123);
      expect(options.queryKey).toEqual(['catalog', 'categories', 'detail', 123]);
    });

    it('should be enabled when id > 0', () => {
      const options = catalogQueries.categoryDetail(123);
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when id is 0', () => {
      const options = catalogQueries.categoryDetail(0);
      expect(options.enabled).toBe(false);
    });

    it('should be disabled when id is negative', () => {
      const options = catalogQueries.categoryDetail(-1);
      expect(options.enabled).toBe(false);
    });

    it('should call getServiceCategory with correct id in queryFn', async () => {
      const mockResponse = createMockServiceCategory({ id: 123, name: 'Test Category' });
      vi.mocked(getServiceCategory).mockResolvedValue(mockResponse);

      const options = catalogQueries.categoryDetail(123);
      await invokeQueryFn(options);

      expect(getServiceCategory).toHaveBeenCalledWith(123);
    });
  });

  // ==========================================================================
  // Offering List Query Tests
  // ==========================================================================

  describe('offeringList()', () => {
    const defaultParams: VendorOfferingListQueryParams = {};

    it('should return valid queryOptions', () => {
      const options = catalogQueries.offeringList(123, defaultParams);
      expectValidQueryOptions(options);
    });

    it('should include category id and params in query key', () => {
      const params: VendorOfferingListQueryParams = {
        page: 1,
        size: 30,
      };
      const options = catalogQueries.offeringList(123, params);

      expect(options.queryKey).toEqual([
        'catalog',
        'offerings',
        'byCategory',
        123,
        'list',
        1,
        30,
      ]);
    });

    it('should have placeholderData set', () => {
      const options = catalogQueries.offeringList(123, defaultParams);
      expect(options.placeholderData).toBeDefined();
    });

    it('should be enabled when categoryId > 0', () => {
      const options = catalogQueries.offeringList(123, defaultParams);
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when categoryId is 0', () => {
      const options = catalogQueries.offeringList(0, defaultParams);
      expect(options.enabled).toBe(false);
    });

    it('should call getOfferingsForCategory with correct params', async () => {
      const mockResponse = createMockPaginatedOfferings([
        createMockVendorOffering({ id: 1, vendorName: 'Vendor 1' }),
      ]);
      vi.mocked(getOfferingsForCategory).mockResolvedValue(mockResponse);

      const options = catalogQueries.offeringList(123, { page: 1, size: 30 });
      await invokeQueryFn(options);

      expect(getOfferingsForCategory).toHaveBeenCalledWith(123, { page: 1, size: 30 });
    });
  });

  // ==========================================================================
  // Current Offerings Query Tests
  // ==========================================================================

  describe('currentOfferings()', () => {
    it('should return valid queryOptions', () => {
      const options = catalogQueries.currentOfferings(123);
      expectValidQueryOptions(options);
    });

    it('should include category id in query key', () => {
      const options = catalogQueries.currentOfferings(123);
      expect(options.queryKey).toEqual([
        'catalog',
        'offerings',
        'byCategory',
        123,
        'current',
      ]);
    });

    it('should be enabled when categoryId > 0', () => {
      const options = catalogQueries.currentOfferings(123);
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when categoryId is 0', () => {
      const options = catalogQueries.currentOfferings(0);
      expect(options.enabled).toBe(false);
    });

    it('should call getCurrentOfferingsForCategory in queryFn', async () => {
      const mockOfferings = [
        createMockVendorOffering({ id: 1, vendorName: 'Vendor 1' }),
        createMockVendorOffering({ id: 2, vendorName: 'Vendor 2' }),
      ];
      vi.mocked(getCurrentOfferingsForCategory).mockResolvedValue(mockOfferings);

      const options = catalogQueries.currentOfferings(123);
      const result = await invokeQueryFn(options);

      expect(getCurrentOfferingsForCategory).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockOfferings);
    });
  });

  // ==========================================================================
  // Offering Detail Query Tests
  // ==========================================================================

  describe('offeringDetail()', () => {
    it('should return valid queryOptions', () => {
      const options = catalogQueries.offeringDetail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = catalogQueries.offeringDetail(123);
      expect(options.queryKey).toEqual(['catalog', 'offerings', 'detail', 123]);
    });

    it('should be enabled when id > 0', () => {
      const options = catalogQueries.offeringDetail(123);
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when id is 0', () => {
      const options = catalogQueries.offeringDetail(0);
      expect(options.enabled).toBe(false);
    });

    it('should call getVendorOffering with correct id in queryFn', async () => {
      const mockResponse = createMockVendorOffering({ id: 123, vendorName: 'Test Vendor' });
      vi.mocked(getVendorOffering).mockResolvedValue(mockResponse);

      const options = catalogQueries.offeringDetail(123);
      await invokeQueryFn(options);

      expect(getVendorOffering).toHaveBeenCalledWith(123);
    });
  });
});
