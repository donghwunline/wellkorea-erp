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
import { expectValidQueryOptions, expectQueryKey } from '@/test/entity-test-utils';

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
      };
      const options = catalogQueries.categoryList(params);

      expect(options.queryKey).toEqual([
        'catalog',
        'categories',
        'list',
        1,
        50,
        'laser',
      ]);
    });

    it('should include default values in query key when params are empty', () => {
      const options = catalogQueries.categoryList({});

      expect(options.queryKey).toEqual(['catalog', 'categories', 'list', 0, 20, '']);
    });

    it('should have placeholderData set for smooth transitions', () => {
      const options = catalogQueries.categoryList(defaultParams);
      expect(options.placeholderData).toBeDefined();
    });

    it('should call getServiceCategories with correct params in queryFn', async () => {
      const mockResponse = {
        data: [{ id: 1, name: 'Category 1' }],
        pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
      };
      vi.mocked(getServiceCategories).mockResolvedValue(mockResponse);

      const params: ServiceCategoryListQueryParams = {
        page: 0,
        size: 20,
        search: 'test',
      };
      const options = catalogQueries.categoryList(params);
      const result = await options.queryFn();

      expect(getServiceCategories).toHaveBeenCalledWith({
        page: 0,
        size: 20,
        search: 'test',
      });
      expect(result).toEqual(mockResponse);
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
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' },
      ];
      vi.mocked(getAllServiceCategories).mockResolvedValue(mockCategories);

      const options = catalogQueries.allCategories();
      const result = await options.queryFn();

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
      const mockResponse = { id: 123, name: 'Test Category' };
      vi.mocked(getServiceCategory).mockResolvedValue(mockResponse);

      const options = catalogQueries.categoryDetail(123);
      await options.queryFn();

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
      const mockResponse = {
        data: [{ id: 1, vendorName: 'Vendor 1' }],
        pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
      };
      vi.mocked(getOfferingsForCategory).mockResolvedValue(mockResponse);

      const options = catalogQueries.offeringList(123, { page: 1, size: 30 });
      await options.queryFn();

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
        { id: 1, vendorName: 'Vendor 1' },
        { id: 2, vendorName: 'Vendor 2' },
      ];
      vi.mocked(getCurrentOfferingsForCategory).mockResolvedValue(mockOfferings);

      const options = catalogQueries.currentOfferings(123);
      const result = await options.queryFn();

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
      const mockResponse = { id: 123, vendorName: 'Test Vendor' };
      vi.mocked(getVendorOffering).mockResolvedValue(mockResponse);

      const options = catalogQueries.offeringDetail(123);
      await options.queryFn();

      expect(getVendorOffering).toHaveBeenCalledWith(123);
    });
  });
});
