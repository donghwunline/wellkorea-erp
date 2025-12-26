/**
 * Unit tests for companyService.
 * Tests company CRUD operations, role management, pagination handling, and error propagation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { companyService } from './companyService';
import { createMockPagedResponse, createMockApiError } from '@/test/fixtures';
import type {
  AddRoleRequest,
  CompanyDetails,
  CompanySummary,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from './types';
import { httpClient } from '@/api';

// Mock httpClient with inline factory (vi.mock is hoisted)
vi.mock('@/api', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    requestWithMeta: vi.fn(),
  },
  COMPANY_ENDPOINTS: {
    BASE: '/companies',
    byId: (id: number) => `/companies/${id}`,
    roles: (id: number) => `/companies/${id}/roles`,
    role: (id: number, roleId: number) => `/companies/${id}/roles/${roleId}`,
  },
}));

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockCompanySummary(overrides?: Partial<CompanySummary>): CompanySummary {
  return {
    id: 1,
    name: 'Test Company',
    registrationNumber: '123-45-67890',
    contactPerson: 'John Doe',
    phone: '02-1234-5678',
    email: 'contact@test.com',
    roles: [{ id: 1, roleType: 'CUSTOMER', creditLimit: null, defaultPaymentDays: null, notes: null, createdAt: '2025-01-01T00:00:00Z' }],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function createMockCompanyDetails(overrides?: Partial<CompanyDetails>): CompanyDetails {
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
    address: '123 Test Street',
    bankAccount: 'Test Bank 123-456-789',
    paymentTerms: 'Net 30',
    roles: [{ id: 1, roleType: 'CUSTOMER', creditLimit: null, defaultPaymentDays: null, notes: null, createdAt: '2025-01-01T00:00:00Z' }],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

const mockApiErrors = {
  notFound: createMockApiError(404, 'RES_001', 'Resource not found'),
  serverError: createMockApiError(500, 'SERVER_001', 'Internal server error'),
  validation: createMockApiError(400, 'VAL_001', 'Validation failed'),
  forbidden: createMockApiError(403, 'AUTH_005', 'Insufficient permissions'),
};

// ============================================================================
// Tests
// ============================================================================

describe('companyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // QUERY OPERATIONS
  // ==========================================================================

  describe('getCompanies', () => {
    it('should fetch paginated companies and transform data', async () => {
      // Given: Mock paginated response
      const mockCompany = createMockCompanySummary();
      const mockResponse = createMockPagedResponse([mockCompany]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get companies
      const result = await companyService.getCompanies({ page: 0, size: 10 });

      // Then: Calls httpClient with correct params
      expect(httpClient.requestWithMeta).toHaveBeenCalledOnce();
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/companies',
        params: { page: 0, size: 10 },
      });

      // And: Returns paginated data
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockCompany);
      expect(result.pagination.totalElements).toBe(1);
    });

    it('should handle role type filtering', async () => {
      // Given: Empty response
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get companies with role filter
      await companyService.getCompanies({
        page: 0,
        size: 10,
        roleType: 'CUSTOMER',
      });

      // Then: Passes roleType param
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/companies',
        params: { page: 0, size: 10, roleType: 'CUSTOMER' },
      });
    });

    it('should handle search parameter', async () => {
      // Given: Empty response
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get companies with search
      await companyService.getCompanies({
        page: 0,
        size: 10,
        search: 'samsung',
      });

      // Then: Passes search param
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/companies',
        params: { page: 0, size: 10, search: 'samsung' },
      });
    });

    it('should handle empty results', async () => {
      // Given: Empty response
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get companies
      const result = await companyService.getCompanies();

      // Then: Returns empty array
      expect(result.data).toEqual([]);
      expect(result.pagination.totalElements).toBe(0);
    });

    it('should handle companies with multiple roles', async () => {
      // Given: Company with multiple roles
      const mockCompany = createMockCompanySummary({
        roles: [
          { id: 1, roleType: 'CUSTOMER', creditLimit: null, defaultPaymentDays: null, notes: null, createdAt: '2025-01-01T00:00:00Z' },
          { id: 2, roleType: 'VENDOR', creditLimit: 50000, defaultPaymentDays: 30, notes: 'Preferred vendor', createdAt: '2025-01-01T00:00:00Z' },
        ],
      });
      const mockResponse = createMockPagedResponse([mockCompany]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get companies
      const result = await companyService.getCompanies();

      // Then: Returns company with all roles
      expect(result.data[0].roles).toHaveLength(2);
      expect(result.data[0].roles[0].roleType).toBe('CUSTOMER');
      expect(result.data[0].roles[1].roleType).toBe('VENDOR');
    });

    it('should propagate API errors', async () => {
      // Given: API error
      vi.mocked(httpClient.requestWithMeta).mockRejectedValue(mockApiErrors.serverError);

      // When/Then: Propagates error
      await expect(companyService.getCompanies()).rejects.toEqual(mockApiErrors.serverError);
    });
  });

  describe('getCompany', () => {
    it('should fetch single company by ID', async () => {
      // Given: Mock company response
      const mockCompany = createMockCompanyDetails({ id: 123 });
      vi.mocked(httpClient.get).mockResolvedValue(mockCompany);

      // When: Get company by ID
      const result = await companyService.getCompany(123);

      // Then: Calls httpClient with correct URL
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/companies/123');

      // And: Returns company details
      expect(result.id).toBe(123);
      expect(result.name).toBe('Test Company');
    });

    it('should return all company fields', async () => {
      // Given: Full company details
      const mockCompany = createMockCompanyDetails({
        representative: 'CEO Test',
        businessType: 'Service',
        businessCategory: 'IT',
        bankAccount: 'Bank ABC 999-888-777',
        paymentTerms: 'Net 60',
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockCompany);

      // When: Get company
      const result = await companyService.getCompany(1);

      // Then: All fields are returned
      expect(result.representative).toBe('CEO Test');
      expect(result.businessType).toBe('Service');
      expect(result.businessCategory).toBe('IT');
      expect(result.bankAccount).toBe('Bank ABC 999-888-777');
      expect(result.paymentTerms).toBe('Net 60');
    });

    it('should propagate 404 errors', async () => {
      // Given: Company not found
      vi.mocked(httpClient.get).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(companyService.getCompany(999)).rejects.toEqual(mockApiErrors.notFound);
    });
  });

  // ==========================================================================
  // COMMAND OPERATIONS
  // ==========================================================================

  describe('createCompany', () => {
    it('should create company and return command result', async () => {
      // Given: Create request
      const createRequest: CreateCompanyRequest = {
        name: 'New Company',
        registrationNumber: '111-22-33333',
        representative: 'New CEO',
        businessType: 'Manufacturing',
        businessCategory: 'Automotive',
        contactPerson: 'Jane Doe',
        phone: '031-1111-2222',
        email: 'new@company.com',
        address: '456 New Street',
        bankAccount: 'New Bank 111-222-333',
        paymentTerms: 'Net 45',
        roles: ['CUSTOMER', 'VENDOR'],
      };

      const mockResult = { id: 100, message: 'Company created successfully' };
      vi.mocked(httpClient.post).mockResolvedValue(mockResult);

      // When: Create company
      const result = await companyService.createCompany(createRequest);

      // Then: Calls httpClient.post with correct data
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/companies', createRequest);

      // And: Returns command result (CQRS pattern)
      expect(result.id).toBe(100);
      expect(result.message).toBe('Company created successfully');
    });

    it('should handle minimal required fields', async () => {
      // Given: Minimal create request
      const createRequest: CreateCompanyRequest = {
        name: 'Minimal Company',
        roles: ['OUTSOURCE'],
      };

      const mockResult = { id: 101, message: 'Company created' };
      vi.mocked(httpClient.post).mockResolvedValue(mockResult);

      // When: Create company
      const result = await companyService.createCompany(createRequest);

      // Then: Successfully creates with minimal data
      expect(httpClient.post).toHaveBeenCalledWith('/companies', createRequest);
      expect(result.id).toBe(101);
    });

    it('should propagate validation errors', async () => {
      // Given: Validation error (duplicate name)
      vi.mocked(httpClient.post).mockRejectedValue(mockApiErrors.validation);

      // When/Then: Propagates validation error
      const request: CreateCompanyRequest = {
        name: 'Duplicate Company',
        roles: ['CUSTOMER'],
      };
      await expect(companyService.createCompany(request)).rejects.toEqual(mockApiErrors.validation);
    });
  });

  describe('updateCompany', () => {
    it('should update company and return command result', async () => {
      // Given: Update request
      const updateRequest: UpdateCompanyRequest = {
        name: 'Updated Company Name',
        contactPerson: 'Updated Contact',
        phone: '02-9999-8888',
      };

      const mockResult = { id: 50, message: 'Company updated successfully' };
      vi.mocked(httpClient.put).mockResolvedValue(mockResult);

      // When: Update company
      const result = await companyService.updateCompany(50, updateRequest);

      // Then: Calls httpClient.put with correct URL and data
      expect(httpClient.put).toHaveBeenCalledOnce();
      expect(httpClient.put).toHaveBeenCalledWith('/companies/50', updateRequest);

      // And: Returns command result
      expect(result.id).toBe(50);
      expect(result.message).toBe('Company updated successfully');
    });

    it('should handle partial updates', async () => {
      // Given: Partial update (only email)
      const updateRequest: UpdateCompanyRequest = {
        email: 'newemail@company.com',
      };

      const mockResult = { id: 25, message: 'Company updated' };
      vi.mocked(httpClient.put).mockResolvedValue(mockResult);

      // When: Update company
      await companyService.updateCompany(25, updateRequest);

      // Then: Sends only updated fields
      expect(httpClient.put).toHaveBeenCalledWith('/companies/25', { email: 'newemail@company.com' });
    });

    it('should propagate 404 errors', async () => {
      // Given: Company not found
      vi.mocked(httpClient.put).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      const request: UpdateCompanyRequest = { name: 'Test' };
      await expect(companyService.updateCompany(999, request)).rejects.toEqual(mockApiErrors.notFound);
    });
  });

  describe('deleteCompany', () => {
    it('should delete (deactivate) company', async () => {
      // Given: Mock delete success
      vi.mocked(httpClient.delete).mockResolvedValue(undefined);

      // When: Delete company
      await companyService.deleteCompany(30);

      // Then: Calls httpClient.delete with correct URL
      expect(httpClient.delete).toHaveBeenCalledOnce();
      expect(httpClient.delete).toHaveBeenCalledWith('/companies/30');
    });

    it('should propagate 404 errors', async () => {
      // Given: Company not found
      vi.mocked(httpClient.delete).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(companyService.deleteCompany(999)).rejects.toEqual(mockApiErrors.notFound);
    });

    it('should propagate forbidden errors', async () => {
      // Given: Not authorized to delete
      vi.mocked(httpClient.delete).mockRejectedValue(mockApiErrors.forbidden);

      // When/Then: Propagates forbidden
      await expect(companyService.deleteCompany(1)).rejects.toEqual(mockApiErrors.forbidden);
    });
  });

  // ==========================================================================
  // ROLE MANAGEMENT
  // ==========================================================================

  describe('addRole', () => {
    it('should add role to company', async () => {
      // Given: Add role request
      const addRoleRequest: AddRoleRequest = {
        roleType: 'VENDOR',
        creditLimit: 100000,
        defaultPaymentDays: 30,
        notes: 'Preferred vendor',
      };

      const mockResult = { id: 5, message: 'Role added successfully' };
      vi.mocked(httpClient.post).mockResolvedValue(mockResult);

      // When: Add role
      const result = await companyService.addRole(10, addRoleRequest);

      // Then: Calls httpClient.post with correct URL and data
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/companies/10/roles', addRoleRequest);

      // And: Returns role ID
      expect(result.id).toBe(5);
    });

    it('should handle minimal role request', async () => {
      // Given: Minimal add role request
      const addRoleRequest: AddRoleRequest = {
        roleType: 'OUTSOURCE',
      };

      const mockResult = { id: 6, message: 'Role added' };
      vi.mocked(httpClient.post).mockResolvedValue(mockResult);

      // When: Add role
      await companyService.addRole(20, addRoleRequest);

      // Then: Sends request
      expect(httpClient.post).toHaveBeenCalledWith('/companies/20/roles', addRoleRequest);
    });

    it('should propagate validation errors (duplicate role)', async () => {
      // Given: Duplicate role error
      vi.mocked(httpClient.post).mockRejectedValue(mockApiErrors.validation);

      // When/Then: Propagates validation error
      const request: AddRoleRequest = { roleType: 'CUSTOMER' };
      await expect(companyService.addRole(1, request)).rejects.toEqual(mockApiErrors.validation);
    });
  });

  describe('removeRole', () => {
    it('should remove role from company', async () => {
      // Given: Mock delete success
      vi.mocked(httpClient.delete).mockResolvedValue(undefined);

      // When: Remove role
      await companyService.removeRole(10, 5);

      // Then: Calls httpClient.delete with correct URL
      expect(httpClient.delete).toHaveBeenCalledOnce();
      expect(httpClient.delete).toHaveBeenCalledWith('/companies/10/roles/5');
    });

    it('should propagate validation errors (last role)', async () => {
      // Given: Cannot remove last role
      vi.mocked(httpClient.delete).mockRejectedValue(mockApiErrors.validation);

      // When/Then: Propagates validation error
      await expect(companyService.removeRole(1, 1)).rejects.toEqual(mockApiErrors.validation);
    });

    it('should propagate 404 errors (role not found)', async () => {
      // Given: Role not found
      vi.mocked(httpClient.delete).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(companyService.removeRole(1, 999)).rejects.toEqual(mockApiErrors.notFound);
    });
  });
});
