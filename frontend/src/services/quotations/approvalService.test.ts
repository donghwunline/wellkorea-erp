/**
 * Unit tests for approvalService.
 * Tests approval workflow operations, data transformation, and error propagation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { approvalService } from './approvalService';
import {
  createMockApproval,
  createMockHistoryEntry,
  createMockPagedResponse,
  mockApiErrors,
} from '@/test/fixtures';
import type { CommandResult } from './types';
import { httpClient } from '@/api';

// Mock httpClient with inline factory (vi.mock is hoisted)
vi.mock('@/api', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    requestWithMeta: vi.fn(),
  },
  APPROVAL_ENDPOINTS: {
    BASE: '/approvals',
    byId: (id: number) => `/approvals/${id}`,
    approve: (id: number) => `/approvals/${id}/approve`,
    reject: (id: number) => `/approvals/${id}/reject`,
    history: (id: number) => `/approvals/${id}/history`,
  },
}));

describe('approvalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getApprovals', () => {
    it('should fetch paginated approvals and transform data', async () => {
      // Given: Mock paginated response
      const mockApproval = createMockApproval();
      const mockResponse = createMockPagedResponse([mockApproval]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get approvals
      const result = await approvalService.getApprovals({ page: 0, size: 10 });

      // Then: Calls httpClient with correct params
      expect(httpClient.requestWithMeta).toHaveBeenCalledOnce();
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/approvals',
        params: { page: 0, size: 10 },
      });

      // And: Returns paginated data
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockApproval);
      expect(result.pagination.totalElements).toBe(1);
    });

    it('should trim whitespace from text fields', async () => {
      // Given: Response with whitespace
      const mockApproval = createMockApproval({
        entityDescription: '  Test Description  ',
        submittedByName: '  Submitter  ',
      });
      const mockResponse = createMockPagedResponse([mockApproval]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get approvals
      const result = await approvalService.getApprovals();

      // Then: Text fields are trimmed
      expect(result.data[0].entityDescription).toBe('Test Description');
      expect(result.data[0].submittedByName).toBe('Submitter');
    });

    it('should trim whitespace from level fields', async () => {
      // Given: Approval with whitespace in levels
      const mockApproval = createMockApproval({
        levels: [
          {
            levelOrder: 1,
            levelName: '  팀장  ',
            expectedApproverUserId: 10,
            expectedApproverName: '  Team Lead  ',
            decision: 'APPROVED',
            decidedByUserId: 10,
            decidedByName: '  Team Lead  ',
            decidedAt: '2025-01-15T10:00:00Z',
            comments: '  Approved  ',
          },
        ],
      });
      const mockResponse = createMockPagedResponse([mockApproval]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get approvals
      const result = await approvalService.getApprovals();

      // Then: Level fields are trimmed
      const level = result.data[0].levels![0];
      expect(level.levelName).toBe('팀장');
      expect(level.expectedApproverName).toBe('Team Lead');
      expect(level.decidedByName).toBe('Team Lead');
      expect(level.comments).toBe('Approved');
    });

    it('should handle filter params', async () => {
      // Given: Filter params
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get approvals with filter
      await approvalService.getApprovals({
        entityType: 'QUOTATION',
        status: 'PENDING',
        myPending: true,
      });

      // Then: Passes all params
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/approvals',
        params: {
          entityType: 'QUOTATION',
          status: 'PENDING',
          myPending: true,
        },
      });
    });

    it('should handle empty results', async () => {
      // Given: Empty response
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get approvals
      const result = await approvalService.getApprovals();

      // Then: Returns empty array
      expect(result.data).toEqual([]);
      expect(result.pagination.totalElements).toBe(0);
    });

    it('should propagate API errors', async () => {
      // Given: API error
      vi.mocked(httpClient.requestWithMeta).mockRejectedValue(mockApiErrors.serverError);

      // When/Then: Propagates error
      await expect(approvalService.getApprovals()).rejects.toEqual(mockApiErrors.serverError);
    });
  });

  describe('getApproval', () => {
    it('should fetch single approval by ID and transform', async () => {
      // Given: Mock approval response
      const mockApproval = createMockApproval({ id: 123 });
      vi.mocked(httpClient.get).mockResolvedValue(mockApproval);

      // When: Get approval by ID
      const result = await approvalService.getApproval(123);

      // Then: Calls httpClient with correct URL
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/approvals/123');

      // And: Returns transformed approval
      expect(result.id).toBe(123);
    });

    it('should handle null levels', async () => {
      // Given: Approval with null levels
      const mockApproval = createMockApproval({ levels: null });
      vi.mocked(httpClient.get).mockResolvedValue(mockApproval);

      // When: Get approval
      const result = await approvalService.getApproval(1);

      // Then: Levels remain null
      expect(result.levels).toBeNull();
    });

    it('should propagate 404 errors', async () => {
      // Given: Approval not found
      vi.mocked(httpClient.get).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(approvalService.getApproval(999)).rejects.toEqual(mockApiErrors.notFound);
    });
  });

  describe('approve', () => {
    it('should approve without comments and return command result', async () => {
      // Given: Mock command result
      const mockCommandResult: CommandResult = {
        id: 10,
        message: 'Approval submitted',
      };
      vi.mocked(httpClient.post).mockResolvedValue(mockCommandResult);

      // When: Approve
      const result = await approvalService.approve(10);

      // Then: Calls httpClient.post with correct URL and no body
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/approvals/10/approve', undefined);

      // And: Returns command result (CQRS pattern)
      expect(result).toEqual(mockCommandResult);
    });

    it('should approve with comments', async () => {
      // Given: Mock command result
      const mockCommandResult: CommandResult = {
        id: 10,
        message: 'Approval submitted',
      };
      vi.mocked(httpClient.post).mockResolvedValue(mockCommandResult);

      // When: Approve with comments
      await approvalService.approve(10, 'Looks good');

      // Then: Passes comments in request
      expect(httpClient.post).toHaveBeenCalledWith('/approvals/10/approve', { comments: 'Looks good' });
    });

    it('should propagate errors', async () => {
      // Given: Not authorized to approve
      vi.mocked(httpClient.post).mockRejectedValue(mockApiErrors.forbidden);

      // When/Then: Propagates error
      await expect(approvalService.approve(1)).rejects.toEqual(mockApiErrors.forbidden);
    });
  });

  describe('reject', () => {
    it('should reject with reason and return command result', async () => {
      // Given: Mock command result
      const mockCommandResult: CommandResult = {
        id: 10,
        message: 'Rejection submitted',
      };
      vi.mocked(httpClient.post).mockResolvedValue(mockCommandResult);

      // When: Reject
      const result = await approvalService.reject(10, 'Price too high');

      // Then: Calls httpClient.post with correct URL and body
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/approvals/10/reject', {
        reason: 'Price too high',
        comments: undefined,
      });

      // And: Returns command result (CQRS pattern)
      expect(result).toEqual(mockCommandResult);
    });

    it('should reject with reason and comments', async () => {
      // Given: Mock command result
      const mockCommandResult: CommandResult = {
        id: 10,
        message: 'Rejection submitted',
      };
      vi.mocked(httpClient.post).mockResolvedValue(mockCommandResult);

      // When: Reject with comments
      await approvalService.reject(10, 'Budget exceeded', 'Please revise and resubmit');

      // Then: Passes both reason and comments
      expect(httpClient.post).toHaveBeenCalledWith('/approvals/10/reject', {
        reason: 'Budget exceeded',
        comments: 'Please revise and resubmit',
      });
    });

    it('should propagate errors', async () => {
      // Given: Not authorized to reject
      vi.mocked(httpClient.post).mockRejectedValue(mockApiErrors.forbidden);

      // When/Then: Propagates error
      await expect(approvalService.reject(1, 'Reason')).rejects.toEqual(mockApiErrors.forbidden);
    });
  });

  describe('getHistory', () => {
    it('should fetch approval history and transform', async () => {
      // Given: Mock history response
      const mockHistory = [
        createMockHistoryEntry({ id: 1, action: 'SUBMITTED' }),
        createMockHistoryEntry({ id: 2, action: 'APPROVED', levelOrder: 1, levelName: '팀장' }),
      ];
      vi.mocked(httpClient.get).mockResolvedValue(mockHistory);

      // When: Get history
      const result = await approvalService.getHistory(10);

      // Then: Calls httpClient with correct URL
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/approvals/10/history');

      // And: Returns transformed history
      expect(result).toHaveLength(2);
      expect(result[0].action).toBe('SUBMITTED');
      expect(result[1].action).toBe('APPROVED');
    });

    it('should trim whitespace from history fields', async () => {
      // Given: History with whitespace
      const mockHistory = [
        createMockHistoryEntry({
          levelName: '  팀장  ',
          actorName: '  Actor  ',
          comments: '  Comments  ',
        }),
      ];
      vi.mocked(httpClient.get).mockResolvedValue(mockHistory);

      // When: Get history
      const result = await approvalService.getHistory(10);

      // Then: Fields are trimmed
      expect(result[0].levelName).toBe('팀장');
      expect(result[0].actorName).toBe('Actor');
      expect(result[0].comments).toBe('Comments');
    });

    it('should handle null optional fields', async () => {
      // Given: History with null fields
      const mockHistory = [
        createMockHistoryEntry({
          levelOrder: null,
          levelName: null,
          comments: null,
        }),
      ];
      vi.mocked(httpClient.get).mockResolvedValue(mockHistory);

      // When: Get history
      const result = await approvalService.getHistory(10);

      // Then: Null fields remain null
      expect(result[0].levelOrder).toBeNull();
      expect(result[0].levelName).toBeNull();
      expect(result[0].comments).toBeNull();
    });

    it('should propagate errors', async () => {
      // Given: API error
      vi.mocked(httpClient.get).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates error
      await expect(approvalService.getHistory(1)).rejects.toEqual(mockApiErrors.notFound);
    });
  });
});
