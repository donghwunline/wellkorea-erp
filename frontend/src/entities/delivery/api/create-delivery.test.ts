/**
 * Create Delivery Command Tests.
 *
 * Tests for input validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createDelivery,
  type CreateDeliveryInput,
  type CreateDeliveryLineItemInput,
} from './create-delivery';
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
    DELIVERY_ENDPOINTS: {
      BASE: '/api/deliveries',
      byId: (id: number) => `/api/deliveries/${id}`,
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidLineItem(
  overrides?: Partial<CreateDeliveryLineItemInput>
): CreateDeliveryLineItemInput {
  return {
    productId: 1,
    quantityDelivered: 10,
    ...overrides,
  };
}

function createValidInput(overrides?: Partial<CreateDeliveryInput>): CreateDeliveryInput {
  return {
    projectId: 100,
    quotationId: 200,
    deliveryDate: '2025-01-07',
    lineItems: [createValidLineItem()],
    notes: undefined,
    ...overrides,
  };
}

describe('createDelivery', () => {
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
      await expect(createDelivery(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when projectId is null', async () => {
      const input = createValidInput({ projectId: null as unknown as number });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('projectId');
        expect(e.message).toContain('Project');
      }
    });

    it('should throw REQUIRED error when projectId is 0', async () => {
      const input = createValidInput({ projectId: 0 });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('projectId');
      }
    });

    it('should throw REQUIRED error when projectId is negative', async () => {
      const input = createValidInput({ projectId: -1 });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('projectId');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Delivery Date
  // ==========================================================================

  describe('validation - deliveryDate', () => {
    it('should pass with valid deliveryDate', async () => {
      const input = createValidInput({ deliveryDate: '2025-01-07' });
      await expect(createDelivery(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when deliveryDate is empty', async () => {
      const input = createValidInput({ deliveryDate: '' });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('deliveryDate');
        expect(e.message).toContain('Delivery date');
      }
    });

    it('should throw REQUIRED error when deliveryDate is null', async () => {
      const input = createValidInput({ deliveryDate: null as unknown as string });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('deliveryDate');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Line Items Array
  // ==========================================================================

  describe('validation - lineItems array', () => {
    it('should throw REQUIRED error when lineItems is empty', async () => {
      const input = createValidInput({ lineItems: [] });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('lineItems');
        expect(e.message).toContain('At least one');
      }
    });

    it('should throw REQUIRED error when lineItems is null', async () => {
      const input = createValidInput({
        lineItems: null as unknown as CreateDeliveryLineItemInput[],
      });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('lineItems');
      }
    });

    it('should pass with multiple line items', async () => {
      const input = createValidInput({
        lineItems: [
          createValidLineItem({ productId: 1, quantityDelivered: 10 }),
          createValidLineItem({ productId: 2, quantityDelivered: 20 }),
        ],
      });
      await expect(createDelivery(input)).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Validation Tests - Line Item Fields
  // ==========================================================================

  describe('validation - lineItem.productId', () => {
    it('should throw REQUIRED error for lineItem without productId', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ productId: null as unknown as number })],
      });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('lineItems[0].productId');
        expect(e.message).toContain('Product ID');
      }
    });

    it('should throw REQUIRED error for lineItem with productId = 0', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ productId: 0 })],
      });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
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
          createValidLineItem({ productId: null as unknown as number }),
        ],
      });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.fieldPath).toBe('lineItems[1].productId');
      }
    });
  });

  describe('validation - lineItem.quantityDelivered', () => {
    it('should throw OUT_OF_RANGE error for zero quantity', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ quantityDelivered: 0 })],
      });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('OUT_OF_RANGE');
        expect(e.fieldPath).toBe('lineItems[0].quantityDelivered');
        expect(e.message).toContain('greater than 0');
      }
    });

    it('should throw OUT_OF_RANGE error for negative quantity', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ quantityDelivered: -5 })],
      });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('OUT_OF_RANGE');
        expect(e.fieldPath).toBe('lineItems[0].quantityDelivered');
      }
    });

    it('should accept decimal quantities', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ quantityDelivered: 10.5 })],
      });

      await expect(createDelivery(input)).resolves.not.toThrow();
    });

    it('should include correct index in field path for invalid quantity', async () => {
      const input = createValidInput({
        lineItems: [
          createValidLineItem({ productId: 1, quantityDelivered: 10 }),
          createValidLineItem({ productId: 2, quantityDelivered: 20 }),
          createValidLineItem({ productId: 3, quantityDelivered: -1 }),
        ],
      });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);

      try {
        await createDelivery(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.fieldPath).toBe('lineItems[2].quantityDelivered');
      }
    });
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should map all fields correctly to request', async () => {
      const input: CreateDeliveryInput = {
        projectId: 100,
        quotationId: 200,
        deliveryDate: '2025-01-07',
        lineItems: [
          { productId: 1, quantityDelivered: 10 },
          { productId: 2, quantityDelivered: 20 },
        ],
        notes: 'Test delivery notes',
      };

      await createDelivery(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/deliveries?projectId=100',
        {
          quotationId: 200,
          deliveryDate: '2025-01-07',
          lineItems: [
            { productId: 1, quantityDelivered: 10 },
            { productId: 2, quantityDelivered: 20 },
          ],
          notes: 'Test delivery notes',
        }
      );
    });

    it('should include undefined notes when not provided', async () => {
      const input = createValidInput({ notes: undefined });

      await createDelivery(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ notes: undefined })
      );
    });

    it('should include empty notes when provided as empty string', async () => {
      const input = createValidInput({ notes: '' });

      await createDelivery(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ notes: '' })
      );
    });

    it('should preserve notes string with content', async () => {
      const input = createValidInput({ notes: 'Delivery to warehouse B' });

      await createDelivery(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ notes: 'Delivery to warehouse B' })
      );
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct endpoint including projectId', async () => {
      const input = createValidInput({ projectId: 123 });

      await createDelivery(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/deliveries?projectId=123',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.post.mockResolvedValue({ id: 456, message: 'Delivery created' });
      const input = createValidInput();

      const result = await createDelivery(input);

      expect(result).toEqual({ id: 456, message: 'Delivery created' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);
      const input = createValidInput();

      await expect(createDelivery(input)).rejects.toThrow('Network error');
    });

    it('should not call API if validation fails', async () => {
      const input = createValidInput({ projectId: 0 });

      await expect(createDelivery(input)).rejects.toThrow(DomainValidationError);
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle single line item', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ productId: 1, quantityDelivered: 100 })],
      });

      await createDelivery(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          lineItems: [{ productId: 1, quantityDelivered: 100 }],
        })
      );
    });

    it('should handle many line items', async () => {
      const lineItems = Array.from({ length: 50 }, (_, i) => ({
        productId: i + 1,
        quantityDelivered: (i + 1) * 10,
      }));

      const input = createValidInput({ lineItems });

      await createDelivery(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ lineItems })
      );
    });

    it('should handle very large quantities', async () => {
      const input = createValidInput({
        lineItems: [createValidLineItem({ quantityDelivered: 999999999 })],
      });

      await createDelivery(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          lineItems: [expect.objectContaining({ quantityDelivered: 999999999 })],
        })
      );
    });

    it('should handle delivery date at edge of year', async () => {
      const input = createValidInput({ deliveryDate: '2025-12-31' });

      await createDelivery(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ deliveryDate: '2025-12-31' })
      );
    });
  });
});
