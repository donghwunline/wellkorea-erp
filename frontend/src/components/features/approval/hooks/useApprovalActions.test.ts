/**
 * Unit tests for useApprovalActions hook.
 * Tests approval workflow operations, loading states, error handling, and state management.
 *
 * CQRS Pattern: Command actions return CommandResult with { id, message }
 * instead of full ApprovalDetails entity.
 */

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useApprovalActions } from './useApprovalActions.ts';
import type { CommandResult } from '@/services';
import { approvalService } from '@/services';

// Helper to create mock command result
const createMockCommandResult = (overrides?: Partial<CommandResult>): CommandResult => ({
  id: 1,
  message: 'Approval request approved at current level',
  ...overrides,
});

// Mock the approval service
vi.mock('@/services', () => ({
  approvalService: {
    approve: vi.fn(),
    reject: vi.fn(),
  },
}));

describe('useApprovalActions', () => {
  const mockApprove = approvalService.approve as Mock;
  const mockReject = approvalService.reject as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with isLoading false', () => {
      const { result } = renderHook(() => useApprovalActions());

      expect(result.current.isLoading).toBe(false);
    });

    it('should start with error null', () => {
      const { result } = renderHook(() => useApprovalActions());

      expect(result.current.error).toBeNull();
    });

    it('should return all action functions', () => {
      const { result } = renderHook(() => useApprovalActions());

      expect(typeof result.current.approve).toBe('function');
      expect(typeof result.current.reject).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('approve', () => {
    it('should set isLoading true during approval', async () => {
      let resolvePromise: (value: CommandResult) => void;
      mockApprove.mockImplementation(
        () =>
          new Promise<CommandResult>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useApprovalActions());

      act(() => {
        void result.current.approve(1);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise(createMockCommandResult());
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should call approvalService.approve with id and comment (CQRS)', async () => {
      mockApprove.mockResolvedValue(createMockCommandResult());

      const { result } = renderHook(() => useApprovalActions());

      await act(async () => {
        await result.current.approve(42, 'Looks good');
      });

      // CQRS: Service now takes (id, comment) directly, not { comment }
      expect(mockApprove).toHaveBeenCalledWith(42, 'Looks good');
    });

    it('should call approvalService.approve without comment', async () => {
      mockApprove.mockResolvedValue(createMockCommandResult());

      const { result } = renderHook(() => useApprovalActions());

      await act(async () => {
        await result.current.approve(42);
      });

      expect(mockApprove).toHaveBeenCalledWith(42, undefined);
    });

    it('should return command result (CQRS)', async () => {
      const mockResult = createMockCommandResult({
        id: 42,
        message: 'Approval request approved at current level',
      });
      mockApprove.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useApprovalActions());

      let approved: CommandResult | undefined;
      await act(async () => {
        approved = await result.current.approve(42);
      });

      expect(approved?.id).toBe(42);
      expect(approved?.message).toBe('Approval request approved at current level');
    });

    it('should set error on failure', async () => {
      mockApprove.mockRejectedValue(new Error('Not authorized'));

      const { result } = renderHook(() => useApprovalActions());

      await act(async () => {
        try {
          await result.current.approve(1);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Not authorized');
    });

    it('should re-throw error after setting state', async () => {
      const originalError = new Error('Approval failed');
      mockApprove.mockRejectedValue(originalError);

      const { result } = renderHook(() => useApprovalActions());

      await expect(
        act(async () => {
          await result.current.approve(1);
        })
      ).rejects.toThrow(originalError);
    });
  });

  describe('reject', () => {
    it('should set isLoading true during rejection', async () => {
      let resolvePromise: (value: CommandResult) => void;
      mockReject.mockImplementation(
        () =>
          new Promise<CommandResult>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useApprovalActions());

      act(() => {
        void result.current.reject(1, 'Price too high');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise(createMockCommandResult({ message: 'Approval request rejected' }));
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should call approvalService.reject with id and reason (CQRS)', async () => {
      mockReject.mockResolvedValue(
        createMockCommandResult({ message: 'Approval request rejected' })
      );

      const { result } = renderHook(() => useApprovalActions());

      await act(async () => {
        await result.current.reject(42, 'Budget exceeded');
      });

      // CQRS: Service now takes (id, reason) directly, not { reason }
      expect(mockReject).toHaveBeenCalledWith(42, 'Budget exceeded');
    });

    it('should return command result (CQRS)', async () => {
      const mockResult = createMockCommandResult({ id: 42, message: 'Approval request rejected' });
      mockReject.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useApprovalActions());

      let rejected: CommandResult | undefined;
      await act(async () => {
        rejected = await result.current.reject(42, 'Reason');
      });

      expect(rejected?.id).toBe(42);
      expect(rejected?.message).toBe('Approval request rejected');
    });

    it('should set error on failure', async () => {
      mockReject.mockRejectedValue(new Error('Not authorized'));

      const { result } = renderHook(() => useApprovalActions());

      await act(async () => {
        try {
          await result.current.reject(1, 'Reason');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Not authorized');
    });

    it('should re-throw error after setting state', async () => {
      const originalError = new Error('Rejection failed');
      mockReject.mockRejectedValue(originalError);

      const { result } = renderHook(() => useApprovalActions());

      await expect(
        act(async () => {
          await result.current.reject(1, 'Reason');
        })
      ).rejects.toThrow(originalError);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockApprove.mockRejectedValue(new Error('Some error'));

      const { result } = renderHook(() => useApprovalActions());

      // Create error state
      await act(async () => {
        try {
          await result.current.approve(1);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Some error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear error before new request', async () => {
      mockApprove.mockRejectedValueOnce(new Error('First error'));
      mockApprove.mockResolvedValueOnce(createMockCommandResult());

      const { result } = renderHook(() => useApprovalActions());

      // First call fails
      await act(async () => {
        try {
          await result.current.approve(1);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      // Second call should clear error
      await act(async () => {
        await result.current.approve(1);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('function stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useApprovalActions());

      const firstApprove = result.current.approve;
      const firstReject = result.current.reject;
      const firstClear = result.current.clearError;

      rerender();

      expect(result.current.approve).toBe(firstApprove);
      expect(result.current.reject).toBe(firstReject);
      expect(result.current.clearError).toBe(firstClear);
    });
  });
});
