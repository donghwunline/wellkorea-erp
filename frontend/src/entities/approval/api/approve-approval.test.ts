/**
 * Approve Approval Command Tests.
 *
 * Tests for mapping and API call.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { approveApproval, type ApproveApprovalInput } from './approve-approval';
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

function createValidInput(overrides?: Partial<ApproveApprovalInput>): ApproveApprovalInput {
  return {
    id: 123,
    comments: 'Approved',
    ...overrides,
  };
}

describe('approveApproval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.post.mockResolvedValue(createCommandResult(123));
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should include comments in request when provided', async () => {
      const input = createValidInput({ comments: 'Approved with comments' });

      await approveApproval(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/approvals/123/approve',
        { comments: 'Approved with comments' }
      );
    });

    it('should pass undefined when comments not provided', async () => {
      const input: ApproveApprovalInput = { id: 123 };

      await approveApproval(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/approvals/123/approve',
        undefined
      );
    });

    it('should pass undefined when comments is empty string', async () => {
      const input = createValidInput({ comments: '' });

      await approveApproval(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/approvals/123/approve',
        undefined
      );
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct approve endpoint', async () => {
      const input = createValidInput({ id: 456 });

      await approveApproval(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/approvals/456/approve',
        expect.anything()
      );
    });

    it('should return CommandResult on success', async () => {
      mockHttpClient.post.mockResolvedValue({ id: 123, message: 'Approved successfully' });
      const input = createValidInput();

      const result = await approveApproval(input);

      expect(result).toEqual({ id: 123, message: 'Approved successfully' });
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);
      const input = createValidInput();

      await expect(approveApproval(input)).rejects.toThrow('Network error');
    });

    it('should handle different approval IDs', async () => {
      await approveApproval({ id: 1 });
      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/approvals/1/approve', undefined);

      await approveApproval({ id: 999, comments: 'OK' });
      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/approvals/999/approve', { comments: 'OK' });
    });
  });
});
