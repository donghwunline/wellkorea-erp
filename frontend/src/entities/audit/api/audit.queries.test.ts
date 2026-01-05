/**
 * Audit Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { auditQueries, type AuditListQueryParams } from './audit.queries';
import { expectValidQueryOptions, expectQueryKey } from '@/test/entity-test-utils';

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
      const mockResponse = {
        data: [{ id: 1, action: 'CREATE', entityType: 'QUOTATION' }],
        pagination: { page: 0, size: 10, totalElements: 1, totalPages: 1 },
      };
      vi.mocked(getAuditList).mockResolvedValue(mockResponse);

      const params: AuditListQueryParams = {
        page: 0,
        size: 10,
        username: 'john',
        action: 'CREATE',
      };
      const options = auditQueries.list(params);
      await options.queryFn();

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
      const mockResponse = {
        data: [
          { id: 1, action: 'CREATE' },
          { id: 2, action: 'UPDATE' },
        ],
        pagination: { page: 0, size: 10, totalElements: 2, totalPages: 1 },
      };
      vi.mocked(getAuditList).mockResolvedValue(mockResponse);

      const options = auditQueries.list(defaultParams);
      const result = await options.queryFn();

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
      const mockResponse = { id: 123, action: 'CREATE', entityType: 'PROJECT' };
      vi.mocked(getAuditById).mockResolvedValue(mockResponse);

      const options = auditQueries.detail(123);
      await options.queryFn();

      expect(getAuditById).toHaveBeenCalledWith(123);
    });

    it('should map response using auditLogMapper.toDomain', async () => {
      const mockResponse = { id: 123, action: 'CREATE' };
      vi.mocked(getAuditById).mockResolvedValue(mockResponse);

      const options = auditQueries.detail(123);
      const result = await options.queryFn();

      expect(auditLogMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual({ ...mockResponse, _mapped: true });
    });
  });
});
