/**
 * Create Company Command Tests.
 *
 * Tests for input validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createCompany, type CreateCompanyInput } from './create-company';
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
    COMPANY_ENDPOINTS: {
      BASE: '/api/companies',
      byId: (id: number) => `/api/companies/${id}`,
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(overrides?: Partial<CreateCompanyInput>): CreateCompanyInput {
  return {
    name: 'Test Company',
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
    roles: ['CUSTOMER'],
    ...overrides,
  };
}

describe('createCompany', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.post.mockResolvedValue(createCommandResult(1));
  });

  // ==========================================================================
  // Validation Tests - Name
  // ==========================================================================

  describe('validation - name', () => {
    it('should pass with valid name', async () => {
      const input = createValidInput({ name: 'Valid Company Name' });
      await expect(createCompany(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when name is empty', async () => {
      const input = createValidInput({ name: '' });

      await expect(createCompany(input)).rejects.toThrow(DomainValidationError);

      try {
        await createCompany(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('name');
      }
    });

    it('should throw REQUIRED error when name is whitespace only', async () => {
      const input = createValidInput({ name: '   ' });

      await expect(createCompany(input)).rejects.toThrow(DomainValidationError);

      try {
        await createCompany(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('name');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Roles
  // ==========================================================================

  describe('validation - roles', () => {
    it('should pass with valid roles', async () => {
      const input = createValidInput({ roles: ['CUSTOMER', 'VENDOR'] });
      await expect(createCompany(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when roles is empty', async () => {
      const input = createValidInput({ roles: [] });

      await expect(createCompany(input)).rejects.toThrow(DomainValidationError);

      try {
        await createCompany(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('roles');
      }
    });
  });

  // ==========================================================================
  // Validation Tests - Email
  // ==========================================================================

  describe('validation - email', () => {
    it('should pass with valid email', async () => {
      const input = createValidInput({ email: 'test@example.com' });
      await expect(createCompany(input)).resolves.not.toThrow();
    });

    it('should pass when email is empty (optional field)', async () => {
      const input = createValidInput({ email: '' });
      await expect(createCompany(input)).resolves.not.toThrow();
    });

    it('should pass when email is undefined (optional field)', async () => {
      const input = createValidInput({ email: undefined });
      await expect(createCompany(input)).resolves.not.toThrow();
    });

    it('should throw INVALID_FORMAT error for invalid email', async () => {
      const input = createValidInput({ email: 'invalid-email' });

      await expect(createCompany(input)).rejects.toThrow(DomainValidationError);

      try {
        await createCompany(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('INVALID_FORMAT');
        expect(e.fieldPath).toBe('email');
      }
    });

    it('should throw INVALID_FORMAT error for email without domain', async () => {
      const input = createValidInput({ email: 'test@' });

      await expect(createCompany(input)).rejects.toThrow(DomainValidationError);
    });

    it('should throw INVALID_FORMAT error for email without @ symbol', async () => {
      const input = createValidInput({ email: 'testexample.com' });

      await expect(createCompany(input)).rejects.toThrow(DomainValidationError);
    });
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should trim name whitespace', async () => {
      const input = createValidInput({ name: '  Trimmed Company  ' });

      await createCompany(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/companies',
        expect.objectContaining({ name: 'Trimmed Company' })
      );
    });

    it('should convert empty optional fields to null', async () => {
      const input = createValidInput({
        registrationNumber: '',
        representative: '',
        contactPerson: '',
      });

      await createCompany(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/companies',
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

      await createCompany(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/companies',
        expect.objectContaining({
          representative: 'CEO Name',
          contactPerson: 'John Doe',
          address: 'Seoul, Korea',
        })
      );
    });

    it('should pass roles array as-is', async () => {
      const input = createValidInput({ roles: ['CUSTOMER', 'VENDOR', 'OUTSOURCE'] });

      await createCompany(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/companies',
        expect.objectContaining({
          roles: ['CUSTOMER', 'VENDOR', 'OUTSOURCE'],
        })
      );
    });

    it('should map all fields correctly', async () => {
      const input: CreateCompanyInput = {
        name: 'Test Company',
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
        roles: ['CUSTOMER'],
      };

      await createCompany(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/companies', {
        name: 'Test Company',
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
        roles: ['CUSTOMER'],
      });
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct endpoint', async () => {
      const input = createValidInput();

      await createCompany(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/companies',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.post.mockResolvedValue({ id: 123, message: 'Created' });
      const input = createValidInput();

      const result = await createCompany(input);

      expect(result).toEqual({ id: 123, message: 'Created' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);
      const input = createValidInput();

      await expect(createCompany(input)).rejects.toThrow('Network error');
    });
  });
});
