/**
 * Unit tests for productService.
 * Tests product search operations, data transformation, and error propagation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { productService } from './productService';
import {
  createMockProduct,
  createMockPagedResponse,
  mockApiErrors,
} from '@/test/fixtures';
import { httpClient } from '@/api';

// Mock httpClient with inline factory (vi.mock is hoisted)
vi.mock('@/api', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    requestWithMeta: vi.fn(),
  },
  PRODUCT_ENDPOINTS: {
    BASE: '/products',
    byId: (id: number) => `/products/${id}`,
    search: '/products/search',
  },
}));

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchProducts', () => {
    it('should fetch paginated products and transform data', async () => {
      // Given: Mock paginated response
      const mockProduct = createMockProduct();
      const mockResponse = createMockPagedResponse([mockProduct]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Search products
      const result = await productService.searchProducts({ page: 0, size: 10 });

      // Then: Calls httpClient with correct params
      expect(httpClient.requestWithMeta).toHaveBeenCalledOnce();
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/products',
        params: { page: 0, size: 10 },
      });

      // And: Returns paginated data
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockProduct);
      expect(result.pagination.totalElements).toBe(1);
    });

    it('should trim whitespace from text fields', async () => {
      // Given: Response with whitespace
      const mockProduct = createMockProduct({
        name: '  Test Product  ',
        sku: '  SKU-001  ',
        description: '  Description  ',
        productTypeName: '  Electronics  ',
        unit: '  EA  ',
      });
      const mockResponse = createMockPagedResponse([mockProduct]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Search products
      const result = await productService.searchProducts();

      // Then: Text fields are trimmed
      expect(result.data[0].name).toBe('Test Product');
      expect(result.data[0].sku).toBe('SKU-001');
      expect(result.data[0].description).toBe('Description');
      expect(result.data[0].productTypeName).toBe('Electronics');
      expect(result.data[0].unit).toBe('EA');
    });

    it('should handle search query param', async () => {
      // Given: Search with query
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Search with query
      await productService.searchProducts({
        query: 'laptop',
        page: 0,
        size: 20,
      });

      // Then: Passes query param
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/products',
        params: {
          query: 'laptop',
          page: 0,
          size: 20,
        },
      });
    });

    it('should handle type filter param', async () => {
      // Given: Search with type filter
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Search with type filter
      await productService.searchProducts({
        typeId: 5,
      });

      // Then: Passes typeId param
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/products',
        params: {
          typeId: 5,
        },
      });
    });

    it('should handle empty results', async () => {
      // Given: Empty response
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Search products
      const result = await productService.searchProducts();

      // Then: Returns empty array
      expect(result.data).toEqual([]);
      expect(result.pagination.totalElements).toBe(0);
    });

    it('should handle null optional fields', async () => {
      // Given: Product with null fields
      const mockProduct = createMockProduct({
        description: null,
        productTypeName: null,
        baseUnitPrice: null,
        unit: null,
      });
      const mockResponse = createMockPagedResponse([mockProduct]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Search products
      const result = await productService.searchProducts();

      // Then: Null fields remain null
      expect(result.data[0].description).toBeNull();
      expect(result.data[0].productTypeName).toBeNull();
      expect(result.data[0].baseUnitPrice).toBeNull();
      expect(result.data[0].unit).toBeNull();
    });

    it('should propagate API errors', async () => {
      // Given: API error
      vi.mocked(httpClient.requestWithMeta).mockRejectedValue(mockApiErrors.serverError);

      // When/Then: Propagates error
      await expect(productService.searchProducts()).rejects.toEqual(mockApiErrors.serverError);
    });
  });

  describe('getProduct', () => {
    it('should fetch single product by ID and transform', async () => {
      // Given: Mock product response
      const mockProduct = createMockProduct({ id: 123 });
      vi.mocked(httpClient.get).mockResolvedValue(mockProduct);

      // When: Get product by ID
      const result = await productService.getProduct(123);

      // Then: Calls httpClient with correct URL
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/products/123');

      // And: Returns transformed product
      expect(result.id).toBe(123);
    });

    it('should trim whitespace from text fields', async () => {
      // Given: Product with whitespace
      const mockProduct = createMockProduct({
        name: '  Product  ',
        sku: '  SKU  ',
        description: '  Desc  ',
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockProduct);

      // When: Get product
      const result = await productService.getProduct(1);

      // Then: Data is trimmed
      expect(result.name).toBe('Product');
      expect(result.sku).toBe('SKU');
      expect(result.description).toBe('Desc');
    });

    it('should handle null optional fields', async () => {
      // Given: Product with null fields
      const mockProduct = createMockProduct({
        description: null,
        productTypeName: null,
        baseUnitPrice: null,
        unit: null,
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockProduct);

      // When: Get product
      const result = await productService.getProduct(1);

      // Then: Null fields remain null
      expect(result.description).toBeNull();
      expect(result.productTypeName).toBeNull();
      expect(result.baseUnitPrice).toBeNull();
      expect(result.unit).toBeNull();
    });

    it('should propagate 404 errors', async () => {
      // Given: Product not found
      vi.mocked(httpClient.get).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(productService.getProduct(999)).rejects.toEqual(mockApiErrors.notFound);
    });
  });
});
