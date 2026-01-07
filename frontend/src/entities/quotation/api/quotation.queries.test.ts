/**
 * Quotation Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { quotationQueries, type QuotationListQueryParams } from './quotation.queries';
import { expectValidQueryOptions, expectQueryKey, invokeQueryFn } from '@/test/entity-test-utils';
import type { Paginated } from '@/shared/lib/pagination';
import type { QuotationDetailsResponse } from './quotation.mapper';

// Mock dependencies
vi.mock('./get-quotation', () => ({
  getQuotation: vi.fn(),
  getQuotations: vi.fn(),
}));

vi.mock('./quotation.mapper', () => ({
  quotationMapper: {
    toDomain: vi.fn((response) => ({ ...response, _mapped: true })),
    responseToListItem: vi.fn((response) => ({ id: response.id, status: response.status })),
  },
}));

// Import mocked modules
import { getQuotation, getQuotations } from './get-quotation';
import { quotationMapper } from './quotation.mapper';

// =============================================================================
// Test Fixtures - Minimal Response objects to satisfy TypeScript
// =============================================================================

function createMockQuotationDetailsResponse(
  overrides: Partial<QuotationDetailsResponse> = {}
): QuotationDetailsResponse {
  return {
    id: 1,
    projectId: 1,
    projectName: '',
    jobCode: '',
    version: 1,
    status: 'DRAFT',
    quotationDate: '',
    validityDays: 30,
    expiryDate: '',
    totalAmount: 0,
    notes: null,
    createdById: 1,
    createdByName: '',
    submittedAt: null,
    approvedAt: null,
    approvedById: null,
    approvedByName: null,
    rejectionReason: null,
    createdAt: '',
    updatedAt: '',
    lineItems: null,
    ...overrides,
  };
}

function createMockPaginatedQuotations(
  data: QuotationDetailsResponse[]
): Paginated<QuotationDetailsResponse> {
  return {
    data,
    pagination: { page: 0, size: 10, totalElements: data.length, totalPages: 1, first: true, last: true },
  };
}

describe('quotationQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(quotationQueries.all(), ['quotations']);
      });
    });

    describe('lists()', () => {
      it('should return list query key with "list" segment', () => {
        expectQueryKey(quotationQueries.lists(), ['quotations', 'list']);
      });
    });

    describe('details()', () => {
      it('should return detail query key segment', () => {
        expectQueryKey(quotationQueries.details(), ['quotations', 'detail']);
      });
    });
  });

  // ==========================================================================
  // List Query Tests
  // ==========================================================================

  describe('list()', () => {
    const defaultParams: QuotationListQueryParams = {
      page: 0,
      size: 10,
      search: '',
      status: null,
      projectId: null,
    };

    it('should return valid queryOptions', () => {
      const options = quotationQueries.list(defaultParams);
      expectValidQueryOptions(options);
    });

    it('should include all params in query key for cache separation', () => {
      const params: QuotationListQueryParams = {
        page: 1,
        size: 20,
        search: 'test',
        status: 'DRAFT',
        projectId: 5,
      };
      const options = quotationQueries.list(params);

      expect(options.queryKey).toEqual([
        'quotations',
        'list',
        1,
        20,
        'test',
        'DRAFT',
        5,
      ]);
    });

    it('should include null values in query key when filters are empty', () => {
      const options = quotationQueries.list(defaultParams);

      expect(options.queryKey).toEqual([
        'quotations',
        'list',
        0,
        10,
        '',
        null,
        null,
      ]);
    });

    it('should have placeholderData set for smooth transitions', () => {
      const options = quotationQueries.list(defaultParams);
      expect(options.placeholderData).toBeDefined();
    });

    it('should call getQuotations with correct params in queryFn', async () => {
      const mockResponse = createMockPaginatedQuotations([
        createMockQuotationDetailsResponse({ id: 1, status: 'DRAFT' }),
      ]);
      vi.mocked(getQuotations).mockResolvedValue(mockResponse);

      const options = quotationQueries.list(defaultParams);
      await invokeQueryFn(options);

      expect(getQuotations).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        search: undefined, // empty string converted to undefined
        status: undefined, // null converted to undefined
        projectId: undefined, // null converted to undefined
      });
    });

    it('should map response data using quotationMapper.responseToListItem', async () => {
      const mockResponse = createMockPaginatedQuotations([
        createMockQuotationDetailsResponse({ id: 1, status: 'DRAFT' }),
        createMockQuotationDetailsResponse({ id: 2, status: 'PENDING' }),
      ]);
      vi.mocked(getQuotations).mockResolvedValue(mockResponse);

      const options = quotationQueries.list(defaultParams);
      const result = await invokeQueryFn<Paginated<unknown>>(options);

      expect(quotationMapper.responseToListItem).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual(mockResponse.pagination);
    });

    it('should generate stable query keys for same input', () => {
      const params1: QuotationListQueryParams = { page: 0, size: 10, search: 'test', status: 'DRAFT', projectId: 1 };
      const params2: QuotationListQueryParams = { page: 0, size: 10, search: 'test', status: 'DRAFT', projectId: 1 };

      const key1 = quotationQueries.list(params1).queryKey;
      const key2 = quotationQueries.list(params2).queryKey;

      expect(key1).toEqual(key2);
    });
  });

  // ==========================================================================
  // Detail Query Tests
  // ==========================================================================

  describe('detail()', () => {
    it('should return valid queryOptions', () => {
      const options = quotationQueries.detail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = quotationQueries.detail(123);
      expect(options.queryKey).toEqual(['quotations', 'detail', 123]);
    });

    it('should have 5-minute staleTime', () => {
      const options = quotationQueries.detail(1);
      expect(options.staleTime).toBe(1000 * 60 * 5);
    });

    it('should call getQuotation with correct id in queryFn', async () => {
      const mockResponse = createMockQuotationDetailsResponse({ id: 123, status: 'DRAFT' });
      vi.mocked(getQuotation).mockResolvedValue(mockResponse);

      const options = quotationQueries.detail(123);
      await invokeQueryFn(options);

      expect(getQuotation).toHaveBeenCalledWith(123);
    });

    it('should map response using quotationMapper.toDomain', async () => {
      const mockResponse = createMockQuotationDetailsResponse({ id: 123, status: 'DRAFT', projectName: 'Test' });
      vi.mocked(getQuotation).mockResolvedValue(mockResponse);

      const options = quotationQueries.detail(123);
      const result = await invokeQueryFn(options);

      expect(quotationMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual({ ...mockResponse, _mapped: true });
    });

    it('should generate different query keys for different ids', () => {
      const key1 = quotationQueries.detail(1).queryKey;
      const key2 = quotationQueries.detail(2).queryKey;

      expect(key1).not.toEqual(key2);
      expect(key1[2]).toBe(1);
      expect(key2[2]).toBe(2);
    });
  });
});
