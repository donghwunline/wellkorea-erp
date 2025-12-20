/**
 * Unit tests for useProjectSearch hook.
 * Tests project search functionality for quotation forms.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useProjectSearch } from './useProjectSearch';
import { projectService } from '@/services';

// Mock the project service
vi.mock('@/services', () => ({
  projectService: {
    getProjects: vi.fn(),
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

describe('useProjectSearch', () => {
  const mockGetProjects = projectService.getProjects as Mock;
  const mockGetProject = projectService.getProject as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return loadProjects function', () => {
      const { result } = renderHook(() => useProjectSearch());

      expect(typeof result.current.loadProjects).toBe('function');
    });

    it('should return getProject function', () => {
      const { result } = renderHook(() => useProjectSearch());

      expect(typeof result.current.getProject).toBe('function');
    });
  });

  describe('loadProjects', () => {
    it('should call projectService.getProjects with search query', async () => {
      mockGetProjects.mockResolvedValue({
        data: [],
        pagination: { page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true },
      });

      const { result } = renderHook(() => useProjectSearch());

      await act(async () => {
        await result.current.loadProjects('test');
      });

      expect(mockGetProjects).toHaveBeenCalledWith({
        search: 'test',
        page: 0,
        size: 20,
      });
    });

    it('should return combobox options from projects', async () => {
      const mockProject = createMockProject({
        id: 10,
        name: 'My Project',
        jobCode: 'WK2-2025-042-0120',
      });
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true },
      });

      const { result } = renderHook(() => useProjectSearch());

      let options: unknown;
      await act(async () => {
        options = await result.current.loadProjects('my');
      });

      expect(options).toEqual([
        {
          id: 10,
          label: 'My Project',
          description: 'WK2-2025-042-0120',
        },
      ]);
    });

    it('should return undefined description if jobCode is null', async () => {
      const mockProject = createMockProject({
        id: 10,
        name: 'My Project',
        jobCode: null,
      });
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true },
      });

      const { result } = renderHook(() => useProjectSearch());

      let options: unknown;
      await act(async () => {
        options = await result.current.loadProjects('my');
      });

      expect(options).toEqual([
        {
          id: 10,
          label: 'My Project',
          description: undefined,
        },
      ]);
    });

    it('should return multiple options for multiple projects', async () => {
      const mockProjects = [
        createMockProject({ id: 1, name: 'Project One', jobCode: 'JC-001' }),
        createMockProject({ id: 2, name: 'Project Two', jobCode: 'JC-002' }),
        createMockProject({ id: 3, name: 'Project Three', jobCode: 'JC-003' }),
      ];
      mockGetProjects.mockResolvedValue({
        data: mockProjects,
        pagination: { page: 0, size: 20, totalElements: 3, totalPages: 1, first: true, last: true },
      });

      const { result } = renderHook(() => useProjectSearch());

      let options: unknown;
      await act(async () => {
        options = await result.current.loadProjects('project');
      });

      expect(options).toHaveLength(3);
    });

    it('should return empty array when no projects found', async () => {
      mockGetProjects.mockResolvedValue({
        data: [],
        pagination: { page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true },
      });

      const { result } = renderHook(() => useProjectSearch());

      let options: unknown;
      await act(async () => {
        options = await result.current.loadProjects('nonexistent');
      });

      expect(options).toEqual([]);
    });

    it('should propagate errors from service', async () => {
      mockGetProjects.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProjectSearch());

      await expect(
        act(async () => {
          await result.current.loadProjects('test');
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('getProject', () => {
    it('should call projectService.getProject with id', async () => {
      const mockProject = createMockProject({ id: 42 });
      mockGetProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjectSearch());

      await act(async () => {
        await result.current.getProject(42);
      });

      expect(mockGetProject).toHaveBeenCalledWith(42);
    });

    it('should return project from service', async () => {
      const mockProject = createMockProject({
        id: 42,
        name: 'Fetched Project',
      });
      mockGetProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjectSearch());

      let project: unknown;
      await act(async () => {
        project = await result.current.getProject(42);
      });

      expect(project).toEqual(mockProject);
    });

    it('should propagate errors from service', async () => {
      mockGetProject.mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useProjectSearch());

      await expect(
        act(async () => {
          await result.current.getProject(999);
        })
      ).rejects.toThrow('Not found');
    });
  });

  describe('function stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useProjectSearch());

      const firstLoadProjects = result.current.loadProjects;
      const firstGetProject = result.current.getProject;

      rerender();

      expect(result.current.loadProjects).toBe(firstLoadProjects);
      expect(result.current.getProject).toBe(firstGetProject);
    });
  });
});
