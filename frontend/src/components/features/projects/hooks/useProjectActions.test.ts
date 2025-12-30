/**
 * Unit tests for useProjectActions hook.
 * Tests project CRUD operations, loading states, error handling, and state management.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useProjectActions } from './useProjectActions';
import { projectService } from '@/services';
import type {
  CreateProjectRequest,
  ProjectCommandResult,
  ProjectDetails,
  UpdateProjectRequest,
} from '@/services';

// Mock the project service
vi.mock('@/services', () => ({
  projectService: {
    createProject: vi.fn(),
    updateProject: vi.fn(),
    getProject: vi.fn(),
  },
}));

// Helper to create mock project details
function createMockProject(overrides: Partial<ProjectDetails> = {}): ProjectDetails {
  return {
    id: 1,
    jobCode: 'WK2-2025-001-0115',
    customerId: 1,
    customerName: 'Test Customer',
    projectName: 'Test Project',
    requesterName: 'John Doe',
    dueDate: '2025-02-15',
    internalOwnerId: 2,
    internalOwnerName: 'Internal Owner',
    status: 'ACTIVE',
    createdById: 1,
    createdByName: 'Creator',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-16T14:45:00Z',
    ...overrides,
  };
}

// Helper to create mock command result
function createMockCommandResult(
  overrides: Partial<ProjectCommandResult> = {}
): ProjectCommandResult {
  return {
    id: 1,
    message: 'Project created successfully',
    jobCode: 'WK2-2025-001-0115',
    ...overrides,
  };
}

describe('useProjectActions', () => {
  const mockCreateProject = projectService.createProject as Mock;
  const mockUpdateProject = projectService.updateProject as Mock;
  const mockGetProject = projectService.getProject as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with isLoading false', () => {
      const { result } = renderHook(() => useProjectActions());

      expect(result.current.isLoading).toBe(false);
    });

    it('should start with error null', () => {
      const { result } = renderHook(() => useProjectActions());

      expect(result.current.error).toBeNull();
    });

    it('should return all action functions', () => {
      const { result } = renderHook(() => useProjectActions());

      expect(typeof result.current.createProject).toBe('function');
      expect(typeof result.current.updateProject).toBe('function');
      expect(typeof result.current.getProject).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('createProject', () => {
    it('should set isLoading true during creation', async () => {
      let resolvePromise: (value: ProjectCommandResult) => void;
      mockCreateProject.mockImplementation(
        () =>
          new Promise<ProjectCommandResult>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useProjectActions());

      act(() => {
        void result.current.createProject({
          customerId: 1,
          projectName: 'New Project',
          dueDate: '2025-02-15',
          internalOwnerId: 2,
        });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise(createMockCommandResult());
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should call projectService.createProject with data', async () => {
      const mockCommandResult = createMockCommandResult();
      mockCreateProject.mockResolvedValue(mockCommandResult);

      const { result } = renderHook(() => useProjectActions());

      const createData: CreateProjectRequest = {
        customerId: 1,
        projectName: 'New Project',
        dueDate: '2025-02-15',
        internalOwnerId: 2,
      };

      await act(async () => {
        await result.current.createProject(createData);
      });

      expect(mockCreateProject).toHaveBeenCalledWith(createData);
    });

    it('should return command result', async () => {
      const mockCommandResult = createMockCommandResult({ jobCode: 'WK2-2025-042-0120' });
      mockCreateProject.mockResolvedValue(mockCommandResult);

      const { result } = renderHook(() => useProjectActions());

      let commandResult: ProjectCommandResult | undefined;
      await act(async () => {
        commandResult = await result.current.createProject({
          customerId: 1,
          projectName: 'New Project',
          dueDate: '2025-02-15',
          internalOwnerId: 2,
        });
      });

      expect(commandResult).toEqual(mockCommandResult);
    });

    it('should set error on failure', async () => {
      mockCreateProject.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProjectActions());

      await act(async () => {
        try {
          await result.current.createProject({
            customerId: 1,
            projectName: 'New Project',
            dueDate: '2025-02-15',
            internalOwnerId: 2,
          });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should use fallback error message for non-Error exceptions', async () => {
      mockCreateProject.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useProjectActions());

      await act(async () => {
        try {
          await result.current.createProject({
            customerId: 1,
            projectName: 'New Project',
            dueDate: '2025-02-15',
            internalOwnerId: 2,
          });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to create project');
    });

    it('should re-throw error after setting state', async () => {
      const originalError = new Error('Creation failed');
      mockCreateProject.mockRejectedValue(originalError);

      const { result } = renderHook(() => useProjectActions());

      await expect(
        act(async () => {
          await result.current.createProject({
            customerId: 1,
            projectName: 'New Project',
            dueDate: '2025-02-15',
            internalOwnerId: 2,
          });
        })
      ).rejects.toThrow(originalError);
    });

    it('should clear error before new request', async () => {
      mockCreateProject.mockRejectedValueOnce(new Error('First error'));
      mockCreateProject.mockResolvedValueOnce(createMockCommandResult());

      const { result } = renderHook(() => useProjectActions());

      // First call fails
      await act(async () => {
        try {
          await result.current.createProject({
            customerId: 1,
            projectName: 'Project',
            dueDate: '2025-02-15',
            internalOwnerId: 2,
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      // Second call should clear error
      await act(async () => {
        await result.current.createProject({
          customerId: 1,
          projectName: 'Project',
          dueDate: '2025-02-15',
          internalOwnerId: 2,
        });
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('updateProject', () => {
    it('should set isLoading true during update', async () => {
      let resolvePromise: (value: ProjectCommandResult) => void;
      mockUpdateProject.mockImplementation(
        () =>
          new Promise<ProjectCommandResult>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useProjectActions());

      act(() => {
        void result.current.updateProject(1, { projectName: 'Updated' });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise(createMockCommandResult({ message: 'Project updated' }));
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should call projectService.updateProject with id and data', async () => {
      const mockCommandResult = createMockCommandResult({ message: 'Project updated' });
      mockUpdateProject.mockResolvedValue(mockCommandResult);

      const { result } = renderHook(() => useProjectActions());

      const updateData: UpdateProjectRequest = {
        projectName: 'Updated Project',
        dueDate: '2025-03-01',
      };

      await act(async () => {
        await result.current.updateProject(42, updateData);
      });

      expect(mockUpdateProject).toHaveBeenCalledWith(42, updateData);
    });

    it('should return command result', async () => {
      const mockCommandResult = createMockCommandResult({ message: 'Project updated' });
      mockUpdateProject.mockResolvedValue(mockCommandResult);

      const { result } = renderHook(() => useProjectActions());

      let commandResult: ProjectCommandResult | undefined;
      await act(async () => {
        commandResult = await result.current.updateProject(1, { projectName: 'Updated' });
      });

      expect(commandResult).toEqual(mockCommandResult);
    });

    it('should set error on failure', async () => {
      mockUpdateProject.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useProjectActions());

      await act(async () => {
        try {
          await result.current.updateProject(1, { projectName: 'Updated' });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Update failed');
    });

    it('should use fallback error message for non-Error exceptions', async () => {
      mockUpdateProject.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useProjectActions());

      await act(async () => {
        try {
          await result.current.updateProject(1, { projectName: 'Updated' });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Failed to update project');
    });
  });

  describe('getProject', () => {
    it('should set isLoading true during fetch', async () => {
      let resolvePromise: (value: ProjectDetails) => void;
      mockGetProject.mockImplementation(
        () =>
          new Promise<ProjectDetails>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useProjectActions());

      act(() => {
        void result.current.getProject(1);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise(createMockProject());
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should call projectService.getProject with id', async () => {
      const mockProject = createMockProject();
      mockGetProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjectActions());

      await act(async () => {
        await result.current.getProject(42);
      });

      expect(mockGetProject).toHaveBeenCalledWith(42);
    });

    it('should return fetched project', async () => {
      const mockProject = createMockProject({ id: 42 });
      mockGetProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjectActions());

      let fetchedProject: ProjectDetails | undefined;
      await act(async () => {
        fetchedProject = await result.current.getProject(42);
      });

      expect(fetchedProject).toEqual(mockProject);
    });

    it('should set error on failure', async () => {
      mockGetProject.mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useProjectActions());

      await act(async () => {
        try {
          await result.current.getProject(999);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Not found');
    });

    it('should use fallback error message for non-Error exceptions', async () => {
      mockGetProject.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useProjectActions());

      await act(async () => {
        try {
          await result.current.getProject(1);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Failed to load project');
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockCreateProject.mockRejectedValue(new Error('Some error'));

      const { result } = renderHook(() => useProjectActions());

      // Create error state
      await act(async () => {
        try {
          await result.current.createProject({
            customerId: 1,
            projectName: 'Project',
            dueDate: '2025-02-15',
            internalOwnerId: 2,
          });
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
  });

  describe('concurrent operations', () => {
    it('should handle multiple sequential operations', async () => {
      const project1 = createMockProject({ id: 1 });
      const project2 = createMockProject({ id: 2 });

      mockCreateProject.mockResolvedValue(project1);
      mockUpdateProject.mockResolvedValue(project2);

      const { result } = renderHook(() => useProjectActions());

      await act(async () => {
        await result.current.createProject({
          customerId: 1,
          projectName: 'Project 1',
          dueDate: '2025-02-15',
          internalOwnerId: 2,
        });
      });

      expect(result.current.error).toBeNull();

      await act(async () => {
        await result.current.updateProject(1, { projectName: 'Updated' });
      });

      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('function stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useProjectActions());

      const firstCreate = result.current.createProject;
      const firstUpdate = result.current.updateProject;
      const firstGet = result.current.getProject;
      const firstClear = result.current.clearError;

      rerender();

      expect(result.current.createProject).toBe(firstCreate);
      expect(result.current.updateProject).toBe(firstUpdate);
      expect(result.current.getProject).toBe(firstGet);
      expect(result.current.clearError).toBe(firstClear);
    });
  });
});
