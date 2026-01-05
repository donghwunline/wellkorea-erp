/**
 * Update Company Command Tests.
 *
 * Tests for input validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { updateCompany, type UpdateCompanyInput } from './update-company';
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
    COMPANY_ENDPOINTS: {
      BASE: '/api/companies',
      byId: (id: number) => `/api/companies/${id}`,
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(overrides?: Partial<UpdateCompanyInput>): UpdateCompanyInput {
  return {
    id: 123,
    name: 'Updated Company',
    registrationNumber: '123-45-67890',
    representative: 'CEO Name',
    businessType: 'Manufacturing',
    businessCategory: 'Electronics',
    contactPerson: 'John Doe',
    phone: '02-1234-5678',
    email: 'contact@test.com',
    address: 'Seoul, Korea',
    bankAccount: '123-456-789',
    paymentTerms: 'Net 30',
    ...overrides,
  };
}

describe('updateCompany', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.put.mockResolvedValue(createCommandResult(123));
  });

  // ==========================================================================
  // Validation Tests - Name
  // ==========================================================================

  describe('validation - name', () => {
    it('should pass with valid name', async () => {
      const input = createValidInput({ name: 'Valid Company Name' });
      await expect(updateCompany(input)).resolves.not.toThrow();
    });

    it('should pass when name is undefined (partial update)', async () => {
      const input = createValidInput({ name: undefined });
      await expect(updateCompany(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when name is empty string', async () => {
      const input = createValidInput({ name: '' });

      await expect(updateCompany(input)).rejects.toThrow(DomainValidationError);

      try {
        await updateCompany(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('name');
      }
    });

    it('should throw REQUIRED error when name is whitespace only', async () => {
      const input = createValidInput({ name: '   ' });

      await expect(updateCompany(input)).rejects.toThrow(DomainValidationError);

      try {
        await updateCompany(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('name');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Email
  // ==========================================================================

  describe('validation - email', () => {
    it('should pass with valid email', async () => {
      const input = createValidInput({ email: 'test@example.com' });
      await expect(updateCompany(input)).resolves.not.toThrow();
    });

    it('should pass when email is undefined (partial update)', async () => {
      const input = createValidInput({ email: undefined });
      await expect(updateCompany(input)).resolves.not.toThrow();
    });

    it('should pass when email is empty string', async () => {
      const input = createValidInput({ email: '' });
      await expect(updateCompany(input)).resolves.not.toThrow();
    });

    it('should throw INVALID_FORMAT error for invalid email', async () => {
      const input = createValidInput({ email: 'invalid-email' });

      await expect(updateCompany(input)).rejects.toThrow(DomainValidationError);

      try {
        await updateCompany(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('INVALID_FORMAT');
        expect(e.fieldPath).toBe('email');
      }
    });

    it('should throw INVALID_FORMAT error for email without domain', async () => {
      const input = createValidInput({ email: 'test@' });

      await expect(updateCompany(input)).rejects.toThrow(DomainValidationError);
    });
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should trim name whitespace', async () => {
      const input = createValidInput({ name: '  Trimmed Company  ' });

      await updateCompany(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/companies/${input.id}`,
        expect.objectContaining({ name: 'Trimmed Company' })
      );
    });

    it('should pass undefined name as null when not provided', async () => {
      const input = createValidInput({ name: undefined });

      await updateCompany(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/companies/${input.id}`,
        expect.objectContaining({ name: null })
      );
    });

    it('should convert empty optional fields to null', async () => {
      const input = createValidInput({
        registrationNumber: '',
        representative: '',
        contactPerson: '',
      });

      await updateCompany(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/companies/${input.id}`,
        expect.objectContaining({
          registrationNumber: null,
          representative: null,
          contactPerson: null,
        })
      );
    });

    it('should trim optional field whitespace', async () => {
      const input = createValidInput({
        representative: '  CEO Name  ',
        contactPerson: '  John Doe  ',
        address: '  Seoul, Korea  ',
      });

      await updateCompany(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/companies/${input.id}`,
        expect.objectContaining({
          representative: 'CEO Name',
          contactPerson: 'John Doe',
          address: 'Seoul, Korea',
        })
      );
    });

    it('should map all fields correctly', async () => {
      const input: UpdateCompanyInput = {
        id: 123,
        name: 'Updated Company',
        registrationNumber: '123-45-67890',
        representative: 'CEO',
        businessType: 'Manufacturing',
        businessCategory: 'Electronics',
        contactPerson: 'John Doe',
        phone: '02-1234-5678',
        email: 'test@test.com',
        address: 'Seoul',
        bankAccount: '123-456-789',
        paymentTerms: 'Net 30',
      };

      await updateCompany(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/companies/123', {
        name: 'Updated Company',
        registrationNumber: '123-45-67890',
        representative: 'CEO',
        businessType: 'Manufacturing',
        businessCategory: 'Electronics',
        contactPerson: 'John Doe',
        phone: '02-1234-5678',
        email: 'test@test.com',
        address: 'Seoul',
        bankAccount: '123-456-789',
        paymentTerms: 'Net 30',
      });
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.put with correct endpoint including id', async () => {
      const input = createValidInput({ id: 456 });

      await updateCompany(input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/companies/456',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.put.mockResolvedValue({ id: 123, message: 'Updated' });
      const input = createValidInput();

      const result = await updateCompany(input);

      expect(result).toEqual({ id: 123, message: 'Updated' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.put.mockRejectedValue(error);
      const input = createValidInput();

      await expect(updateCompany(input)).rejects.toThrow('Network error');
    });

    it('should handle different company IDs', async () => {
      await updateCompany(createValidInput({ id: 1 }));
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/companies/1', expect.any(Object));

      await updateCompany(createValidInput({ id: 999 }));
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/companies/999', expect.any(Object));
    });
  });
});
