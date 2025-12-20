/**
 * Unit tests for useProjectDetails hook.
 * Tests project details loading functionality.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjectDetails } from './useProjectDetails';
import { projectService } from '@/services';

// Mock the project service
vi.mock('@/services', () => ({
  projectService: {
    getProject: vi.fn(),
  },
}));

// Helper to create mock project
function createMockProject(overrides = {}) {
  return {
    id: 1,
    name: 'Test Project',
    jobCode: 'WK2-2025-001-0115',
    customerId: 1,
    ...overrides,
  };
}

describe('useProjectDetails', () => {
  const mockGetProject = projectService.getProject as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state with null projectId', () => {
    it('should start with null project', () => {
      const { result } = renderHook(() => useProjectDetails(null));

      expect(result.current.project).toBeNull();
    });

    it('should start with isLoading false when projectId is null', () => {
      const { result } = renderHook(() => useProjectDetails(null));

      expect(result.current.isLoading).toBe(false);
    });

    it('should start with null error', () => {
      const { result } = renderHook(() => useProjectDetails(null));

      expect(result.current.error).toBeNull();
    });

    it('should not call projectService.getProject', () => {
      renderHook(() => useProjectDetails(null));

      expect(mockGetProject).not.toHaveBeenCalled();
    });
  });

  describe('initial state with valid projectId', () => {
    it('should start with isLoading true when projectId is provided', () => {
      mockGetProject.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useProjectDetails(1));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('fetching project', () => {
    it('should fetch project when projectId is provided', async () => {
      const mockProject = createMockProject({ id: 42 });
      mockGetProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjectDetails(42));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetProject).toHaveBeenCalledWith(42);
      expect(result.current.project).toEqual(mockProject);
    });

    it('should set isLoading false after fetch completes', async () => {
      const mockProject = createMockProject();
      mockGetProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjectDetails(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should refetch when projectId changes', async () => {
      const mockProject1 = createMockProject({ id: 1, name: 'Project 1' });
      const mockProject2 = createMockProject({ id: 2, name: 'Project 2' });

      mockGetProject.mockResolvedValueOnce(mockProject1);
      mockGetProject.mockResolvedValueOnce(mockProject2);

      const { result, rerender } = renderHook(
        ({ projectId }) => useProjectDetails(projectId),
        { initialProps: { projectId: 1 as number | null } }
      );

      await waitFor(() => {
        expect(result.current.project?.name).toBe('Project 1');
      });

      rerender({ projectId: 2 });

      await waitFor(() => {
        expect(result.current.project?.name).toBe('Project 2');
      });

      expect(mockGetProject).toHaveBeenCalledTimes(2);
      expect(mockGetProject).toHaveBeenNthCalledWith(1, 1);
      expect(mockGetProject).toHaveBeenNthCalledWith(2, 2);
    });
  });

  describe('error handling', () => {
    it('should set error on fetch failure', async () => {
      mockGetProject.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProjectDetails(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load project details');
      expect(result.current.project).toBeNull();
    });

    it('should set isLoading false on error', async () => {
      mockGetProject.mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useProjectDetails(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('resetting state when projectId becomes null', () => {
    it('should reset project to null when projectId becomes null', async () => {
      const mockProject = createMockProject();
      mockGetProject.mockResolvedValue(mockProject);

      const { result, rerender } = renderHook(
        ({ projectId }) => useProjectDetails(projectId),
        { initialProps: { projectId: 1 as number | null } }
      );

      await waitFor(() => {
        expect(result.current.project).not.toBeNull();
      });

      rerender({ projectId: null });

      expect(result.current.project).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should reset error when projectId becomes null', async () => {
      mockGetProject.mockRejectedValue(new Error('Error'));

      const { result, rerender } = renderHook(
        ({ projectId }) => useProjectDetails(projectId),
        { initialProps: { projectId: 1 as number | null } }
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      rerender({ projectId: null });

      expect(result.current.error).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should not update state after unmount', async () => {
      let resolvePromise: (value: unknown) => void;
      mockGetProject.mockImplementation(
        () =>
          new Promise(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result, unmount } = renderHook(() => useProjectDetails(1));

      expect(result.current.isLoading).toBe(true);

      // Unmount before promise resolves
      unmount();

      // Resolve promise after unmount - should not throw or update state
      resolvePromise!(createMockProject());

      // No assertion needed - just ensuring no error is thrown
    });

    it('should cancel previous request when projectId changes', async () => {
      const mockProject1 = createMockProject({ id: 1, name: 'Project 1' });
      const mockProject2 = createMockProject({ id: 2, name: 'Project 2' });

      let resolve1: (value: unknown) => void;
      let resolve2: (value: unknown) => void;

      mockGetProject.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolve1 = resolve;
          })
      );
      mockGetProject.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolve2 = resolve;
          })
      );

      const { result, rerender } = renderHook(
        ({ projectId }) => useProjectDetails(projectId),
        { initialProps: { projectId: 1 as number | null } }
      );

      // Start first request
      expect(result.current.isLoading).toBe(true);

      // Change projectId before first request completes
      rerender({ projectId: 2 });

      // Resolve second request first
      resolve2!(mockProject2);

      await waitFor(() => {
        expect(result.current.project?.name).toBe('Project 2');
      });

      // Resolve first request after second
      resolve1!(mockProject1);

      // Wait a bit and check that first result didn't override second
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(result.current.project?.name).toBe('Project 2');
    });
  });
});
