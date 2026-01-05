/**
 * Reject Approval Command Tests.
 *
 * Tests for validation, mapping, and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { rejectApproval, type RejectApprovalInput } from './reject-approval';
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
    APPROVAL_ENDPOINTS: {
      BASE: '/api/approvals',
      byId: (id: number) => `/api/approvals/${id}`,
      approve: (id: number) => `/api/approvals/${id}/approve`,
      reject: (id: number) => `/api/approvals/${id}/reject`,
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(overrides?: Partial<RejectApprovalInput>): RejectApprovalInput {
  return {
    id: 123,
    reason: '가격 검토 필요',
    comments: 'Additional comments',
    ...overrides,
  };
}

describe('rejectApproval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.post.mockResolvedValue(createCommandResult(123));
  });

  // ==========================================================================
  // Validation Tests - Reason
  // ==========================================================================

  describe('validation - reason', () => {
    it('should pass with valid reason', async () => {
      const input = createValidInput({ reason: '가격 검토 필요' });
      await expect(rejectApproval(input)).resolves.not.toThrow();
    });

    it('should throw error when reason is empty', async () => {
      const input = createValidInput({ reason: '' });

      await expect(rejectApproval(input)).rejects.toThrow('반려 사유를 입력해주세요');
    });

    it('should throw error when reason is whitespace only', async () => {
      const input = createValidInput({ reason: '   ' });

      await expect(rejectApproval(input)).rejects.toThrow('반려 사유를 입력해주세요');
    });

    it('should not call API when validation fails', async () => {
      const input = createValidInput({ reason: '' });

      try {
        await rejectApproval(input);
      } catch {
        // Expected
      }

      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should trim reason whitespace', async () => {
      const input = createValidInput({ reason: '  가격 검토 필요  ' });

      await rejectApproval(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/approvals/123/reject',
        expect.objectContaining({ reason: '가격 검토 필요' })
      );
    });

    it('should trim comments whitespace when provided', async () => {
      const input = createValidInput({ comments: '  Additional comments  ' });

      await rejectApproval(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/approvals/123/reject',
        expect.objectContaining({ comments: 'Additional comments' })
      );
    });

    it('should set comments to undefined when empty', async () => {
      const input = createValidInput({ comments: '' });

      await rejectApproval(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/approvals/123/reject',
        { reason: '가격 검토 필요', comments: undefined }
      );
    });

    it('should set comments to undefined when whitespace only', async () => {
      const input = createValidInput({ comments: '   ' });

      await rejectApproval(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/approvals/123/reject',
        { reason: '가격 검토 필요', comments: undefined }
      );
    });

    it('should handle undefined comments', async () => {
      const input: RejectApprovalInput = { id: 123, reason: 'Reason' };

      await rejectApproval(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/approvals/123/reject',
        { reason: 'Reason', comments: undefined }
      );
    });

    it('should map all fields correctly', async () => {
      const input: RejectApprovalInput = {
        id: 123,
        reason: 'Budget exceeded',
        comments: 'Please revise pricing',
      };

      await rejectApproval(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/approvals/123/reject', {
        reason: 'Budget exceeded',
        comments: 'Please revise pricing',
      });
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct reject endpoint', async () => {
      const input = createValidInput({ id: 456 });

      await rejectApproval(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/approvals/456/reject',
        expect.any(Object)
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.post.mockResolvedValue({ id: 123, message: 'Rejected' });
      const input = createValidInput();

      const result = await rejectApproval(input);

      expect(result).toEqual({ id: 123, message: 'Rejected' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);
      const input = createValidInput();

      await expect(rejectApproval(input)).rejects.toThrow('Network error');
    });

    it('should handle different approval IDs', async () => {
      await rejectApproval({ id: 1, reason: 'Reason 1' });
      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/approvals/1/reject', expect.any(Object));

      await rejectApproval({ id: 999, reason: 'Reason 2' });
      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/approvals/999/reject', expect.any(Object));
    });
  });
});
