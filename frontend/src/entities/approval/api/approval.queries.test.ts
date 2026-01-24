/**
 * Approval Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { approvalQueries, type ApprovalListQueryParams } from './approval.queries';
import { expectValidQueryOptions, expectQueryKey, invokeQueryFn } from '@/test/entity-test-utils';

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
import type { ApprovalDetailsResponse, ApprovalHistoryResponse } from './approval.mapper';
import type { Paginated } from '@/shared/lib/pagination';

// =============================================================================
// Test Fixtures - Minimal Response objects to satisfy TypeScript
// =============================================================================

function createMockApprovalResponse(
  overrides: Partial<ApprovalDetailsResponse> = {}
): ApprovalDetailsResponse {
  return {
    id: 1,
    entityType: 'QUOTATION',
    entityId: 1,
    entityDescription: '',
    currentLevel: 1,
    totalLevels: 2,
    status: 'PENDING',
    submittedById: 1,
    submittedByName: '',
    submittedAt: '',
    completedAt: null,
    createdAt: '',
    levels: null,
    ...overrides,
  };
}

function createMockApprovalHistoryResponse(
  overrides: Partial<ApprovalHistoryResponse> = {}
): ApprovalHistoryResponse {
  return {
    levelOrder: 1,
    levelName: '',
    action: 'SUBMITTED',
    actorId: 1,
    actorName: '',
    comments: null,
    createdAt: '',
    ...overrides,
  };
}

function createMockPaginatedApprovals(
  data: ApprovalDetailsResponse[]
): Paginated<ApprovalDetailsResponse> {
  return {
    data,
    pagination: { page: 0, size: 10, totalElements: data.length, totalPages: 1, first: true, last: true },
  };
}

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
      const mockResponse = createMockPaginatedApprovals([createMockApprovalResponse()]);
      vi.mocked(getApprovals).mockResolvedValue(mockResponse);

      const params: ApprovalListQueryParams = {
        page: 0,
        size: 10,
        entityType: 'QUOTATION',
        status: 'PENDING',
        myPending: true,
      };
      const options = approvalQueries.list(params);
      await invokeQueryFn(options);

      expect(getApprovals).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        entityType: 'QUOTATION',
        status: 'PENDING',
        myPending: true,
      });
    });

    it('should convert null/undefined params to undefined in API call', async () => {
      const mockResponse = createMockPaginatedApprovals([]);
      vi.mocked(getApprovals).mockResolvedValue(mockResponse);

      const options = approvalQueries.list({});
      await invokeQueryFn(options);

      expect(getApprovals).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        entityType: undefined,
        status: undefined,
        myPending: undefined,
      });
    });

    it('should map response data using approvalMapper.toDomain', async () => {
      const mockResponse = createMockPaginatedApprovals([
        createMockApprovalResponse({ id: 1 }),
        createMockApprovalResponse({ id: 2 }),
      ]);
      vi.mocked(getApprovals).mockResolvedValue(mockResponse);

      const options = approvalQueries.list(defaultParams);
      const result = await invokeQueryFn<Paginated<unknown>>(options);

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
      const mockResponse = createMockApprovalResponse({ id: 123 });
      vi.mocked(getApproval).mockResolvedValue(mockResponse);

      const options = approvalQueries.detail(123);
      await invokeQueryFn(options);

      expect(getApproval).toHaveBeenCalledWith(123);
    });

    it('should map response using approvalMapper.toDomain', async () => {
      const mockResponse = createMockApprovalResponse({ id: 123 });
      vi.mocked(getApproval).mockResolvedValue(mockResponse);

      const options = approvalQueries.detail(123);
      const result = await invokeQueryFn(options);

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
        createMockApprovalHistoryResponse({ action: 'SUBMITTED' }),
        createMockApprovalHistoryResponse({ action: 'APPROVED' }),
      ];
      vi.mocked(getApprovalHistory).mockResolvedValue(mockResponses);

      const options = approvalQueries.history(123);
      await invokeQueryFn(options);

      expect(getApprovalHistory).toHaveBeenCalledWith(123);
    });

    it('should map each history item using approvalHistoryMapper.toDomain', async () => {
      const mockResponses = [
        createMockApprovalHistoryResponse({ levelOrder: 1 }),
        createMockApprovalHistoryResponse({ levelOrder: 2 }),
      ];
      vi.mocked(getApprovalHistory).mockResolvedValue(mockResponses);

      const options = approvalQueries.history(123);
      const result = await invokeQueryFn<unknown[]>(options);

      expect(approvalHistoryMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });
});
