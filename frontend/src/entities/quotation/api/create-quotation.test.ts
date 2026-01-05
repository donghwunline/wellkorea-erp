/**
 * Create Quotation Command Tests.
 *
 * Tests for input validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createQuotation, type CreateQuotationInput, type LineItemInput } from './create-quotation';
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
    QUOTATION_ENDPOINTS: {
      BASE: '/api/quotations',
      byId: (id: number) => `/api/quotations/${id}`,
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidLineItem(overrides?: Partial<LineItemInput>): LineItemInput {
  return {
    productId: 1,
    quantity: 10,
    unitPrice: 1000,
    notes: undefined,
    ...overrides,
  };
}

function createValidInput(overrides?: Partial<CreateQuotationInput>): CreateQuotationInput {
  return {
    projectId: 1,
    validityDays: 30,
    notes: undefined,
    lineItems: [createValidLineItem()],
    ...overrides,
  };
}

describe('createQuotation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.post.mockResolvedValue(createCommandResult(1));
  });

  // ==========================================================================
  // Validation Tests - Project ID
  // ==========================================================================

  describe('validation - projectId', () => {
    it('should pass with valid projectId', async () => {
      const input = createValidInput({ projectId: 1 });
      await expect(createQuotation(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when projectId is null', async () => {
      const input = createValidInput({ projectId: null });

      await expect(createQuotation(input)).rejects.toThrow(DomainValidationError);

      try {
        await createQuotation(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('projectId');
        expect(e.message).toContain('Project');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Line Items Array
  // ==========================================================================

  describe('validation - lineItems array', () => {
    it('should throw REQUIRED error when lineItems is empty', async () => {
      const input = createValidInput({ lineItems: [] });

      await expect(createQuotation(input)).rejects.toThrow(DomainValidationError);

      try {
        await createQuotation(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('lineItems');
        expect(e.message).toContain('At least one');
      }
    });

    it('should pass with multiple line items', async () => {
      const input = createValidInput({
        lineItems: [
          createValidLineItem({ productId: 1 }),
          createValidLineItem({ productId: 2 }),
        ],
      });
      await expect(createQuotation(input)).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Validation Tests - Line Item Fields
  // ==========================================================================

  describe('validation - lineItem.productId', () => {
    it('should throw REQUIRED error for lineItem without productId', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ productId: null })],
      });

      await expect(createQuotation(input)).rejects.toThrow(DomainValidationError);

      try {
        await createQuotation(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('lineItems[0].productId');
      }
    });

    it('should include correct index in field path for second item', async () => {
      const input = createValidInput({
        lineItems: [
          createValidLineItem({ productId: 1 }),
          createValidLineItem({ productId: null }),
        ],
      });

      await expect(createQuotation(input)).rejects.toThrow(DomainValidationError);

      try {
        await createQuotation(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.fieldPath).toBe('lineItems[1].productId');
      }
    });
  });

  describe('validation - lineItem.quantity', () => {
    it('should throw OUT_OF_RANGE error for zero quantity', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ quantity: 0 })],
      });

      await expect(createQuotation(input)).rejects.toThrow(DomainValidationError);

      try {
        await createQuotation(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('OUT_OF_RANGE');
        expect(e.fieldPath).toBe('lineItems[0].quantity');
        expect(e.message).toContain('greater than 0');
      }
    });

    it('should throw OUT_OF_RANGE error for negative quantity', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ quantity: -5 })],
      });

      await expect(createQuotation(input)).rejects.toThrow(DomainValidationError);

      try {
        await createQuotation(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('OUT_OF_RANGE');
        expect(e.fieldPath).toBe('lineItems[0].quantity');
      }
    });

    it('should accept string quantity and convert to number', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ quantity: '10' as unknown as number })],
      });

      await createQuotation(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/quotations',
        expect.objectContaining({
          lineItems: [expect.objectContaining({ quantity: 10 })],
        })
      );
    });
  });

  describe('validation - lineItem.unitPrice', () => {
    it('should throw OUT_OF_RANGE error for negative unitPrice', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ unitPrice: -100 })],
      });

      await expect(createQuotation(input)).rejects.toThrow(DomainValidationError);

      try {
        await createQuotation(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('OUT_OF_RANGE');
        expect(e.fieldPath).toBe('lineItems[0].unitPrice');
        expect(e.message).toContain('cannot be negative');
      }
    });

    it('should accept zero unitPrice', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ unitPrice: 0 })],
      });

      await expect(createQuotation(input)).resolves.not.toThrow();
    });

    it('should accept string unitPrice and convert to number', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ unitPrice: '5000' as unknown as number })],
      });

      await createQuotation(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/quotations',
        expect.objectContaining({
          lineItems: [expect.objectContaining({ unitPrice: 5000 })],
        })
      );
    });
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should use default validityDays when not provided', async () => {
      const input = createValidInput({ validityDays: undefined });

      await createQuotation(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/quotations',
        expect.objectContaining({ validityDays: 30 })
      );
    });

    it('should use provided validityDays', async () => {
      const input = createValidInput({ validityDays: 45 });

      await createQuotation(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/quotations',
        expect.objectContaining({ validityDays: 45 })
      );
    });

    it('should trim notes whitespace', async () => {
      const input = createValidInput({ notes: '  trimmed notes  ' });

      await createQuotation(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/quotations',
        expect.objectContaining({ notes: 'trimmed notes' })
      );
    });

    it('should convert empty notes to undefined', async () => {
      const input = createValidInput({ notes: '   ' });

      await createQuotation(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/quotations',
        expect.objectContaining({ notes: undefined })
      );
    });

    it('should trim line item notes', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ notes: '  item notes  ' })],
      });

      await createQuotation(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/quotations',
        expect.objectContaining({
          lineItems: [expect.objectContaining({ notes: 'item notes' })],
        })
      );
    });

    it('should map all fields correctly', async () => {
      const input: CreateQuotationInput = {
        projectId: 5,
        validityDays: 60,
        notes: 'Test notes',
        lineItems: [
          { productId: 10, quantity: 5, unitPrice: 1000, notes: 'Item 1' },
          { productId: 20, quantity: 3, unitPrice: 2000, notes: undefined },
        ],
      };

      await createQuotation(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/quotations', {
        projectId: 5,
        validityDays: 60,
        notes: 'Test notes',
        lineItems: [
          { productId: 10, quantity: 5, unitPrice: 1000, notes: 'Item 1' },
          { productId: 20, quantity: 3, unitPrice: 2000, notes: undefined },
        ],
      });
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct endpoint', async () => {
      const input = createValidInput();

      await createQuotation(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/quotations',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.post.mockResolvedValue({ id: 123, message: 'Created' });
      const input = createValidInput();

      const result = await createQuotation(input);

      expect(result).toEqual({ id: 123, message: 'Created' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);
      const input = createValidInput();

      await expect(createQuotation(input)).rejects.toThrow('Network error');
    });
  });
});
