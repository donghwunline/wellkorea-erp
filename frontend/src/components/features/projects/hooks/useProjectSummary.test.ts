/**
 * Unit tests for useProjectSummary hook.
 * Tests data fetching, loading states, error handling, and refetch functionality.
 */

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useProjectSummary } from './useProjectSummary';
import type { ProjectSummary } from '@/services';
import { projectSummaryService } from '@/services';

// Mock the services module
vi.mock('@/services', () => ({
  projectSummaryService: {
    getProjectSummary: vi.fn(),
  },
}));

// Helper to create mock summary data
function createMockSummary(projectId: number): ProjectSummary {
  return {
    projectId,
    sections: [
      {
        section: 'quotation',
        label: '견적',
        totalCount: 3,
        pendingCount: 1,
        value: 15000000,
        lastUpdated: '2025-01-15T10:00:00Z',
      },
      {
        section: 'process',
        label: '공정/진행률',
        totalCount: 6,
        pendingCount: 2,
        progressPercent: 60,
        lastUpdated: '2025-01-15T14:00:00Z',
      },
      {
        section: 'outsource',
        label: '외주',
        totalCount: 2,
        pendingCount: 1,
        lastUpdated: '2025-01-14T12:00:00Z',
      },
      {
        section: 'delivery',
        label: '납품',
        totalCount: 4,
        pendingCount: 2,
        lastUpdated: '2025-01-15T16:00:00Z',
      },
      {
        section: 'documents',
        label: '도면/문서',
        totalCount: 8,
        pendingCount: 0,
        lastUpdated: '2025-01-15T09:00:00Z',
      },
      {
        section: 'finance',
        label: '정산',
        totalCount: 2,
        pendingCount: 1,
        value: 12000000,
        lastUpdated: '2025-01-12T10:00:00Z',
      },
    ],
  };
}

describe('useProjectSummary', () => {
  const mockGetProjectSummary = projectSummaryService.getProjectSummary as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial fetch', () => {
    it('should start with loading state', () => {
      mockGetProjectSummary.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useProjectSummary({ projectId: 1 }));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.summary).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should fetch summary on mount', async () => {
      const mockSummary = createMockSummary(1);
      mockGetProjectSummary.mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useProjectSummary({ projectId: 1 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetProjectSummary).toHaveBeenCalledOnce();
      expect(mockGetProjectSummary).toHaveBeenCalledWith(1);
      expect(result.current.summary).toEqual(mockSummary);
    });

    it('should set loading to false after successful fetch', async () => {
      mockGetProjectSummary.mockResolvedValue(createMockSummary(1));

      const { result } = renderHook(() => useProjectSummary({ projectId: 1 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.summary).toBeDefined();
      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should set error state when fetch fails', async () => {
      const errorMessage = 'Network error';
      mockGetProjectSummary.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProjectSummary({ projectId: 1 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.summary).toBeNull();
    });

    it('should handle non-Error rejection', async () => {
      mockGetProjectSummary.mockRejectedValue('String error');

      const { result } = renderHook(() => useProjectSummary({ projectId: 1 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load project summary');
    });

    it('should clear error when refetch succeeds', async () => {
      mockGetProjectSummary.mockRejectedValueOnce(new Error('Network error'));
      mockGetProjectSummary.mockResolvedValueOnce(createMockSummary(1));

      const { result } = renderHook(() => useProjectSummary({ projectId: 1 }));

      // Wait for error state
      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      // Refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.summary).toBeDefined();
    });
  });

  describe('refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const mockSummary1 = createMockSummary(1);
      const mockSummary2 = { ...mockSummary1, sections: [...mockSummary1.sections] };
      mockSummary2.sections[0] = { ...mockSummary2.sections[0], totalCount: 10 };

      mockGetProjectSummary.mockResolvedValueOnce(mockSummary1);
      mockGetProjectSummary.mockResolvedValueOnce(mockSummary2);

      const { result } = renderHook(() => useProjectSummary({ projectId: 1 }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.summary?.sections[0].totalCount).toBe(3);
      });

      // Refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.summary?.sections[0].totalCount).toBe(10);
      expect(mockGetProjectSummary).toHaveBeenCalledTimes(2);
    });

    it('should set loading state during refetch', async () => {
      let resolvePromise: (value: ProjectSummary) => void;
      mockGetProjectSummary.mockResolvedValueOnce(createMockSummary(1));
      mockGetProjectSummary.mockImplementationOnce(
        () =>
          new Promise<ProjectSummary>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useProjectSummary({ projectId: 1 }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start refetch
      act(() => {
        void result.current.refetch();
      });

      // Should be loading again
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise(createMockSummary(1));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('enabled option', () => {
    it('should not fetch when enabled is false', async () => {
      const { result } = renderHook(() => useProjectSummary({ projectId: 1, enabled: false }));

      // Give it time to potentially make a call
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGetProjectSummary).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.summary).toBeNull();
    });

    it('should fetch when enabled changes from false to true', async () => {
      mockGetProjectSummary.mockResolvedValue(createMockSummary(1));

      const { result, rerender } = renderHook(
        ({ enabled }) => useProjectSummary({ projectId: 1, enabled }),
        { initialProps: { enabled: false } }
      );

      // Should not have fetched yet
      expect(mockGetProjectSummary).not.toHaveBeenCalled();

      // Enable fetching
      rerender({ enabled: true });

      await waitFor(() => {
        expect(mockGetProjectSummary).toHaveBeenCalledOnce();
      });

      expect(result.current.summary).toBeDefined();
    });
  });

  describe('projectId changes', () => {
    it('should refetch when projectId changes', async () => {
      mockGetProjectSummary.mockImplementation((id: number) =>
        Promise.resolve(createMockSummary(id))
      );

      const { result, rerender } = renderHook(({ projectId }) => useProjectSummary({ projectId }), {
        initialProps: { projectId: 1 },
      });

      await waitFor(() => {
        expect(result.current.summary?.projectId).toBe(1);
      });

      // Change projectId
      rerender({ projectId: 2 });

      await waitFor(() => {
        expect(result.current.summary?.projectId).toBe(2);
      });

      expect(mockGetProjectSummary).toHaveBeenCalledTimes(2);
      expect(mockGetProjectSummary).toHaveBeenNthCalledWith(1, 1);
      expect(mockGetProjectSummary).toHaveBeenNthCalledWith(2, 2);
    });

    it('should not fetch when projectId is 0', async () => {
      const { result } = renderHook(() => useProjectSummary({ projectId: 0 }));

      // Give it time to potentially make a call
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGetProjectSummary).not.toHaveBeenCalled();
      expect(result.current.summary).toBeNull();
    });
  });

  describe('return value structure', () => {
    it('should return all required properties', async () => {
      mockGetProjectSummary.mockResolvedValue(createMockSummary(1));

      const { result } = renderHook(() => useProjectSummary({ projectId: 1 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('summary');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
      expect(typeof result.current.refetch).toBe('function');
    });
  });
});
