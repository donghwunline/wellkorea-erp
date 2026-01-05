/**
 * Create Product Command Tests.
 *
 * Tests for input validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createProduct, type CreateProductInput } from './create-product';
import { DomainValidationError } from '@/shared/lib/errors/domain-validation-error';
import { createCommandResult } from '@/test/entity-test-utils';

// =============================================================================
// Mock Setup
// =============================================================================

const mockHttpClient = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api');
  return {
    ...actual,
    httpClient: mockHttpClient,
    PRODUCT_ENDPOINTS: {
      BASE: '/api/products',
      byId: (id: number) => `/api/products/${id}`,
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(overrides?: Partial<CreateProductInput>): CreateProductInput {
  return {
    sku: 'PRD-001',
    name: 'Test Product',
    description: 'A test product',
    productTypeId: 1,
    baseUnitPrice: 10000,
    unit: 'EA',
    ...overrides,
  };
}

describe('createProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.post.mockResolvedValue(createCommandResult(1));
  });

  // ==========================================================================
  // Validation Tests - SKU
  // ==========================================================================

  describe('validation - sku', () => {
    it('should pass with valid sku', async () => {
      const input = createValidInput({ sku: 'PRD-001' });
      await expect(createProduct(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when sku is empty', async () => {
      const input = createValidInput({ sku: '' });

      await expect(createProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('sku');
      }
    });

    it('should throw REQUIRED error when sku is whitespace only', async () => {
      const input = createValidInput({ sku: '   ' });

      await expect(createProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('sku');
      }
    });

    it('should throw MAX_LENGTH error when sku exceeds 50 characters', async () => {
      const input = createValidInput({ sku: 'A'.repeat(51) });

      await expect(createProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('MAX_LENGTH');
        expect(e.fieldPath).toBe('sku');
      }
    });

    it('should accept sku with exactly 50 characters', async () => {
      const input = createValidInput({ sku: 'A'.repeat(50) });
      await expect(createProduct(input)).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Validation Tests - Name
  // ==========================================================================

  describe('validation - name', () => {
    it('should pass with valid name', async () => {
      const input = createValidInput({ name: 'Valid Product Name' });
      await expect(createProduct(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when name is empty', async () => {
      const input = createValidInput({ name: '' });

      await expect(createProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('name');
      }
    });

    it('should throw MAX_LENGTH error when name exceeds 200 characters', async () => {
      const input = createValidInput({ name: 'A'.repeat(201) });

      await expect(createProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('MAX_LENGTH');
        expect(e.fieldPath).toBe('name');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Product Type ID
  // ==========================================================================

  describe('validation - productTypeId', () => {
    it('should pass with valid productTypeId', async () => {
      const input = createValidInput({ productTypeId: 5 });
      await expect(createProduct(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when productTypeId is 0', async () => {
      const input = createValidInput({ productTypeId: 0 });

      await expect(createProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('productTypeId');
      }
    });

    it('should throw REQUIRED error when productTypeId is negative', async () => {
      const input = createValidInput({ productTypeId: -1 });

      await expect(createProduct(input)).rejects.toThrow(DomainValidationError);
    });
  });

  // ==========================================================================
  // Validation Tests - Base Unit Price
  // ==========================================================================

  describe('validation - baseUnitPrice', () => {
    it('should pass with valid baseUnitPrice', async () => {
      const input = createValidInput({ baseUnitPrice: 10000 });
      await expect(createProduct(input)).resolves.not.toThrow();
    });

    it('should pass when baseUnitPrice is undefined', async () => {
      const input = createValidInput({ baseUnitPrice: undefined });
      await expect(createProduct(input)).resolves.not.toThrow();
    });

    it('should pass when baseUnitPrice is zero', async () => {
      const input = createValidInput({ baseUnitPrice: 0 });
      await expect(createProduct(input)).resolves.not.toThrow();
    });

    it('should throw INVALID_VALUE error when baseUnitPrice is negative', async () => {
      const input = createValidInput({ baseUnitPrice: -100 });

      await expect(createProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await createProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('INVALID_VALUE');
        expect(e.fieldPath).toBe('baseUnitPrice');
      }
    });
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should trim sku whitespace', async () => {
      const input = createValidInput({ sku: '  PRD-001  ' });

      await createProduct(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({ sku: 'PRD-001' })
      );
    });

    it('should trim name whitespace', async () => {
      const input = createValidInput({ name: '  Test Product  ' });

      await createProduct(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({ name: 'Test Product' })
      );
    });

    it('should convert empty description to null', async () => {
      const input = createValidInput({ description: '' });

      await createProduct(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({ description: null })
      );
    });

    it('should trim description whitespace', async () => {
      const input = createValidInput({ description: '  A description  ' });

      await createProduct(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({ description: 'A description' })
      );
    });

    it('should convert undefined baseUnitPrice to null', async () => {
      const input = createValidInput({ baseUnitPrice: undefined });

      await createProduct(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({ baseUnitPrice: null })
      );
    });

    it('should default unit to EA when not provided', async () => {
      const input = createValidInput({ unit: undefined });

      await createProduct(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({ unit: 'EA' })
      );
    });

    it('should trim unit whitespace', async () => {
      const input = createValidInput({ unit: '  BOX  ' });

      await createProduct(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({ unit: 'BOX' })
      );
    });

    it('should map all fields correctly', async () => {
      const input: CreateProductInput = {
        sku: 'SKU-123',
        name: 'Widget Pro',
        description: 'Premium widget',
        productTypeId: 5,
        baseUnitPrice: 50000,
        unit: 'SET',
      };

      await createProduct(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/products', {
        sku: 'SKU-123',
        name: 'Widget Pro',
        description: 'Premium widget',
        productTypeId: 5,
        baseUnitPrice: 50000,
        unit: 'SET',
      });
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct endpoint', async () => {
      const input = createValidInput();

      await createProduct(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/products',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.post.mockResolvedValue({ id: 123, message: 'Created' });
      const input = createValidInput();

      const result = await createProduct(input);

      expect(result).toEqual({ id: 123, message: 'Created' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);
      const input = createValidInput();

      await expect(createProduct(input)).rejects.toThrow('Network error');
    });
  });
});
