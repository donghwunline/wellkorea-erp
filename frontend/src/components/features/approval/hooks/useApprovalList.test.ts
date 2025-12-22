/**
 * Unit tests for useApprovalList hook.
 * Tests approval list fetching, pagination, loading states, and error handling.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useApprovalList } from './useApprovalList';
import { approvalService } from '@/services';
import { createMockApproval } from '@/test/fixtures';

// Mock the approval service
vi.mock('@/services', () => ({
  approvalService: {
    getApprovals: vi.fn(),
  },
}));

describe('useApprovalList', () => {
  const mockGetApprovals = approvalService.getApprovals as Mock;

  const mockPaginationMetadata = {
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with isLoading true', () => {
      mockGetApprovals.mockImplementation(() => new Promise(() => {})); // Never resolves
      const { result } = renderHook(() => useApprovalList({ page: 0 }));

      expect(result.current.isLoading).toBe(true);
    });

    it('should start with empty approvals', () => {
      mockGetApprovals.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useApprovalList({ page: 0 }));

      expect(result.current.approvals).toEqual([]);
    });

    it('should start with null pagination', () => {
      mockGetApprovals.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useApprovalList({ page: 0 }));

      expect(result.current.pagination).toBeNull();
    });

    it('should start with null error', () => {
      mockGetApprovals.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useApprovalList({ page: 0 }));

      expect(result.current.error).toBeNull();
    });
  });

  describe('fetching approvals', () => {
    it('should fetch approvals on mount', async () => {
      const mockApprovals = [createMockApproval()];
      mockGetApprovals.mockResolvedValue({
        data: mockApprovals,
        pagination: mockPaginationMetadata,
      });

      const { result } = renderHook(() => useApprovalList({ page: 0 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetApprovals).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        status: undefined,
        myPending: true,
      });
      expect(result.current.approvals).toEqual(mockApprovals);
      expect(result.current.pagination).toEqual(mockPaginationMetadata);
    });

    it('should pass status filter to service', async () => {
      mockGetApprovals.mockResolvedValue({
        data: [],
        pagination: mockPaginationMetadata,
      });

      renderHook(() => useApprovalList({ page: 0, status: 'PENDING' }));

      await waitFor(() => {
        expect(mockGetApprovals).toHaveBeenCalledWith({
          page: 0,
          size: 10,
          status: 'PENDING',
          myPending: true,
        });
      });
    });

    it('should refetch when page changes', async () => {
      mockGetApprovals.mockResolvedValue({
        data: [],
        pagination: mockPaginationMetadata,
      });

      const { rerender } = renderHook(
        ({ page }) => useApprovalList({ page }),
        { initialProps: { page: 0 } }
      );

      await waitFor(() => {
        expect(mockGetApprovals).toHaveBeenCalledTimes(1);
      });

      rerender({ page: 1 });

      await waitFor(() => {
        expect(mockGetApprovals).toHaveBeenCalledTimes(2);
        expect(mockGetApprovals).toHaveBeenLastCalledWith({
          page: 1,
          size: 10,
          status: undefined,
          myPending: true,
        });
      });
    });

    it('should refetch when status changes', async () => {
      mockGetApprovals.mockResolvedValue({
        data: [],
        pagination: mockPaginationMetadata,
      });

      const { rerender } = renderHook(
        ({ status }) => useApprovalList({ page: 0, status }),
        { initialProps: { status: undefined as 'PENDING' | undefined } }
      );

      await waitFor(() => {
        expect(mockGetApprovals).toHaveBeenCalledTimes(1);
      });

      rerender({ status: 'PENDING' as const });

      await waitFor(() => {
        expect(mockGetApprovals).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch when refreshTrigger changes', async () => {
      mockGetApprovals.mockResolvedValue({
        data: [],
        pagination: mockPaginationMetadata,
      });

      const { rerender } = renderHook(
        ({ refreshTrigger }) => useApprovalList({ page: 0, refreshTrigger }),
        { initialProps: { refreshTrigger: 0 } }
      );

      await waitFor(() => {
        expect(mockGetApprovals).toHaveBeenCalledTimes(1);
      });

      rerender({ refreshTrigger: 1 });

      await waitFor(() => {
        expect(mockGetApprovals).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('error handling', () => {
    it('should set error on fetch failure', async () => {
      mockGetApprovals.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApprovalList({ page: 0 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load approvals');
      expect(result.current.approvals).toEqual([]);
      expect(result.current.pagination).toBeNull();
    });

    it('should clear error on successful refetch', async () => {
      mockGetApprovals.mockRejectedValueOnce(new Error('Network error'));
      mockGetApprovals.mockResolvedValueOnce({
        data: [createMockApproval()],
        pagination: mockPaginationMetadata,
      });

      const { result } = renderHook(() => useApprovalList({ page: 0 }));

      // Wait for error state
      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load approvals');
      });

      // Trigger refetch
      act(() => {
        result.current.refetch();
      });

      // Wait for success
      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.approvals).toHaveLength(1);
      });
    });
  });

  describe('refetch', () => {
    it('should refetch when refetch is called', async () => {
      mockGetApprovals.mockResolvedValue({
        data: [],
        pagination: mockPaginationMetadata,
      });

      const { result } = renderHook(() => useApprovalList({ page: 0 }));

      await waitFor(() => {
        expect(mockGetApprovals).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockGetApprovals).toHaveBeenCalledTimes(2);
      });
    });

    it('should return stable refetch function', () => {
      mockGetApprovals.mockResolvedValue({
        data: [],
        pagination: mockPaginationMetadata,
      });

      const { result, rerender } = renderHook(() => useApprovalList({ page: 0 }));

      const firstRefetch = result.current.refetch;
      rerender();

      expect(result.current.refetch).toBe(firstRefetch);
    });
  });

  describe('loading state transitions', () => {
    it('should transition from loading to loaded', async () => {
      mockGetApprovals.mockResolvedValue({
        data: [createMockApproval()],
        pagination: mockPaginationMetadata,
      });

      const { result } = renderHook(() => useApprovalList({ page: 0 }));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.approvals).toHaveLength(1);
    });

    it('should set loading true during refetch', async () => {
      let resolvePromise: (value: unknown) => void;
      mockGetApprovals.mockImplementation(
        () =>
          new Promise(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useApprovalList({ page: 0 }));

      // Initial fetch
      await act(async () => {
        resolvePromise({ data: [], pagination: mockPaginationMetadata });
      });

      expect(result.current.isLoading).toBe(false);

      // Setup new promise for refetch
      mockGetApprovals.mockImplementation(
        () =>
          new Promise(resolve => {
            resolvePromise = resolve;
          })
      );

      // Trigger refetch
      act(() => {
        result.current.refetch();
      });

      // Should be loading again
      expect(result.current.isLoading).toBe(true);
    });
  });
});
