/**
 * Product Mapper Tests.
 *
 * Tests for DTO → Domain model transformations.
 */

import { describe, expect, it } from 'vitest';
import {
  productMapper,
  productTypeMapper,
  type ProductDetailResponse,
  type ProductSummaryResponse,
  type ProductTypeResponse,
} from './product.mapper';
import { expectDomainShape } from '@/test/entity-test-utils';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockProductDetailResponse(
  overrides?: Partial<ProductDetailResponse>
): ProductDetailResponse {
  return {
    id: 1,
    sku: 'PRD-001',
    name: 'Test Product',
    description: 'A test product description',
    productTypeId: 10,
    productTypeName: 'Electronics',
    baseUnitPrice: 10000,
    unit: 'EA',
    isActive: true,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-16T00:00:00Z',
    ...overrides,
  };
}

function createMockProductSummaryResponse(
  overrides?: Partial<ProductSummaryResponse>
): ProductSummaryResponse {
  return {
    id: 1,
    sku: 'PRD-001',
    name: 'Test Product',
    description: 'A test product description',
    productTypeId: 10,
    productTypeName: 'Electronics',
    baseUnitPrice: 10000,
    unit: 'EA',
    isActive: true,
    ...overrides,
  };
}

function createMockProductTypeResponse(
  overrides?: Partial<ProductTypeResponse>
): ProductTypeResponse {
  return {
    id: 1,
    name: 'Electronics',
    description: 'Electronic components',
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('productMapper', () => {
  // ==========================================================================
  // toDomain Tests
  // ==========================================================================

  describe('toDomain()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockProductDetailResponse();
      const result = productMapper.toDomain(response);

      expectDomainShape(result, [
        'id',
        'sku',
        'name',
        'description',
        'productTypeId',
        'productTypeName',
        'baseUnitPrice',
        'unit',
        'isActive',
        'createdAt',
        'updatedAt',
      ]);
    });

    it('should preserve field values correctly', () => {
      const response = createMockProductDetailResponse();
      const result = productMapper.toDomain(response);

      expect(result.id).toBe(1);
      expect(result.sku).toBe('PRD-001');
      expect(result.name).toBe('Test Product');
      expect(result.productTypeId).toBe(10);
      expect(result.baseUnitPrice).toBe(10000);
      expect(result.unit).toBe('EA');
      expect(result.isActive).toBe(true);
    });

    it('should handle null description', () => {
      const response = createMockProductDetailResponse({ description: null });
      const result = productMapper.toDomain(response);

      expect(result.description).toBeNull();
    });

    it('should handle undefined description', () => {
      const response = createMockProductDetailResponse({ description: undefined });
      const result = productMapper.toDomain(response);

      expect(result.description).toBeNull();
    });

    it('should handle null baseUnitPrice', () => {
      const response = createMockProductDetailResponse({ baseUnitPrice: null });
      const result = productMapper.toDomain(response);

      expect(result.baseUnitPrice).toBeNull();
    });

    it('should handle undefined baseUnitPrice', () => {
      const response = createMockProductDetailResponse({ baseUnitPrice: undefined });
      const result = productMapper.toDomain(response);

      expect(result.baseUnitPrice).toBeNull();
    });

    it('should handle zero baseUnitPrice', () => {
      const response = createMockProductDetailResponse({ baseUnitPrice: 0 });
      const result = productMapper.toDomain(response);

      expect(result.baseUnitPrice).toBe(0);
    });

    it('should handle inactive product', () => {
      const response = createMockProductDetailResponse({ isActive: false });
      const result = productMapper.toDomain(response);

      expect(result.isActive).toBe(false);
    });

    it('should preserve date strings in ISO format', () => {
      const response = createMockProductDetailResponse({
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-16T14:00:00Z',
      });
      const result = productMapper.toDomain(response);

      expect(result.createdAt).toBe('2025-01-15T10:30:00Z');
      expect(result.updatedAt).toBe('2025-01-16T14:00:00Z');
    });
  });

  // ==========================================================================
  // toListItem Tests
  // ==========================================================================

  describe('toListItem()', () => {
    it('should map only list-relevant fields', () => {
      const response = createMockProductSummaryResponse();
      const result = productMapper.toListItem(response);

      expectDomainShape(result, [
        'id',
        'sku',
        'name',
        'description',
        'productTypeId',
        'productTypeName',
        'baseUnitPrice',
        'unit',
        'isActive',
      ]);
    });

    it('should not include createdAt in list item', () => {
      const response = createMockProductSummaryResponse();
      const result = productMapper.toListItem(response);

      expect(result).not.toHaveProperty('createdAt');
    });

    it('should not include updatedAt in list item', () => {
      const response = createMockProductSummaryResponse();
      const result = productMapper.toListItem(response);

      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should handle null description', () => {
      const response = createMockProductSummaryResponse({ description: null });
      const result = productMapper.toListItem(response);

      expect(result.description).toBeNull();
    });

    it('should handle null baseUnitPrice', () => {
      const response = createMockProductSummaryResponse({ baseUnitPrice: null });
      const result = productMapper.toListItem(response);

      expect(result.baseUnitPrice).toBeNull();
    });

    it('should preserve field values correctly', () => {
      const response = createMockProductSummaryResponse({
        id: 5,
        sku: 'SKU-005',
        name: 'Widget Pro',
      });
      const result = productMapper.toListItem(response);

      expect(result.id).toBe(5);
      expect(result.sku).toBe('SKU-005');
      expect(result.name).toBe('Widget Pro');
    });
  });
});

describe('productTypeMapper', () => {
  // ==========================================================================
  // toDomain Tests
  // ==========================================================================

  describe('toDomain()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockProductTypeResponse();
      const result = productTypeMapper.toDomain(response);

      expectDomainShape(result, ['id', 'name', 'description', 'createdAt']);
    });

    it('should preserve field values correctly', () => {
      const response = createMockProductTypeResponse();
      const result = productTypeMapper.toDomain(response);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Electronics');
      expect(result.description).toBe('Electronic components');
      expect(result.createdAt).toBe('2025-01-01T00:00:00Z');
    });

    it('should handle null description', () => {
      const response = createMockProductTypeResponse({ description: null });
      const result = productTypeMapper.toDomain(response);

      expect(result.description).toBeNull();
    });

    it('should handle undefined description', () => {
      const response = createMockProductTypeResponse({ description: undefined });
      const result = productTypeMapper.toDomain(response);

      expect(result.description).toBeNull();
    });
  });
});
