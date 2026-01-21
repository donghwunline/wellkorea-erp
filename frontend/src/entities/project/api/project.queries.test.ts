/**
 * Project Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { projectQueries, type ProjectListQueryParams } from './project.queries';
import { expectValidQueryOptions, expectQueryKey, invokeQueryFn } from '@/test/entity-test-utils';
import type { Paginated } from '@/shared/lib/pagination';
import type { ProjectListItemResponse, ProjectDetailsResponse } from './project.mapper';

// Mock dependencies
vi.mock('./get-project', () => ({
  getProject: vi.fn(),
  getProjectByJobCode: vi.fn(),
  getProjects: vi.fn(),
}));

vi.mock('./project.mapper', () => ({
  projectMapper: {
    toDomain: vi.fn((response) => ({ ...response, _mapped: true })),
    toListItem: vi.fn((response) => ({ id: response.id, projectName: response.projectName })),
  },
}));

vi.mock('./project-summary.api', () => ({
  projectSummaryApi: {
    getSummary: vi.fn(),
    getKPIs: vi.fn(),
  },
}));

// Import mocked modules
import { getProject, getProjectByJobCode, getProjects } from './get-project';
import { projectMapper } from './project.mapper';
import { projectSummaryApi } from './project-summary.api';

// =============================================================================
// Test Fixtures - Minimal Response objects to satisfy TypeScript
// =============================================================================

function createMockProjectListItemResponse(
  overrides: Partial<ProjectListItemResponse> = {}
): ProjectListItemResponse {
  return {
    id: 1,
    jobCode: '',
    customerId: 1,
    customerName: null,
    projectName: '',
    requesterName: null,
    dueDate: '',
    status: 'DRAFT',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function createMockProjectDetailsResponse(
  overrides: Partial<ProjectDetailsResponse> = {}
): ProjectDetailsResponse {
  return {
    id: 1,
    jobCode: '',
    customerId: 1,
    customerName: null,
    projectName: '',
    requesterName: null,
    dueDate: '',
    internalOwnerId: 1,
    internalOwnerName: null,
    status: 'DRAFT',
    createdById: 1,
    createdByName: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function createMockPaginatedProjects(
  data: ProjectListItemResponse[]
): Paginated<ProjectListItemResponse> {
  return {
    data,
    pagination: { page: 0, size: 10, totalElements: data.length, totalPages: 1, first: true, last: true },
  };
}

describe('projectQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(projectQueries.all(), ['projects']);
      });
    });

    describe('lists()', () => {
      it('should return list query key with "list" segment', () => {
        expectQueryKey(projectQueries.lists(), ['projects', 'list']);
      });
    });

    describe('details()', () => {
      it('should return detail query key segment', () => {
        expectQueryKey(projectQueries.details(), ['projects', 'detail']);
      });
    });

    describe('byJobCodes()', () => {
      it('should return byJobCode query key segment', () => {
        expectQueryKey(projectQueries.byJobCodes(), ['projects', 'byJobCode']);
      });
    });

    describe('summaries()', () => {
      it('should return summary query key segment', () => {
        expectQueryKey(projectQueries.summaries(), ['projects', 'summary']);
      });
    });

    describe('kpis()', () => {
      it('should return kpis query key segment', () => {
        expectQueryKey(projectQueries.kpis(), ['projects', 'kpis']);
      });
    });
  });

  // ==========================================================================
  // List Query Tests
  // ==========================================================================

  describe('list()', () => {
    const defaultParams: ProjectListQueryParams = {
      page: 0,
      size: 10,
      search: '',
      status: null,
    };

    it('should return valid queryOptions', () => {
      const options = projectQueries.list(defaultParams);
      expectValidQueryOptions(options);
    });

    it('should include all params in query key for cache separation', () => {
      const params: ProjectListQueryParams = {
        page: 1,
        size: 20,
        search: 'test',
        status: 'ACTIVE',
      };
      const options = projectQueries.list(params);

      expect(options.queryKey).toEqual([
        'projects',
        'list',
        1,
        20,
        'test',
        'ACTIVE',
      ]);
    });

    it('should include null values in query key when filters are empty', () => {
      const options = projectQueries.list(defaultParams);

      expect(options.queryKey).toEqual([
        'projects',
        'list',
        0,
        10,
        '',
        null,
      ]);
    });

    it('should have placeholderData set for smooth transitions', () => {
      const options = projectQueries.list(defaultParams);
      expect(options.placeholderData).toBeDefined();
    });

    it('should call getProjects with correct params in queryFn', async () => {
      const mockResponse = createMockPaginatedProjects([
        createMockProjectListItemResponse({ id: 1, projectName: 'Test Project' }),
      ]);
      vi.mocked(getProjects).mockResolvedValue(mockResponse);

      const options = projectQueries.list(defaultParams);
      await invokeQueryFn(options);

      expect(getProjects).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        search: undefined, // empty string converted to undefined
        status: undefined, // null converted to undefined
      });
    });

    it('should map response data using projectMapper.toListItem', async () => {
      const mockResponse = createMockPaginatedProjects([
        createMockProjectListItemResponse({ id: 1, projectName: 'Project 1' }),
        createMockProjectListItemResponse({ id: 2, projectName: 'Project 2' }),
      ]);
      vi.mocked(getProjects).mockResolvedValue(mockResponse);

      const options = projectQueries.list(defaultParams);
      const result = await invokeQueryFn<Paginated<unknown>>(options);

      expect(projectMapper.toListItem).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual(mockResponse.pagination);
    });
  });

  // ==========================================================================
  // Detail Query Tests
  // ==========================================================================

  describe('detail()', () => {
    it('should return valid queryOptions', () => {
      const options = projectQueries.detail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = projectQueries.detail(123);
      expect(options.queryKey).toEqual(['projects', 'detail', 123]);
    });

    it('should have 5-minute staleTime', () => {
      const options = projectQueries.detail(1);
      expect(options.staleTime).toBe(1000 * 60 * 5);
    });

    it('should call getProject with correct id in queryFn', async () => {
      const mockResponse = createMockProjectDetailsResponse({ id: 123, projectName: 'Test' });
      vi.mocked(getProject).mockResolvedValue(mockResponse);

      const options = projectQueries.detail(123);
      await invokeQueryFn(options);

      expect(getProject).toHaveBeenCalledWith(123);
    });

    it('should map response using projectMapper.toDomain', async () => {
      const mockResponse = createMockProjectDetailsResponse({ id: 123, projectName: 'Test Project' });
      vi.mocked(getProject).mockResolvedValue(mockResponse);

      const options = projectQueries.detail(123);
      const result = await invokeQueryFn(options);

      expect(projectMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual({ ...mockResponse, _mapped: true });
    });

    it('should generate different query keys for different ids', () => {
      const key1 = projectQueries.detail(1).queryKey;
      const key2 = projectQueries.detail(2).queryKey;

      expect(key1).not.toEqual(key2);
      expect(key1[2]).toBe(1);
      expect(key2[2]).toBe(2);
    });
  });

  // ==========================================================================
  // ByJobCode Query Tests
  // ==========================================================================

  describe('byJobCode()', () => {
    it('should return valid queryOptions', () => {
      const options = projectQueries.byJobCode('WK2-001-20250101');
      expectValidQueryOptions(options);
    });

    it('should include jobCode in query key', () => {
      const options = projectQueries.byJobCode('WK2-001-20250101');
      expect(options.queryKey).toEqual(['projects', 'byJobCode', 'WK2-001-20250101']);
    });

    it('should have 5-minute staleTime', () => {
      const options = projectQueries.byJobCode('WK2-001-20250101');
      expect(options.staleTime).toBe(1000 * 60 * 5);
    });

    it('should call getProjectByJobCode with correct jobCode in queryFn', async () => {
      const mockResponse = createMockProjectDetailsResponse({ id: 123, jobCode: 'WK2-001-20250101' });
      vi.mocked(getProjectByJobCode).mockResolvedValue(mockResponse);

      const options = projectQueries.byJobCode('WK2-001-20250101');
      await invokeQueryFn(options);

      expect(getProjectByJobCode).toHaveBeenCalledWith('WK2-001-20250101');
    });

    it('should map response using projectMapper.toDomain', async () => {
      const mockResponse = createMockProjectDetailsResponse({ id: 123, jobCode: 'WK2-001-20250101' });
      vi.mocked(getProjectByJobCode).mockResolvedValue(mockResponse);

      const options = projectQueries.byJobCode('WK2-001-20250101');
      const result = await invokeQueryFn(options);

      expect(projectMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual({ ...mockResponse, _mapped: true });
    });
  });

  // ==========================================================================
  // Summary Query Tests
  // ==========================================================================

  describe('summary()', () => {
    it('should return valid queryOptions', () => {
      const options = projectQueries.summary(123);
      expectValidQueryOptions(options);
    });

    it('should include projectId in query key', () => {
      const options = projectQueries.summary(123);
      expect(options.queryKey).toEqual(['projects', 'summary', 123]);
    });

    it('should have 2-minute staleTime', () => {
      const options = projectQueries.summary(123);
      expect(options.staleTime).toBe(1000 * 60 * 2);
    });

    it('should call projectSummaryApi.getSummary with correct projectId', async () => {
      const mockSummary = { projectId: 123, sections: [] };
      vi.mocked(projectSummaryApi.getSummary).mockResolvedValue(mockSummary);

      const options = projectQueries.summary(123);
      const result = await invokeQueryFn(options);

      expect(projectSummaryApi.getSummary).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockSummary);
    });
  });

  // ==========================================================================
  // KPI Query Tests
  // ==========================================================================

  describe('kpi()', () => {
    it('should return valid queryOptions', () => {
      const options = projectQueries.kpi(123);
      expectValidQueryOptions(options);
    });

    it('should include projectId in query key', () => {
      const options = projectQueries.kpi(123);
      expect(options.queryKey).toEqual(['projects', 'kpis', 123]);
    });

    it('should have 2-minute staleTime', () => {
      const options = projectQueries.kpi(123);
      expect(options.staleTime).toBe(1000 * 60 * 2);
    });

    it('should call projectSummaryApi.getKPIs with correct projectId', async () => {
      const mockKPI = {
        progressPercent: 50,
        pendingApprovals: 2,
        accountsReceivable: 1000000,
        invoicedAmount: 2000000,
      };
      vi.mocked(projectSummaryApi.getKPIs).mockResolvedValue(mockKPI);

      const options = projectQueries.kpi(123);
      const result = await invokeQueryFn(options);

      expect(projectSummaryApi.getKPIs).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockKPI);
    });
  });
});
