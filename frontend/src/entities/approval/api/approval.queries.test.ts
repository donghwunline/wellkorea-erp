/**
 * Approval Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { approvalQueries, type ApprovalListQueryParams } from './approval.queries';
import { expectValidQueryOptions, expectQueryKey } from '@/test/entity-test-utils';

// Mock dependencies
vi.mock('./get-approval', () => ({
  getApproval: vi.fn(),
  getApprovals: vi.fn(),
}));

vi.mock('./get-approval-history', () => ({
  getApprovalHistory: vi.fn(),
}));

vi.mock('./approval.mapper', () => ({
  approvalMapper: {
    toDomain: vi.fn((response) => ({ ...response, _mapped: true })),
  },
  approvalHistoryMapper: {
    toDomain: vi.fn((response) => ({ ...response, _historyMapped: true })),
  },
}));

// Import mocked modules
import { getApproval, getApprovals } from './get-approval';
import { getApprovalHistory } from './get-approval-history';
import { approvalMapper, approvalHistoryMapper } from './approval.mapper';

describe('approvalQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(approvalQueries.all(), ['approvals']);
      });
    });

    describe('lists()', () => {
      it('should return list query key with "list" segment', () => {
        expectQueryKey(approvalQueries.lists(), ['approvals', 'list']);
      });
    });

    describe('details()', () => {
      it('should return detail query key segment', () => {
        expectQueryKey(approvalQueries.details(), ['approvals', 'detail']);
      });
    });

    describe('histories()', () => {
      it('should return history query key segment', () => {
        expectQueryKey(approvalQueries.histories(), ['approvals', 'history']);
      });
    });
  });

  // ==========================================================================
  // List Query Tests
  // ==========================================================================

  describe('list()', () => {
    const defaultParams: ApprovalListQueryParams = {};

    it('should return valid queryOptions', () => {
      const options = approvalQueries.list(defaultParams);
      expectValidQueryOptions(options);
    });

    it('should include all params in query key for cache separation', () => {
      const params: ApprovalListQueryParams = {
        page: 1,
        size: 20,
        entityType: 'QUOTATION',
        status: 'PENDING',
        myPending: true,
      };
      const options = approvalQueries.list(params);

      expect(options.queryKey).toEqual([
        'approvals',
        'list',
        1,
        20,
        'QUOTATION',
        'PENDING',
        true,
      ]);
    });

    it('should include default values in query key when params are empty', () => {
      const options = approvalQueries.list({});

      expect(options.queryKey).toEqual([
        'approvals',
        'list',
        0,
        10,
        null,
        null,
        false,
      ]);
    });

    it('should have placeholderData set for smooth transitions', () => {
      const options = approvalQueries.list(defaultParams);
      expect(options.placeholderData).toBeDefined();
    });

    it('should call getApprovals with correct params in queryFn', async () => {
      const mockResponse = {
        data: [{ id: 1, entityType: 'QUOTATION', status: 'PENDING' }],
        pagination: { page: 0, size: 10, totalElements: 1, totalPages: 1 },
      };
      vi.mocked(getApprovals).mockResolvedValue(mockResponse);

      const params: ApprovalListQueryParams = {
        page: 0,
        size: 10,
        entityType: 'QUOTATION',
        status: 'PENDING',
        myPending: true,
      };
      const options = approvalQueries.list(params);
      await options.queryFn();

      expect(getApprovals).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        entityType: 'QUOTATION',
        status: 'PENDING',
        myPending: true,
      });
    });

    it('should convert null/undefined params to undefined in API call', async () => {
      const mockResponse = {
        data: [],
        pagination: { page: 0, size: 10, totalElements: 0, totalPages: 0 },
      };
      vi.mocked(getApprovals).mockResolvedValue(mockResponse);

      const options = approvalQueries.list({});
      await options.queryFn();

      expect(getApprovals).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        entityType: undefined,
        status: undefined,
        myPending: undefined,
      });
    });

    it('should map response data using approvalMapper.toDomain', async () => {
      const mockResponse = {
        data: [
          { id: 1, entityType: 'QUOTATION' },
          { id: 2, entityType: 'PROJECT' },
        ],
        pagination: { page: 0, size: 10, totalElements: 2, totalPages: 1 },
      };
      vi.mocked(getApprovals).mockResolvedValue(mockResponse);

      const options = approvalQueries.list(defaultParams);
      const result = await options.queryFn();

      expect(approvalMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual(mockResponse.pagination);
    });
  });

  // ==========================================================================
  // Detail Query Tests
  // ==========================================================================

  describe('detail()', () => {
    it('should return valid queryOptions', () => {
      const options = approvalQueries.detail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = approvalQueries.detail(123);
      expect(options.queryKey).toEqual(['approvals', 'detail', 123]);
    });

    it('should be enabled when id > 0', () => {
      const options = approvalQueries.detail(123);
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when id is 0', () => {
      const options = approvalQueries.detail(0);
      expect(options.enabled).toBe(false);
    });

    it('should be disabled when id is negative', () => {
      const options = approvalQueries.detail(-1);
      expect(options.enabled).toBe(false);
    });

    it('should call getApproval with correct id in queryFn', async () => {
      const mockResponse = { id: 123, entityType: 'QUOTATION', status: 'PENDING' };
      vi.mocked(getApproval).mockResolvedValue(mockResponse);

      const options = approvalQueries.detail(123);
      await options.queryFn();

      expect(getApproval).toHaveBeenCalledWith(123);
    });

    it('should map response using approvalMapper.toDomain', async () => {
      const mockResponse = { id: 123, entityType: 'QUOTATION' };
      vi.mocked(getApproval).mockResolvedValue(mockResponse);

      const options = approvalQueries.detail(123);
      const result = await options.queryFn();

      expect(approvalMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual({ ...mockResponse, _mapped: true });
    });
  });

  // ==========================================================================
  // History Query Tests
  // ==========================================================================

  describe('history()', () => {
    it('should return valid queryOptions', () => {
      const options = approvalQueries.history(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = approvalQueries.history(123);
      expect(options.queryKey).toEqual(['approvals', 'history', 123]);
    });

    it('should be enabled when id > 0', () => {
      const options = approvalQueries.history(123);
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when id is 0', () => {
      const options = approvalQueries.history(0);
      expect(options.enabled).toBe(false);
    });

    it('should call getApprovalHistory with correct id in queryFn', async () => {
      const mockResponses = [
        { id: 1, action: 'SUBMITTED', actorName: 'John' },
        { id: 2, action: 'APPROVED', actorName: 'Jane' },
      ];
      vi.mocked(getApprovalHistory).mockResolvedValue(mockResponses);

      const options = approvalQueries.history(123);
      await options.queryFn();

      expect(getApprovalHistory).toHaveBeenCalledWith(123);
    });

    it('should map each history item using approvalHistoryMapper.toDomain', async () => {
      const mockResponses = [
        { id: 1, action: 'SUBMITTED' },
        { id: 2, action: 'APPROVED' },
      ];
      vi.mocked(getApprovalHistory).mockResolvedValue(mockResponses);

      const options = approvalQueries.history(123);
      const result = await options.queryFn();

      expect(approvalHistoryMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });
});
