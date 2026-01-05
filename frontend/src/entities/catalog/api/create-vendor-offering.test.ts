/**
 * Create Vendor Offering Command Tests.
 *
 * Tests for input validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createVendorOffering,
  VendorOfferingValidationError,
  type CreateVendorOfferingInput,
} from './create-vendor-offering';
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
    SERVICE_CATEGORY_ENDPOINTS: {
      BASE: '/api/service-categories',
      createOffering: '/api/vendor-offerings',
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(
  overrides?: Partial<CreateVendorOfferingInput>
): CreateVendorOfferingInput {
  return {
    vendorId: 10,
    serviceCategoryId: 1,
    unitPrice: 5000,
    currency: 'KRW',
    ...overrides,
  };
}

describe('createVendorOffering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.post.mockResolvedValue(createCommandResult(1));
  });

  // ==========================================================================
  // Validation Tests - Vendor ID
  // ==========================================================================

  describe('validation - vendorId', () => {
    it('should pass with valid vendorId', async () => {
      const input = createValidInput({ vendorId: 10 });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should throw error when vendorId is 0', async () => {
      const input = createValidInput({ vendorId: 0 });

      await expect(createVendorOffering(input)).rejects.toThrow(
        VendorOfferingValidationError
      );
      await expect(createVendorOffering(input)).rejects.toThrow(
        'Valid vendor ID is required'
      );
    });

    it('should throw error when vendorId is negative', async () => {
      const input = createValidInput({ vendorId: -1 });

      await expect(createVendorOffering(input)).rejects.toThrow(
        VendorOfferingValidationError
      );
    });

    it('should include field name in error', async () => {
      const input = createValidInput({ vendorId: 0 });

      try {
        await createVendorOffering(input);
      } catch (error) {
        const e = error as VendorOfferingValidationError;
        expect(e.field).toBe('vendorId');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Service Category ID
  // ==========================================================================

  describe('validation - serviceCategoryId', () => {
    it('should pass with valid serviceCategoryId', async () => {
      const input = createValidInput({ serviceCategoryId: 5 });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should throw error when serviceCategoryId is 0', async () => {
      const input = createValidInput({ serviceCategoryId: 0 });

      await expect(createVendorOffering(input)).rejects.toThrow(
        VendorOfferingValidationError
      );
      await expect(createVendorOffering(input)).rejects.toThrow(
        'Valid service category ID is required'
      );
    });

    it('should throw error when serviceCategoryId is negative', async () => {
      const input = createValidInput({ serviceCategoryId: -1 });

      await expect(createVendorOffering(input)).rejects.toThrow(
        VendorOfferingValidationError
      );
    });

    it('should include field name in error', async () => {
      const input = createValidInput({ serviceCategoryId: 0 });

      try {
        await createVendorOffering(input);
      } catch (error) {
        const e = error as VendorOfferingValidationError;
        expect(e.field).toBe('serviceCategoryId');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Unit Price
  // ==========================================================================

  describe('validation - unitPrice', () => {
    it('should pass when unitPrice is positive', async () => {
      const input = createValidInput({ unitPrice: 5000 });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should pass when unitPrice is zero', async () => {
      const input = createValidInput({ unitPrice: 0 });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should pass when unitPrice is null', async () => {
      const input = createValidInput({ unitPrice: null });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should pass when unitPrice is undefined', async () => {
      const input = createValidInput({ unitPrice: undefined });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should throw error when unitPrice is negative', async () => {
      const input = createValidInput({ unitPrice: -100 });

      await expect(createVendorOffering(input)).rejects.toThrow(
        VendorOfferingValidationError
      );
      await expect(createVendorOffering(input)).rejects.toThrow(
        'Unit price cannot be negative'
      );
    });

    it('should include field name in error', async () => {
      const input = createValidInput({ unitPrice: -100 });

      try {
        await createVendorOffering(input);
      } catch (error) {
        const e = error as VendorOfferingValidationError;
        expect(e.field).toBe('unitPrice');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Lead Time Days
  // ==========================================================================

  describe('validation - leadTimeDays', () => {
    it('should pass when leadTimeDays is positive', async () => {
      const input = createValidInput({ leadTimeDays: 5 });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should pass when leadTimeDays is zero', async () => {
      const input = createValidInput({ leadTimeDays: 0 });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should pass when leadTimeDays is null', async () => {
      const input = createValidInput({ leadTimeDays: null });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should throw error when leadTimeDays is negative', async () => {
      const input = createValidInput({ leadTimeDays: -1 });

      await expect(createVendorOffering(input)).rejects.toThrow(
        VendorOfferingValidationError
      );
      await expect(createVendorOffering(input)).rejects.toThrow(
        'Lead time cannot be negative'
      );
    });
  });

  // ==========================================================================
  // Validation Tests - Min Order Quantity
  // ==========================================================================

  describe('validation - minOrderQuantity', () => {
    it('should pass when minOrderQuantity is positive', async () => {
      const input = createValidInput({ minOrderQuantity: 10 });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should pass when minOrderQuantity is zero', async () => {
      const input = createValidInput({ minOrderQuantity: 0 });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should pass when minOrderQuantity is null', async () => {
      const input = createValidInput({ minOrderQuantity: null });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should throw error when minOrderQuantity is negative', async () => {
      const input = createValidInput({ minOrderQuantity: -1 });

      await expect(createVendorOffering(input)).rejects.toThrow(
        VendorOfferingValidationError
      );
      await expect(createVendorOffering(input)).rejects.toThrow(
        'Minimum order quantity cannot be negative'
      );
    });
  });

  // ==========================================================================
  // Validation Tests - Date Range
  // ==========================================================================

  describe('validation - date range', () => {
    it('should pass when effectiveFrom is before effectiveTo', async () => {
      const input = createValidInput({
        effectiveFrom: '2025-01-01',
        effectiveTo: '2025-12-31',
      });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should pass when effectiveFrom equals effectiveTo', async () => {
      const input = createValidInput({
        effectiveFrom: '2025-06-15',
        effectiveTo: '2025-06-15',
      });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should pass when only effectiveFrom is provided', async () => {
      const input = createValidInput({
        effectiveFrom: '2025-01-01',
        effectiveTo: null,
      });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should pass when only effectiveTo is provided', async () => {
      const input = createValidInput({
        effectiveFrom: null,
        effectiveTo: '2025-12-31',
      });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should throw error when effectiveFrom is after effectiveTo', async () => {
      const input = createValidInput({
        effectiveFrom: '2025-12-31',
        effectiveTo: '2025-01-01',
      });

      await expect(createVendorOffering(input)).rejects.toThrow(
        VendorOfferingValidationError
      );
      await expect(createVendorOffering(input)).rejects.toThrow(
        'Effective from date must be before effective to date'
      );
    });
  });

  // ==========================================================================
  // Validation Tests - Notes
  // ==========================================================================

  describe('validation - notes', () => {
    it('should pass when notes is under 1000 characters', async () => {
      const input = createValidInput({ notes: 'A'.repeat(999) });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should pass when notes is exactly 1000 characters', async () => {
      const input = createValidInput({ notes: 'A'.repeat(1000) });
      await expect(createVendorOffering(input)).resolves.not.toThrow();
    });

    it('should throw error when notes exceeds 1000 characters', async () => {
      const input = createValidInput({ notes: 'A'.repeat(1001) });

      await expect(createVendorOffering(input)).rejects.toThrow(
        VendorOfferingValidationError
      );
      await expect(createVendorOffering(input)).rejects.toThrow(
        'Notes must not exceed 1000 characters'
      );
    });
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should trim vendorServiceCode whitespace', async () => {
      const input = createValidInput({ vendorServiceCode: '  LC-001  ' });

      await createVendorOffering(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/vendor-offerings',
        expect.objectContaining({ vendorServiceCode: 'LC-001' })
      );
    });

    it('should trim vendorServiceName whitespace', async () => {
      const input = createValidInput({ vendorServiceName: '  Standard Cut  ' });

      await createVendorOffering(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/vendor-offerings',
        expect.objectContaining({ vendorServiceName: 'Standard Cut' })
      );
    });

    it('should convert empty vendorServiceCode to null', async () => {
      const input = createValidInput({ vendorServiceCode: '' });

      await createVendorOffering(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/vendor-offerings',
        expect.objectContaining({ vendorServiceCode: null })
      );
    });

    it('should trim notes whitespace', async () => {
      const input = createValidInput({ notes: '  High quality  ' });

      await createVendorOffering(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/vendor-offerings',
        expect.objectContaining({ notes: 'High quality' })
      );
    });

    it('should convert empty notes to null', async () => {
      const input = createValidInput({ notes: '' });

      await createVendorOffering(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/vendor-offerings',
        expect.objectContaining({ notes: null })
      );
    });

    it('should default isPreferred to false', async () => {
      const input = createValidInput({ isPreferred: undefined });

      await createVendorOffering(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/vendor-offerings',
        expect.objectContaining({ isPreferred: false })
      );
    });

    it('should preserve isPreferred when true', async () => {
      const input = createValidInput({ isPreferred: true });

      await createVendorOffering(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/vendor-offerings',
        expect.objectContaining({ isPreferred: true })
      );
    });

    it('should convert undefined currency to null', async () => {
      const input = createValidInput({ currency: undefined });

      await createVendorOffering(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/vendor-offerings',
        expect.objectContaining({ currency: null })
      );
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct endpoint', async () => {
      const input = createValidInput();

      await createVendorOffering(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/vendor-offerings',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.post.mockResolvedValue({ id: 123, message: 'Created' });
      const input = createValidInput();

      const result = await createVendorOffering(input);

      expect(result).toEqual({ id: 123, message: 'Created' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);
      const input = createValidInput();

      await expect(createVendorOffering(input)).rejects.toThrow('Network error');
    });

    it('should not call API when validation fails', async () => {
      const input = createValidInput({ vendorId: 0 });

      try {
        await createVendorOffering(input);
      } catch {
        // Expected
      }

      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });
});
