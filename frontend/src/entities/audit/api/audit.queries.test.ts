/**
 * Audit Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { auditQueries, type AuditListQueryParams } from './audit.queries';
import { expectValidQueryOptions, expectQueryKey, invokeQueryFn } from '@/test/entity-test-utils';

// Mock dependencies
vi.mock('./get-audit-list', () => ({
  getAuditList: vi.fn(),
}));

vi.mock('./get-audit-by-id', () => ({
  getAuditById: vi.fn(),
}));

vi.mock('./audit.mapper', () => ({
  auditLogMapper: {
    toDomain: vi.fn((response) => ({ ...response, _mapped: true })),
  },
}));

// Import mocked modules
import { getAuditList } from './get-audit-list';
import { getAuditById } from './get-audit-by-id';
import { auditLogMapper } from './audit.mapper';
import type { AuditLogResponse } from './audit.mapper';
import type { Paginated } from '@/shared/lib/pagination';

// =============================================================================
// Test Fixtures - Minimal Response objects to satisfy TypeScript
// =============================================================================

function createMockAuditLogResponse(
  overrides: Partial<AuditLogResponse> = {}
): AuditLogResponse {
  return {
    id: 1,
    entityType: '',
    entityId: null,
    action: '',
    userId: null,
    username: null,
    ipAddress: null,
    changes: null,
    metadata: null,
    createdAt: '',
    ...overrides,
  };
}

function createMockPaginatedAuditLogs(
  data: AuditLogResponse[]
): Paginated<AuditLogResponse> {
  return {
    data,
    pagination: { page: 0, size: 10, totalElements: data.length, totalPages: 1, first: true, last: true },
  };
}

describe('auditQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(auditQueries.all(), ['audit']);
      });
    });

    describe('lists()', () => {
      it('should return list query key with "list" segment', () => {
        expectQueryKey(auditQueries.lists(), ['audit', 'list']);
      });
    });

    describe('details()', () => {
      it('should return detail query key segment', () => {
        expectQueryKey(auditQueries.details(), ['audit', 'detail']);
      });
    });
  });

  // ==========================================================================
  // List Query Tests
  // ==========================================================================

  describe('list()', () => {
    const defaultParams: AuditListQueryParams = {};

    it('should return valid queryOptions', () => {
      const options = auditQueries.list(defaultParams);
      expectValidQueryOptions(options);
    });

    it('should include all params in query key for cache separation', () => {
      const params: AuditListQueryParams = {
        page: 1,
        size: 20,
        sort: 'createdAt,desc',
        username: 'john.doe',
        action: 'CREATE',
        entityType: 'QUOTATION',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      const options = auditQueries.list(params);

      expect(options.queryKey).toEqual([
        'audit',
        'list',
        1,
        20,
        'createdAt,desc',
        'john.doe',
        'CREATE',
        'QUOTATION',
        '2025-01-01',
        '2025-01-31',
      ]);
    });

    it('should include default values in query key when params are empty', () => {
      const options = auditQueries.list({});

      expect(options.queryKey).toEqual([
        'audit',
        'list',
        0,
        10,
        '',
        '',
        '',
        '',
        '',
        '',
      ]);
    });

    it('should have placeholderData set for smooth transitions', () => {
      const options = auditQueries.list(defaultParams);
      expect(options.placeholderData).toBeDefined();
    });

    it('should call getAuditList with correct params in queryFn', async () => {
      const mockResponse = createMockPaginatedAuditLogs([createMockAuditLogResponse()]);
      vi.mocked(getAuditList).mockResolvedValue(mockResponse);

      const params: AuditListQueryParams = {
        page: 0,
        size: 10,
        username: 'john',
        action: 'CREATE',
      };
      const options = auditQueries.list(params);
      await invokeQueryFn(options);

      expect(getAuditList).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        sort: undefined,
        username: 'john',
        action: 'CREATE',
        entityType: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should map response data using auditLogMapper.toDomain', async () => {
      const mockResponse = createMockPaginatedAuditLogs([
        createMockAuditLogResponse({ id: 1 }),
        createMockAuditLogResponse({ id: 2 }),
      ]);
      vi.mocked(getAuditList).mockResolvedValue(mockResponse);

      const options = auditQueries.list(defaultParams);
      const result = await invokeQueryFn<Paginated<unknown>>(options);

      expect(auditLogMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual(mockResponse.pagination);
    });
  });

  // ==========================================================================
  // Detail Query Tests
  // ==========================================================================

  describe('detail()', () => {
    it('should return valid queryOptions', () => {
      const options = auditQueries.detail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = auditQueries.detail(123);
      expect(options.queryKey).toEqual(['audit', 'detail', 123]);
    });

    it('should be enabled when id > 0', () => {
      const options = auditQueries.detail(123);
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when id is 0', () => {
      const options = auditQueries.detail(0);
      expect(options.enabled).toBe(false);
    });

    it('should be disabled when id is negative', () => {
      const options = auditQueries.detail(-1);
      expect(options.enabled).toBe(false);
    });

    it('should call getAuditById with correct id in queryFn', async () => {
      const mockResponse = createMockAuditLogResponse({ id: 123 });
      vi.mocked(getAuditById).mockResolvedValue(mockResponse);

      const options = auditQueries.detail(123);
      await invokeQueryFn(options);

      expect(getAuditById).toHaveBeenCalledWith(123);
    });

    it('should map response using auditLogMapper.toDomain', async () => {
      const mockResponse = createMockAuditLogResponse({ id: 123 });
      vi.mocked(getAuditById).mockResolvedValue(mockResponse);

      const options = auditQueries.detail(123);
      const result = await invokeQueryFn(options);

      expect(auditLogMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual({ ...mockResponse, _mapped: true });
    });
  });
});
