/**
 * Task Flow Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { taskFlowQueries } from './task-flow.queries';
import { expectValidQueryOptions, expectQueryKey, invokeQueryFn } from '@/test/entity-test-utils';
import type { TaskFlowResponse } from './task-flow.mapper';

// Mock dependencies
vi.mock('./get-task-flow', () => ({
  getTaskFlow: vi.fn(),
  getTaskFlowById: vi.fn(),
}));

vi.mock('./task-flow.mapper', () => ({
  taskFlowMapper: {
    toDomain: vi.fn((response) => ({
      id: response.id,
      projectId: response.projectId,
      nodes: response.nodes,
      edges: response.edges,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      _mapped: true,
    })),
  },
}));

// Import mocked modules
import { getTaskFlow, getTaskFlowById } from './get-task-flow';
import { taskFlowMapper } from './task-flow.mapper';

// =============================================================================
// Test Fixtures - Minimal Response objects to satisfy TypeScript
// =============================================================================

function createMockTaskFlowResponse(
  overrides: Partial<TaskFlowResponse> = {}
): TaskFlowResponse {
  return {
    id: 1,
    projectId: 100,
    nodes: [],
    edges: [],
    createdAt: '2025-01-07T10:00:00Z',
    updatedAt: '2025-01-07T10:00:00Z',
    ...overrides,
  };
}

describe('taskFlowQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(taskFlowQueries.all(), ['task-flows']);
      });
    });

    describe('byProjects()', () => {
      it('should return project query key with "project" segment', () => {
        expectQueryKey(taskFlowQueries.byProjects(), ['task-flows', 'project']);
      });
    });

    describe('details()', () => {
      it('should return detail query key segment', () => {
        expectQueryKey(taskFlowQueries.details(), ['task-flows', 'detail']);
      });
    });
  });

  // ==========================================================================
  // byProject Query Tests
  // ==========================================================================

  describe('byProject()', () => {
    it('should return valid queryOptions', () => {
      const options = taskFlowQueries.byProject(100);
      expectValidQueryOptions(options);
    });

    it('should include projectId in query key', () => {
      const options = taskFlowQueries.byProject(100);
      expect(options.queryKey).toEqual(['task-flows', 'project', 100]);
    });

    it('should have 5-minute staleTime', () => {
      const options = taskFlowQueries.byProject(100);
      expect(options.staleTime).toBe(1000 * 60 * 5);
    });

    it('should call getTaskFlow with correct projectId in queryFn', async () => {
      const mockResponse = createMockTaskFlowResponse({ id: 1, projectId: 100 });
      vi.mocked(getTaskFlow).mockResolvedValue(mockResponse);

      const options = taskFlowQueries.byProject(100);
      await invokeQueryFn(options);

      expect(getTaskFlow).toHaveBeenCalledWith({ projectId: 100 });
    });

    it('should map response using taskFlowMapper.toDomain', async () => {
      const mockResponse = createMockTaskFlowResponse({
        id: 1,
        projectId: 100,
        nodes: [
          { id: 'node-1', title: 'Task 1', assignee: null, deadline: null, progress: 0, positionX: 100, positionY: 100 },
        ],
        edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
      });
      vi.mocked(getTaskFlow).mockResolvedValue(mockResponse);

      const options = taskFlowQueries.byProject(100);
      const result = await invokeQueryFn(options);

      expect(taskFlowMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toHaveProperty('_mapped', true);
    });

    it('should generate different query keys for different projectIds', () => {
      const key1 = taskFlowQueries.byProject(1).queryKey;
      const key2 = taskFlowQueries.byProject(2).queryKey;

      expect(key1).not.toEqual(key2);
      expect(key1[2]).toBe(1);
      expect(key2[2]).toBe(2);
    });

    it('should generate stable query keys for same projectId', () => {
      const key1 = taskFlowQueries.byProject(100).queryKey;
      const key2 = taskFlowQueries.byProject(100).queryKey;

      expect(key1).toEqual(key2);
    });
  });

  // ==========================================================================
  // Detail Query Tests
  // ==========================================================================

  describe('detail()', () => {
    it('should return valid queryOptions', () => {
      const options = taskFlowQueries.detail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = taskFlowQueries.detail(123);
      expect(options.queryKey).toEqual(['task-flows', 'detail', 123]);
    });

    it('should have 5-minute staleTime', () => {
      const options = taskFlowQueries.detail(1);
      expect(options.staleTime).toBe(1000 * 60 * 5);
    });

    it('should call getTaskFlowById with correct id in queryFn', async () => {
      const mockResponse = createMockTaskFlowResponse({ id: 123, projectId: 100 });
      vi.mocked(getTaskFlowById).mockResolvedValue(mockResponse);

      const options = taskFlowQueries.detail(123);
      await invokeQueryFn(options);

      expect(getTaskFlowById).toHaveBeenCalledWith(123);
    });

    it('should map response using taskFlowMapper.toDomain', async () => {
      const mockResponse = createMockTaskFlowResponse({ id: 123, projectId: 100 });
      vi.mocked(getTaskFlowById).mockResolvedValue(mockResponse);

      const options = taskFlowQueries.detail(123);
      const result = await invokeQueryFn(options);

      expect(taskFlowMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toHaveProperty('_mapped', true);
    });

    it('should generate different query keys for different ids', () => {
      const key1 = taskFlowQueries.detail(1).queryKey;
      const key2 = taskFlowQueries.detail(2).queryKey;

      expect(key1).not.toEqual(key2);
      expect(key1[2]).toBe(1);
      expect(key2[2]).toBe(2);
    });
  });

  // ==========================================================================
  // Edge Case Tests
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty nodes and edges in response', async () => {
      const mockResponse = createMockTaskFlowResponse({
        id: 1,
        projectId: 100,
        nodes: [],
        edges: [],
      });
      vi.mocked(getTaskFlow).mockResolvedValue(mockResponse);

      const options = taskFlowQueries.byProject(100);
      const result = await invokeQueryFn<{ nodes: unknown[]; edges: unknown[] }>(options);

      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });

    it('should handle null createdAt/updatedAt in response', async () => {
      const mockResponse = createMockTaskFlowResponse({
        id: 1,
        projectId: 100,
        createdAt: null,
        updatedAt: null,
      });
      vi.mocked(getTaskFlow).mockResolvedValue(mockResponse);

      const options = taskFlowQueries.byProject(100);
      await invokeQueryFn(options);

      expect(taskFlowMapper.toDomain).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: null,
          updatedAt: null,
        })
      );
    });

    // TODO: Comprehensive edge case coverage
    // - Response with very large number of nodes/edges
    // - Network error handling (tested at httpClient level)
    // - Cache invalidation scenarios (tested at hook level)
  });
});
