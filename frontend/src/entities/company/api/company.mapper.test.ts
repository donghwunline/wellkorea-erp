/**
 * Company Mapper Tests.
 *
 * Tests for DTO → Domain model transformations.
 */

import { describe, expect, it } from 'vitest';
import {
  companyMapper,
  type CompanyDetailsResponse,
  type CompanySummaryResponse,
  type CompanyRoleResponse,
} from './company.mapper';
import { expectDomainShape } from '@/test/entity-test-utils';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockRoleResponse(
  overrides?: Partial<CompanyRoleResponse>
): CompanyRoleResponse {
  return {
    roleType: 'CUSTOMER',
    createdAt: '2025-01-15T00:00:00Z',
    ...overrides,
  };
}

function createMockCompanyDetailsResponse(
  overrides?: Partial<CompanyDetailsResponse>
): CompanyDetailsResponse {
  return {
    id: 1,
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
    roles: [createMockRoleResponse()],
    isActive: true,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-16T00:00:00Z',
    ...overrides,
  };
}

function createMockCompanySummaryResponse(
  overrides?: Partial<CompanySummaryResponse>
): CompanySummaryResponse {
  return {
    id: 1,
    name: 'Test Company',
    registrationNumber: '123-45-67890',
    contactPerson: 'John Doe',
    phone: '02-1234-5678',
    email: 'contact@test.com',
    roles: [createMockRoleResponse()],
    isActive: true,
    createdAt: '2025-01-15T00:00:00Z',
    ...overrides,
  };
}

describe('companyMapper', () => {
  // ==========================================================================
  // toDomain Tests
  // ==========================================================================

  describe('toDomain()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockCompanyDetailsResponse();
      const result = companyMapper.toDomain(response);

      expectDomainShape(result, [
        'id',
        'name',
        'registrationNumber',
        'representative',
        'businessType',
        'businessCategory',
        'contactPerson',
        'phone',
        'email',
        'address',
        'bankAccount',
        'paymentTerms',
        'roles',
        'isActive',
        'createdAt',
        'updatedAt',
      ]);
    });

    it('should preserve field values correctly', () => {
      const response = createMockCompanyDetailsResponse();
      const result = companyMapper.toDomain(response);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Company');
      expect(result.registrationNumber).toBe('123-45-67890');
      expect(result.isActive).toBe(true);
    });

    it('should handle null optional fields', () => {
      const response = createMockCompanyDetailsResponse({
        registrationNumber: null,
        representative: null,
        businessType: null,
        businessCategory: null,
        contactPerson: null,
        phone: null,
        email: null,
        address: null,
        bankAccount: null,
        paymentTerms: null,
      });
      const result = companyMapper.toDomain(response);

      expect(result.registrationNumber).toBeNull();
      expect(result.representative).toBeNull();
      expect(result.businessType).toBeNull();
      expect(result.businessCategory).toBeNull();
      expect(result.contactPerson).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.email).toBeNull();
      expect(result.address).toBeNull();
      expect(result.bankAccount).toBeNull();
      expect(result.paymentTerms).toBeNull();
    });

    it('should handle undefined optional fields', () => {
      const response = createMockCompanyDetailsResponse({
        registrationNumber: undefined,
        representative: undefined,
      });
      const result = companyMapper.toDomain(response);

      expect(result.registrationNumber).toBeNull();
      expect(result.representative).toBeNull();
    });

    it('should map roles array correctly', () => {
      const roles = [
        createMockRoleResponse({ roleType: 'CUSTOMER' }),
        createMockRoleResponse({ roleType: 'VENDOR' }),
      ];
      const response = createMockCompanyDetailsResponse({ roles });
      const result = companyMapper.toDomain(response);

      expect(result.roles).toHaveLength(2);
      expect(result.roles[0].roleType).toBe('CUSTOMER');
      expect(result.roles[1].roleType).toBe('VENDOR');
    });

    it('should map role fields correctly', () => {
      const role = createMockRoleResponse({
        roleType: 'VENDOR',
        createdAt: '2025-01-20T00:00:00Z',
      });
      const response = createMockCompanyDetailsResponse({ roles: [role] });
      const result = companyMapper.toDomain(response);

      expect(result.roles[0].roleType).toBe('VENDOR');
      expect(result.roles[0].createdAt).toBe('2025-01-20T00:00:00Z');
    });

    it('should default updatedAt to createdAt when null', () => {
      const response = createMockCompanyDetailsResponse({
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: null,
      });
      const result = companyMapper.toDomain(response);

      expect(result.updatedAt).toBe('2025-01-15T00:00:00Z');
    });

    it('should preserve updatedAt when present', () => {
      const response = createMockCompanyDetailsResponse({
        updatedAt: '2025-01-20T00:00:00Z',
      });
      const result = companyMapper.toDomain(response);

      expect(result.updatedAt).toBe('2025-01-20T00:00:00Z');
    });

    it('should handle empty roles array', () => {
      const response = createMockCompanyDetailsResponse({ roles: [] });
      const result = companyMapper.toDomain(response);

      expect(result.roles).toEqual([]);
    });
  });

  // ==========================================================================
  // toListItem Tests
  // ==========================================================================

  describe('toListItem()', () => {
    it('should map only list-relevant fields', () => {
      const response = createMockCompanySummaryResponse();
      const result = companyMapper.toListItem(response);

      expectDomainShape(result, [
        'id',
        'name',
        'registrationNumber',
        'contactPerson',
        'phone',
        'email',
        'roles',
        'isActive',
        'createdAt',
      ]);
    });

    it('should not include representative in list item', () => {
      const response = createMockCompanySummaryResponse();
      const result = companyMapper.toListItem(response);

      expect(result).not.toHaveProperty('representative');
    });

    it('should not include address in list item', () => {
      const response = createMockCompanySummaryResponse();
      const result = companyMapper.toListItem(response);

      expect(result).not.toHaveProperty('address');
    });

    it('should not include bankAccount in list item', () => {
      const response = createMockCompanySummaryResponse();
      const result = companyMapper.toListItem(response);

      expect(result).not.toHaveProperty('bankAccount');
    });

    it('should handle null optional fields', () => {
      const response = createMockCompanySummaryResponse({
        registrationNumber: null,
        contactPerson: null,
        phone: null,
        email: null,
      });
      const result = companyMapper.toListItem(response);

      expect(result.registrationNumber).toBeNull();
      expect(result.contactPerson).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.email).toBeNull();
    });

    it('should map roles array correctly', () => {
      const roles = [
        createMockRoleResponse({ roleType: 'CUSTOMER' }),
        createMockRoleResponse({ roleType: 'OUTSOURCE' }),
      ];
      const response = createMockCompanySummaryResponse({ roles });
      const result = companyMapper.toListItem(response);

      expect(result.roles).toHaveLength(2);
      expect(result.roles[0].roleType).toBe('CUSTOMER');
      expect(result.roles[1].roleType).toBe('OUTSOURCE');
    });

    it('should preserve isActive status', () => {
      const response = createMockCompanySummaryResponse({ isActive: false });
      const result = companyMapper.toListItem(response);

      expect(result.isActive).toBe(false);
    });
  });
});
