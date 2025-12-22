/**
 * Unit tests for productService.
 * Tests product search operations with mock data.
 *
 * NOTE: This tests the mock implementation.
 * When backend is available, update tests to mock httpClient.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { productService } from './productService';

describe('productService (mock implementation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchProducts', () => {
    it('should return paginated products', async () => {
      // When: Search products with default params
      const result = await productService.searchProducts({ page: 0, size: 10 });

      // Then: Returns paginated data
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.length).toBeLessThanOrEqual(10);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(0);
      expect(result.pagination.size).toBe(10);
    });

    it('should filter products by search query matching name', async () => {
      // When: Search for "Aluminum"
      const result = await productService.searchProducts({ query: 'Aluminum' });

      // Then: Returns matching products
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every(p => p.name.toLowerCase().includes('aluminum'))).toBe(true);
    });

    it('should filter products by search query matching SKU', async () => {
      // When: Search for "CNC"
      const result = await productService.searchProducts({ query: 'CNC' });

      // Then: Returns matching products (matches both name and SKU)
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.some(p => p.sku.includes('CNC'))).toBe(true);
    });

    it('should be case-insensitive for search', async () => {
      // When: Search with different cases
      const upper = await productService.searchProducts({ query: 'STEEL' });
      const lower = await productService.searchProducts({ query: 'steel' });

      // Then: Both return same results
      expect(upper.data.length).toBe(lower.data.length);
    });

    it('should filter by type ID', async () => {
      // When: Search by type ID 1 (CNC Parts)
      const result = await productService.searchProducts({ typeId: 1 });

      // Then: All products are CNC Parts
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every(p => p.productTypeName === 'CNC Parts')).toBe(true);
    });

    it('should filter by type ID 2 (Sheet Metal)', async () => {
      // When: Search by type ID 2 (Sheet Metal)
      const result = await productService.searchProducts({ typeId: 2 });

      // Then: All products are Sheet Metal
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every(p => p.productTypeName === 'Sheet Metal')).toBe(true);
    });

    it('should handle empty results', async () => {
      // When: Search for non-existent product
      const result = await productService.searchProducts({ query: 'xyz-nonexistent-product' });

      // Then: Returns empty array with pagination
      expect(result.data).toEqual([]);
      expect(result.pagination.totalElements).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      // Given: Get total count
      const all = await productService.searchProducts({ page: 0, size: 100 });
      const total = all.data.length;

      // When: Paginate with small page size
      const page0 = await productService.searchProducts({ page: 0, size: 3 });
      const page1 = await productService.searchProducts({ page: 1, size: 3 });

      // Then: Pagination is correct
      expect(page0.data.length).toBe(3);
      expect(page0.pagination.first).toBe(true);
      expect(page0.pagination.last).toBe(false);

      expect(page1.data.length).toBe(3);
      expect(page1.pagination.first).toBe(false);
      expect(page1.pagination.page).toBe(1);

      expect(page0.pagination.totalElements).toBe(total);
    });

    it('should apply default page and size', async () => {
      // When: Search without pagination params
      const result = await productService.searchProducts();

      // Then: Uses defaults
      expect(result.pagination.page).toBe(0);
      expect(result.pagination.size).toBe(20);
    });

    it('should only return active products', async () => {
      // When: Search all products
      const result = await productService.searchProducts();

      // Then: All returned products are active
      expect(result.data.every(p => p.isActive)).toBe(true);
    });

    it('should return products with all required fields', async () => {
      // When: Search products
      const result = await productService.searchProducts();

      // Then: Each product has required fields
      result.data.forEach(product => {
        expect(product.id).toBeDefined();
        expect(product.sku).toBeDefined();
        expect(product.name).toBeDefined();
        expect(typeof product.isActive).toBe('boolean');
      });
    });
  });

  describe('getProduct', () => {
    it('should return product by ID', async () => {
      // When: Get product by ID
      const result = await productService.getProduct(1);

      // Then: Returns the product
      expect(result.id).toBe(1);
      expect(result.name).toBeDefined();
      expect(result.sku).toBeDefined();
    });

    it('should throw error for non-existent product', async () => {
      // When/Then: Getting non-existent product throws
      await expect(productService.getProduct(9999)).rejects.toThrow(
        'Product not found with ID: 9999'
      );
    });

    it('should return product with all fields', async () => {
      // When: Get product
      const result = await productService.getProduct(1);

      // Then: Has all fields
      expect(result.id).toBe(1);
      expect(result.sku).toBe('CNC-AL-001');
      expect(result.name).toBe('Aluminum CNC Bracket');
      expect(result.productTypeName).toBe('CNC Parts');
      expect(result.baseUnitPrice).toBe(45000);
      expect(result.unit).toBe('EA');
      expect(result.isActive).toBe(true);
    });
  });
});
