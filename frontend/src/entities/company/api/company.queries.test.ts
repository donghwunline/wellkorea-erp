/**
 * Company Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { companyQueries, type CompanyListQueryParams } from './company.queries';
import { expectValidQueryOptions, expectQueryKey, invokeQueryFn } from '@/test/entity-test-utils';
import type { Paginated } from '@/shared/lib/pagination';
import type { CompanySummaryResponse, CompanyDetailsResponse } from './company.mapper';

// Mock dependencies
vi.mock('./get-company', () => ({
  getCompany: vi.fn(),
  getCompanies: vi.fn(),
}));

vi.mock('./company.mapper', () => ({
  companyMapper: {
    toDomain: vi.fn((response) => ({ ...response, _mapped: true })),
    toListItem: vi.fn((response) => ({ id: response.id, name: response.name })),
  },
}));

// Import mocked modules
import { getCompany, getCompanies } from './get-company';
import { companyMapper } from './company.mapper';

// =============================================================================
// Test Fixtures - Minimal Response objects to satisfy TypeScript
// =============================================================================

function createMockCompanySummaryResponse(
  overrides: Partial<CompanySummaryResponse> = {}
): CompanySummaryResponse {
  return {
    id: 1,
    name: '',
    roles: [],
    isActive: true,
    createdAt: '',
    ...overrides,
  };
}

function createMockCompanyDetailsResponse(
  overrides: Partial<CompanyDetailsResponse> = {}
): CompanyDetailsResponse {
  return {
    id: 1,
    name: '',
    roles: [],
    isActive: true,
    createdAt: '',
    ...overrides,
  };
}

function createMockPaginatedCompanies(
  data: CompanySummaryResponse[]
): Paginated<CompanySummaryResponse> {
  return {
    data,
    pagination: { page: 0, size: 10, totalElements: data.length, totalPages: 1, first: true, last: true },
  };
}

describe('companyQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(companyQueries.all(), ['companies']);
      });
    });

    describe('lists()', () => {
      it('should return list query key with "list" segment', () => {
        expectQueryKey(companyQueries.lists(), ['companies', 'list']);
      });
    });

    describe('details()', () => {
      it('should return detail query key segment', () => {
        expectQueryKey(companyQueries.details(), ['companies', 'detail']);
      });
    });
  });

  // ==========================================================================
  // List Query Tests
  // ==========================================================================

  describe('list()', () => {
    const defaultParams: CompanyListQueryParams = {
      page: 0,
      size: 10,
      search: '',
      roleType: null,
    };

    it('should return valid queryOptions', () => {
      const options = companyQueries.list(defaultParams);
      expectValidQueryOptions(options);
    });

    it('should include all params in query key for cache separation', () => {
      const params: CompanyListQueryParams = {
        page: 1,
        size: 20,
        search: 'test',
        roleType: 'CUSTOMER',
      };
      const options = companyQueries.list(params);

      expect(options.queryKey).toEqual([
        'companies',
        'list',
        1,
        20,
        'test',
        'CUSTOMER',
      ]);
    });

    it('should include null values in query key when filters are empty', () => {
      const options = companyQueries.list(defaultParams);

      expect(options.queryKey).toEqual([
        'companies',
        'list',
        0,
        10,
        '',
        null,
      ]);
    });

    it('should have placeholderData set for smooth transitions', () => {
      const options = companyQueries.list(defaultParams);
      expect(options.placeholderData).toBeDefined();
    });

    it('should call getCompanies with correct params in queryFn', async () => {
      const mockResponse = createMockPaginatedCompanies([
        createMockCompanySummaryResponse({ id: 1, name: 'Test Company' }),
      ]);
      vi.mocked(getCompanies).mockResolvedValue(mockResponse);

      const options = companyQueries.list(defaultParams);
      await invokeQueryFn(options);

      expect(getCompanies).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        search: undefined, // empty string converted to undefined
        roleType: undefined, // null converted to undefined
      });
    });

    it('should map response data using companyMapper.toListItem', async () => {
      const mockResponse = createMockPaginatedCompanies([
        createMockCompanySummaryResponse({ id: 1, name: 'Company 1' }),
        createMockCompanySummaryResponse({ id: 2, name: 'Company 2' }),
      ]);
      vi.mocked(getCompanies).mockResolvedValue(mockResponse);

      const options = companyQueries.list(defaultParams);
      const result = await invokeQueryFn<Paginated<unknown>>(options);

      expect(companyMapper.toListItem).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual(mockResponse.pagination);
    });

    it('should generate stable query keys for same input', () => {
      const params1: CompanyListQueryParams = { page: 0, size: 10, search: 'test', roleType: 'CUSTOMER' };
      const params2: CompanyListQueryParams = { page: 0, size: 10, search: 'test', roleType: 'CUSTOMER' };

      const key1 = companyQueries.list(params1).queryKey;
      const key2 = companyQueries.list(params2).queryKey;

      expect(key1).toEqual(key2);
    });
  });

  // ==========================================================================
  // Detail Query Tests
  // ==========================================================================

  describe('detail()', () => {
    it('should return valid queryOptions', () => {
      const options = companyQueries.detail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = companyQueries.detail(123);
      expect(options.queryKey).toEqual(['companies', 'detail', 123]);
    });

    it('should have 5-minute staleTime', () => {
      const options = companyQueries.detail(1);
      expect(options.staleTime).toBe(1000 * 60 * 5);
    });

    it('should call getCompany with correct id in queryFn', async () => {
      const mockResponse = createMockCompanyDetailsResponse({ id: 123, name: 'Test Company' });
      vi.mocked(getCompany).mockResolvedValue(mockResponse);

      const options = companyQueries.detail(123);
      await invokeQueryFn(options);

      expect(getCompany).toHaveBeenCalledWith(123);
    });

    it('should map response using companyMapper.toDomain', async () => {
      const mockResponse = createMockCompanyDetailsResponse({ id: 123, name: 'Test Company' });
      vi.mocked(getCompany).mockResolvedValue(mockResponse);

      const options = companyQueries.detail(123);
      const result = await invokeQueryFn(options);

      expect(companyMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual({ ...mockResponse, _mapped: true });
    });

    it('should generate different query keys for different ids', () => {
      const key1 = companyQueries.detail(1).queryKey;
      const key2 = companyQueries.detail(2).queryKey;

      expect(key1).not.toEqual(key2);
      expect(key1[2]).toBe(1);
      expect(key2[2]).toBe(2);
    });
  });
});
