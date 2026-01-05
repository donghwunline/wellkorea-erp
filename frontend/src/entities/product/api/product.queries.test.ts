/**
 * Product Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { productQueries, type ProductListQueryParams } from './product.queries';
import { expectValidQueryOptions, expectQueryKey } from '@/test/entity-test-utils';

// Mock dependencies
vi.mock('./get-product', () => ({
  getProduct: vi.fn(),
  getProducts: vi.fn(),
  getProductTypes: vi.fn(),
}));

vi.mock('./product.mapper', () => ({
  productMapper: {
    toDomain: vi.fn((response) => ({ ...response, _mapped: true })),
    toListItem: vi.fn((response) => ({ id: response.id, name: response.name })),
  },
  productTypeMapper: {
    toDomain: vi.fn((response) => ({ ...response, _typeMapped: true })),
  },
}));

// Import mocked modules
import { getProduct, getProducts, getProductTypes } from './get-product';
import { productMapper, productTypeMapper } from './product.mapper';

describe('productQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(productQueries.all(), ['products']);
      });
    });

    describe('lists()', () => {
      it('should return list query key with "list" segment', () => {
        expectQueryKey(productQueries.lists(), ['products', 'list']);
      });
    });

    describe('details()', () => {
      it('should return detail query key segment', () => {
        expectQueryKey(productQueries.details(), ['products', 'detail']);
      });
    });

    describe('types()', () => {
      it('should return types query key segment', () => {
        expectQueryKey(productQueries.types(), ['products', 'types']);
      });
    });
  });

  // ==========================================================================
  // List Query Tests
  // ==========================================================================

  describe('list()', () => {
    const defaultParams: ProductListQueryParams = {
      page: 0,
      size: 10,
      search: '',
      productTypeId: null,
    };

    it('should return valid queryOptions', () => {
      const options = productQueries.list(defaultParams);
      expectValidQueryOptions(options);
    });

    it('should include all params in query key for cache separation', () => {
      const params: ProductListQueryParams = {
        page: 1,
        size: 20,
        search: 'widget',
        productTypeId: 5,
      };
      const options = productQueries.list(params);

      expect(options.queryKey).toEqual([
        'products',
        'list',
        1,
        20,
        'widget',
        5,
      ]);
    });

    it('should include null values in query key when filters are empty', () => {
      const options = productQueries.list(defaultParams);

      expect(options.queryKey).toEqual([
        'products',
        'list',
        0,
        10,
        '',
        null,
      ]);
    });

    it('should have placeholderData set for smooth transitions', () => {
      const options = productQueries.list(defaultParams);
      expect(options.placeholderData).toBeDefined();
    });

    it('should call getProducts with correct params in queryFn', async () => {
      const mockResponse = {
        data: [{ id: 1, name: 'Product 1' }],
        pagination: { page: 0, size: 10, totalElements: 1, totalPages: 1 },
      };
      vi.mocked(getProducts).mockResolvedValue(mockResponse);

      const options = productQueries.list(defaultParams);
      await options.queryFn();

      expect(getProducts).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        search: undefined, // empty string converted to undefined
        productTypeId: undefined, // null converted to undefined
      });
    });

    it('should map response data using productMapper.toListItem', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'Product 1' },
          { id: 2, name: 'Product 2' },
        ],
        pagination: { page: 0, size: 10, totalElements: 2, totalPages: 1 },
      };
      vi.mocked(getProducts).mockResolvedValue(mockResponse);

      const options = productQueries.list(defaultParams);
      const result = await options.queryFn();

      expect(productMapper.toListItem).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual(mockResponse.pagination);
    });
  });

  // ==========================================================================
  // Detail Query Tests
  // ==========================================================================

  describe('detail()', () => {
    it('should return valid queryOptions', () => {
      const options = productQueries.detail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = productQueries.detail(123);
      expect(options.queryKey).toEqual(['products', 'detail', 123]);
    });

    it('should have 5-minute staleTime', () => {
      const options = productQueries.detail(1);
      expect(options.staleTime).toBe(1000 * 60 * 5);
    });

    it('should call getProduct with correct id in queryFn', async () => {
      const mockResponse = { id: 123, name: 'Test Product' };
      vi.mocked(getProduct).mockResolvedValue(mockResponse);

      const options = productQueries.detail(123);
      await options.queryFn();

      expect(getProduct).toHaveBeenCalledWith(123);
    });

    it('should map response using productMapper.toDomain', async () => {
      const mockResponse = { id: 123, name: 'Test Product' };
      vi.mocked(getProduct).mockResolvedValue(mockResponse);

      const options = productQueries.detail(123);
      const result = await options.queryFn();

      expect(productMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual({ ...mockResponse, _mapped: true });
    });
  });

  // ==========================================================================
  // Types Query Tests
  // ==========================================================================

  describe('allTypes()', () => {
    it('should return valid queryOptions', () => {
      const options = productQueries.allTypes();
      expectValidQueryOptions(options);
    });

    it('should have types query key', () => {
      const options = productQueries.allTypes();
      expect(options.queryKey).toEqual(['products', 'types']);
    });

    it('should have 30-minute staleTime', () => {
      const options = productQueries.allTypes();
      expect(options.staleTime).toBe(1000 * 60 * 30);
    });

    it('should call getProductTypes in queryFn', async () => {
      const mockTypes = [
        { id: 1, name: 'Type A' },
        { id: 2, name: 'Type B' },
      ];
      vi.mocked(getProductTypes).mockResolvedValue(mockTypes);

      const options = productQueries.allTypes();
      const result = await options.queryFn();

      expect(getProductTypes).toHaveBeenCalled();
      expect(productTypeMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Search Query Tests
  // ==========================================================================

  describe('search()', () => {
    it('should return valid queryOptions', () => {
      const options = productQueries.search('widget');
      expectValidQueryOptions(options);
    });

    it('should include query and limit in query key', () => {
      const options = productQueries.search('widget', 30);
      expect(options.queryKey).toEqual(['products', 'search', 'widget', 30]);
    });

    it('should use default limit of 20', () => {
      const options = productQueries.search('widget');
      expect(options.queryKey).toEqual(['products', 'search', 'widget', 20]);
    });

    it('should have 2-minute staleTime', () => {
      const options = productQueries.search('widget');
      expect(options.staleTime).toBe(1000 * 60 * 2);
    });

    it('should be enabled when query length > 0', () => {
      const options = productQueries.search('widget');
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when query is empty', () => {
      const options = productQueries.search('');
      expect(options.enabled).toBe(false);
    });

    it('should call getProducts with search params', async () => {
      const mockResponse = {
        data: [{ id: 1, name: 'Widget' }],
        pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
      };
      vi.mocked(getProducts).mockResolvedValue(mockResponse);

      const options = productQueries.search('widget', 15);
      await options.queryFn();

      expect(getProducts).toHaveBeenCalledWith({
        search: 'widget',
        page: 0,
        size: 15,
      });
    });
  });
});
