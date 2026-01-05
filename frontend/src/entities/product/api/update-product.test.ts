/**
 * Update Product Command Tests.
 *
 * Tests for input validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { updateProduct, type UpdateProductInput } from './update-product';
import { DomainValidationError } from '@/shared/lib/errors/domain-validation-error';
import { createCommandResult } from '@/test/entity-test-utils';

// =============================================================================
// Mock Setup
// =============================================================================

const mockHttpClient = vi.hoisted(() => ({
  put: vi.fn(),
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

function createValidInput(overrides?: Partial<UpdateProductInput>): UpdateProductInput {
  return {
    id: 123,
    sku: 'PRD-001-UPDATED',
    name: 'Updated Product',
    description: 'Updated description',
    productTypeId: 2,
    baseUnitPrice: 15000,
    unit: 'BOX',
    isActive: true,
    ...overrides,
  };
}

describe('updateProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.put.mockResolvedValue(createCommandResult(123));
  });

  // ==========================================================================
  // Validation Tests - ID
  // ==========================================================================

  describe('validation - id', () => {
    it('should pass with valid id', async () => {
      const input = createValidInput({ id: 123 });
      await expect(updateProduct(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when id is 0', async () => {
      const input = createValidInput({ id: 0 });

      await expect(updateProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await updateProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('id');
      }
    });

    it('should throw REQUIRED error when id is negative', async () => {
      const input = createValidInput({ id: -1 });

      await expect(updateProduct(input)).rejects.toThrow(DomainValidationError);
    });
  });

  // ==========================================================================
  // Validation Tests - SKU
  // ==========================================================================

  describe('validation - sku', () => {
    it('should pass when sku is undefined (partial update)', async () => {
      const input = createValidInput({ sku: undefined });
      await expect(updateProduct(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when sku is empty string', async () => {
      const input = createValidInput({ sku: '' });

      await expect(updateProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await updateProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('sku');
      }
    });

    it('should throw MAX_LENGTH error when sku exceeds 50 characters', async () => {
      const input = createValidInput({ sku: 'A'.repeat(51) });

      await expect(updateProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await updateProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('MAX_LENGTH');
        expect(e.fieldPath).toBe('sku');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Name
  // ==========================================================================

  describe('validation - name', () => {
    it('should pass when name is undefined (partial update)', async () => {
      const input = createValidInput({ name: undefined });
      await expect(updateProduct(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when name is empty string', async () => {
      const input = createValidInput({ name: '' });

      await expect(updateProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await updateProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('name');
      }
    });

    it('should throw MAX_LENGTH error when name exceeds 200 characters', async () => {
      const input = createValidInput({ name: 'A'.repeat(201) });

      await expect(updateProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await updateProduct(input);
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
    it('should pass when productTypeId is undefined (partial update)', async () => {
      const input = createValidInput({ productTypeId: undefined });
      await expect(updateProduct(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when productTypeId is 0', async () => {
      const input = createValidInput({ productTypeId: 0 });

      await expect(updateProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await updateProduct(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('productTypeId');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Base Unit Price
  // ==========================================================================

  describe('validation - baseUnitPrice', () => {
    it('should pass when baseUnitPrice is undefined (partial update)', async () => {
      const input = createValidInput({ baseUnitPrice: undefined });
      await expect(updateProduct(input)).resolves.not.toThrow();
    });

    it('should pass when baseUnitPrice is zero', async () => {
      const input = createValidInput({ baseUnitPrice: 0 });
      await expect(updateProduct(input)).resolves.not.toThrow();
    });

    it('should throw INVALID_VALUE error when baseUnitPrice is negative', async () => {
      const input = createValidInput({ baseUnitPrice: -100 });

      await expect(updateProduct(input)).rejects.toThrow(DomainValidationError);

      try {
        await updateProduct(input);
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
    it('should only include provided fields in request', async () => {
      const input: UpdateProductInput = {
        id: 123,
        name: 'Updated Name',
      };

      await updateProduct(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/products/123',
        { name: 'Updated Name' }
      );
    });

    it('should trim sku whitespace', async () => {
      const input = createValidInput({ sku: '  PRD-002  ' });

      await updateProduct(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/products/${input.id}`,
        expect.objectContaining({ sku: 'PRD-002' })
      );
    });

    it('should trim name whitespace', async () => {
      const input = createValidInput({ name: '  Updated Product  ' });

      await updateProduct(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/products/${input.id}`,
        expect.objectContaining({ name: 'Updated Product' })
      );
    });

    it('should convert empty description to null', async () => {
      const input: UpdateProductInput = { id: 123, description: '' };

      await updateProduct(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/products/123',
        { description: null }
      );
    });

    it('should pass isActive when provided', async () => {
      const input: UpdateProductInput = { id: 123, isActive: false };

      await updateProduct(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/products/123',
        { isActive: false }
      );
    });

    it('should not include isActive when not provided', async () => {
      const input: UpdateProductInput = { id: 123, name: 'Test' };

      await updateProduct(input);

      const callArgs = mockHttpClient.put.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('isActive');
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.put with correct endpoint including id', async () => {
      const input = createValidInput({ id: 456 });

      await updateProduct(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/products/456',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.put.mockResolvedValue({ id: 123, message: 'Updated' });
      const input = createValidInput();

      const result = await updateProduct(input);

      expect(result).toEqual({ id: 123, message: 'Updated' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.put.mockRejectedValue(error);
      const input = createValidInput();

      await expect(updateProduct(input)).rejects.toThrow('Network error');
    });

    it('should handle different product IDs', async () => {
      await updateProduct({ id: 1, name: 'Test' });
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/products/1', expect.any(Object));

      await updateProduct({ id: 999, name: 'Test' });
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/products/999', expect.any(Object));
    });
  });
});
