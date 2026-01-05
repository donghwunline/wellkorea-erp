/**
 * Update Quotation Command Tests.
 *
 * Tests for input validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { updateQuotation, type UpdateQuotationInput } from './update-quotation';
import type { LineItemInput } from './create-quotation';
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

function createValidInput(overrides?: Partial<UpdateQuotationInput>): UpdateQuotationInput {
  return {
    validityDays: 30,
    notes: undefined,
    lineItems: [createValidLineItem()],
    ...overrides,
  };
}

describe('updateQuotation', () => {
  const quotationId = 123;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.put.mockResolvedValue(createCommandResult(quotationId));
  });

  // ==========================================================================
  // Validation Tests - Line Items Array
  // ==========================================================================

  describe('validation - lineItems array', () => {
    it('should pass with valid input', async () => {
      const input = createValidInput();
      await expect(updateQuotation(quotationId, input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when lineItems is empty', async () => {
      const input = createValidInput({ lineItems: [] });

      await expect(updateQuotation(quotationId, input)).rejects.toThrow(DomainValidationError);

      try {
        await updateQuotation(quotationId, input);
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
          createValidLineItem({ productId: 3 }),
        ],
      });
      await expect(updateQuotation(quotationId, input)).resolves.not.toThrow();
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

      await expect(updateQuotation(quotationId, input)).rejects.toThrow(DomainValidationError);

      try {
        await updateQuotation(quotationId, input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('lineItems[0].productId');
      }
    });

    it('should include correct index in field path', async () => {
      const input = createValidInput({
        lineItems: [
          createValidLineItem({ productId: 1 }),
          createValidLineItem({ productId: 2 }),
          createValidLineItem({ productId: null }),
        ],
      });

      await expect(updateQuotation(quotationId, input)).rejects.toThrow(DomainValidationError);

      try {
        await updateQuotation(quotationId, input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.fieldPath).toBe('lineItems[2].productId');
      }
    });
  });

  describe('validation - lineItem.quantity', () => {
    it('should throw OUT_OF_RANGE error for zero quantity', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ quantity: 0 })],
      });

      await expect(updateQuotation(quotationId, input)).rejects.toThrow(DomainValidationError);

      try {
        await updateQuotation(quotationId, input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('OUT_OF_RANGE');
        expect(e.fieldPath).toBe('lineItems[0].quantity');
      }
    });

    it('should throw OUT_OF_RANGE error for negative quantity', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ quantity: -1 })],
      });

      await expect(updateQuotation(quotationId, input)).rejects.toThrow(DomainValidationError);

      try {
        await updateQuotation(quotationId, input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('OUT_OF_RANGE');
        expect(e.fieldPath).toBe('lineItems[0].quantity');
      }
    });

    it('should accept positive quantity', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ quantity: 1 })],
      });
      await expect(updateQuotation(quotationId, input)).resolves.not.toThrow();
    });
  });

  describe('validation - lineItem.unitPrice', () => {
    it('should throw OUT_OF_RANGE error for negative unitPrice', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ unitPrice: -1 })],
      });

      await expect(updateQuotation(quotationId, input)).rejects.toThrow(DomainValidationError);

      try {
        await updateQuotation(quotationId, input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('OUT_OF_RANGE');
        expect(e.fieldPath).toBe('lineItems[0].unitPrice');
      }
    });

    it('should accept zero unitPrice', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ unitPrice: 0 })],
      });
      await expect(updateQuotation(quotationId, input)).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should pass validityDays to request', async () => {
      const input = createValidInput({ validityDays: 45 });

      await updateQuotation(quotationId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/quotations/${quotationId}`,
        expect.objectContaining({ validityDays: 45 })
      );
    });

    it('should pass undefined validityDays when not provided', async () => {
      const input = createValidInput({ validityDays: undefined });

      await updateQuotation(quotationId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/quotations/${quotationId}`,
        expect.objectContaining({ validityDays: undefined })
      );
    });

    it('should trim notes whitespace', async () => {
      const input = createValidInput({ notes: '  updated notes  ' });

      await updateQuotation(quotationId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/quotations/${quotationId}`,
        expect.objectContaining({ notes: 'updated notes' })
      );
    });

    it('should convert empty notes to undefined', async () => {
      const input = createValidInput({ notes: '   ' });

      await updateQuotation(quotationId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/quotations/${quotationId}`,
        expect.objectContaining({ notes: undefined })
      );
    });

    it('should convert string quantity to number', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ quantity: '20' as unknown as number })],
      });

      await updateQuotation(quotationId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/quotations/${quotationId}`,
        expect.objectContaining({
          lineItems: [expect.objectContaining({ quantity: 20 })],
        })
      );
    });

    it('should convert string unitPrice to number', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ unitPrice: '3000' as unknown as number })],
      });

      await updateQuotation(quotationId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/quotations/${quotationId}`,
        expect.objectContaining({
          lineItems: [expect.objectContaining({ unitPrice: 3000 })],
        })
      );
    });

    it('should trim line item notes', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ notes: '  line item notes  ' })],
      });

      await updateQuotation(quotationId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/quotations/${quotationId}`,
        expect.objectContaining({
          lineItems: [expect.objectContaining({ notes: 'line item notes' })],
        })
      );
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.put with correct endpoint including id', async () => {
      const input = createValidInput();

      await updateQuotation(456, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/quotations/456',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.put.mockResolvedValue({ id: 123, message: 'Updated' });
      const input = createValidInput();

      const result = await updateQuotation(quotationId, input);

      expect(result).toEqual({ id: 123, message: 'Updated' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.put.mockRejectedValue(error);
      const input = createValidInput();

      await expect(updateQuotation(quotationId, input)).rejects.toThrow('Network error');
    });

    it('should handle different quotation IDs', async () => {
      const input = createValidInput();

      await updateQuotation(1, input);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/quotations/1', expect.any(Object));

      await updateQuotation(999, input);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/quotations/999', expect.any(Object));
    });
  });
});
