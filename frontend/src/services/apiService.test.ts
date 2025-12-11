/**
 * Tests for ApiService wrapper that unwraps ApiResponse<T> from backend.
 *
 * This service sits between UI/hooks and the raw axios client (./api).
 * It handles unwrapping the standard ApiResponse wrapper from backend responses.
 */

import {describe, it, expect, beforeEach, vi, type Mock} from 'vitest';
import type {AxiosResponse} from 'axios';
import type {ApiResponse, PaginationMetadata} from '@/types/api';

// Mock the api module before importing apiService
vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import after mocking
const apiModule = await import('./api');
const api = apiModule.default;
const {apiService} = await import('./apiService');

// Helper to create mock ApiResponse from backend
function createMockApiResponse<T>(
  data: T,
  overrides?: Partial<ApiResponse<T>>
): ApiResponse<T> {
  return {
    success: true,
    message: 'Success',
    data,
    timestamp: '2025-12-11T10:00:00',
    metadata: undefined,
    ...overrides,
  };
}

// Helper to create mock AxiosResponse wrapping ApiResponse
function createMockAxiosResponse<T>(
  apiResponse: ApiResponse<T>
): AxiosResponse<ApiResponse<T>> {
  return {
    data: apiResponse,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as AxiosResponse['config'],
  };
}

// Helper to create pagination metadata matching backend Spring Page structure
function createPaginationMetadata(
  overrides?: Partial<PaginationMetadata>
): PaginationMetadata {
  return {
    page: 0,
    size: 20,
    totalElements: 100,
    totalPages: 5,
    first: true,
    last: false,
    ...overrides,
  };
}

// Sample test data
interface Project {
  id: number;
  jobCode: string;
  projectName: string;
}

const sampleProject: Project = {
  id: 1,
  jobCode: 'WK2025-000001-20250101',
  projectName: 'Sample Project',
};

const sampleProjects: Project[] = [
  sampleProject,
  {id: 2, jobCode: 'WK2025-000002-20250101', projectName: 'Project 2'},
];

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get<T>', () => {
    it('should unwrap data from ApiResponse', async () => {
      const apiResponse = createMockApiResponse(sampleProject);
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.get<Project>('/projects/1');

      expect(api.get).toHaveBeenCalledWith('/projects/1', undefined);
      expect(result).toEqual(sampleProject);
    });

    it('should pass config to underlying api', async () => {
      const apiResponse = createMockApiResponse(sampleProjects);
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const config = {params: {page: 0, size: 20}};
      await apiService.get<Project[]>('/projects', config);

      expect(api.get).toHaveBeenCalledWith('/projects', config);
    });

    it('should propagate errors from underlying api', async () => {
      const error = new Error('Network error');
      (api.get as Mock).mockRejectedValue(error);

      await expect(apiService.get('/projects/1')).rejects.toThrow('Network error');
    });

    it('should handle null data', async () => {
      const apiResponse = createMockApiResponse(null);
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.get<null>('/projects/deleted');

      expect(result).toBeNull();
    });
  });

  describe('post<T>', () => {
    it('should unwrap data from ApiResponse', async () => {
      const apiResponse = createMockApiResponse(sampleProject, {
        message: 'Project created successfully',
      });
      (api.post as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.post<Project>('/projects', {
        projectName: 'New Project',
      });

      expect(api.post).toHaveBeenCalledWith(
        '/projects',
        {projectName: 'New Project'},
        undefined
      );
      expect(result).toEqual(sampleProject);
    });

    it('should handle post without data', async () => {
      const apiResponse = createMockApiResponse({success: true});
      (api.post as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      await apiService.post('/projects/1/approve');

      expect(api.post).toHaveBeenCalledWith('/projects/1/approve', undefined, undefined);
    });

    it('should pass config to underlying api', async () => {
      const apiResponse = createMockApiResponse(sampleProject);
      (api.post as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const config = {headers: {'X-Custom': 'value'}};
      await apiService.post('/projects', {name: 'Test'}, config);

      expect(api.post).toHaveBeenCalledWith('/projects', {name: 'Test'}, config);
    });
  });

  describe('put<T>', () => {
    it('should unwrap data from ApiResponse', async () => {
      const updatedProject = {...sampleProject, projectName: 'Updated Project'};
      const apiResponse = createMockApiResponse(updatedProject);
      (api.put as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.put<Project>('/projects/1', updatedProject);

      expect(api.put).toHaveBeenCalledWith('/projects/1', updatedProject, undefined);
      expect(result).toEqual(updatedProject);
    });

    it('should handle put without data', async () => {
      const apiResponse = createMockApiResponse({updated: true});
      (api.put as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      await apiService.put('/projects/1/reset');

      expect(api.put).toHaveBeenCalledWith('/projects/1/reset', undefined, undefined);
    });
  });

  describe('patch<T>', () => {
    it('should unwrap data from ApiResponse', async () => {
      const patchedProject = {...sampleProject, projectName: 'Patched Name'};
      const apiResponse = createMockApiResponse(patchedProject);
      (api.patch as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.patch<Project>('/projects/1', {
        projectName: 'Patched Name',
      });

      expect(api.patch).toHaveBeenCalledWith(
        '/projects/1',
        {projectName: 'Patched Name'},
        undefined
      );
      expect(result).toEqual(patchedProject);
    });
  });

  describe('delete<T>', () => {
    it('should unwrap data from ApiResponse', async () => {
      const apiResponse = createMockApiResponse(null, {
        message: 'Project deleted successfully',
      });
      (api.delete as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.delete<null>('/projects/1');

      expect(api.delete).toHaveBeenCalledWith('/projects/1', undefined);
      expect(result).toBeNull();
    });

    it('should pass config to underlying api', async () => {
      const apiResponse = createMockApiResponse({deleted: true});
      (api.delete as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const config = {params: {force: true}};
      await apiService.delete('/projects/1', config);

      expect(api.delete).toHaveBeenCalledWith('/projects/1', config);
    });
  });

  describe('getWithMeta<T>', () => {
    it('should return data, message, timestamp, and metadata', async () => {
      const apiResponse = createMockApiResponse(sampleProject, {
        message: 'Project retrieved successfully',
        timestamp: '2025-12-11T15:30:00',
        metadata: {customField: 'value'},
      });
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.getWithMeta<Project>('/projects/1');

      expect(result).toEqual({
        data: sampleProject,
        message: 'Project retrieved successfully',
        timestamp: '2025-12-11T15:30:00',
        metadata: {customField: 'value'},
      });
    });

    it('should handle undefined metadata', async () => {
      const apiResponse = createMockApiResponse(sampleProject);
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.getWithMeta<Project>('/projects/1');

      expect(result.metadata).toBeUndefined();
    });

    it('should pass config to underlying api', async () => {
      const apiResponse = createMockApiResponse(sampleProjects);
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const config = {params: {sort: 'createdAt,desc'}};
      await apiService.getWithMeta<Project[]>('/projects', config);

      expect(api.get).toHaveBeenCalledWith('/projects', config);
    });
  });

  describe('postWithMeta<T>', () => {
    it('should return full response structure', async () => {
      const apiResponse = createMockApiResponse(sampleProject, {
        message: 'Project created successfully',
        timestamp: '2025-12-11T16:00:00',
      });
      (api.post as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.postWithMeta<Project>('/projects', {
        projectName: 'New Project',
      });

      expect(result).toEqual({
        data: sampleProject,
        message: 'Project created successfully',
        timestamp: '2025-12-11T16:00:00',
        metadata: undefined,
      });
    });

    it('should handle post without data', async () => {
      const apiResponse = createMockApiResponse({approved: true}, {
        message: 'Project approved',
      });
      (api.post as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.postWithMeta('/projects/1/approve');

      expect(api.post).toHaveBeenCalledWith('/projects/1/approve', undefined, undefined);
      expect(result.message).toBe('Project approved');
    });
  });

  describe('getPaginated<T>', () => {
    it('should return data and pagination metadata', async () => {
      const pagination = createPaginationMetadata();
      const apiResponse = createMockApiResponse(sampleProjects, {
        message: 'Projects retrieved successfully',
        metadata: pagination as unknown as Record<string, unknown>,
      });
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.getPaginated<Project>('/projects', {
        params: {page: 0, size: 20},
      });

      expect(result.data).toEqual(sampleProjects);
      expect(result.pagination).toEqual(pagination);
    });

    it('should throw error when pagination metadata is missing', async () => {
      const apiResponse = createMockApiResponse(sampleProjects, {
        metadata: undefined,
      });
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      await expect(apiService.getPaginated<Project>('/projects')).rejects.toThrow(
        'Response does not contain valid pagination metadata. Use get() instead.'
      );
    });

    it('should throw error when pagination metadata is incomplete', async () => {
      const apiResponse = createMockApiResponse(sampleProjects, {
        metadata: {page: 0, size: 20}, // Missing totalElements, totalPages, first, last
      });
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      await expect(apiService.getPaginated<Project>('/projects')).rejects.toThrow(
        'Response does not contain valid pagination metadata. Use get() instead.'
      );
    });

    it('should throw error when pagination metadata has wrong types', async () => {
      const apiResponse = createMockApiResponse(sampleProjects, {
        metadata: {
          page: '0', // string instead of number
          size: 20,
          totalElements: 100,
          totalPages: 5,
          first: true,
          last: false,
        } as unknown as Record<string, unknown>,
      });
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      await expect(apiService.getPaginated<Project>('/projects')).rejects.toThrow(
        'Response does not contain valid pagination metadata. Use get() instead.'
      );
    });

    it('should handle empty data array with valid pagination', async () => {
      const pagination = createPaginationMetadata({
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      });
      const apiResponse = createMockApiResponse<Project[]>([], {
        metadata: pagination as unknown as Record<string, unknown>,
      });
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.getPaginated<Project>('/projects');

      expect(result.data).toEqual([]);
      expect(result.pagination.totalElements).toBe(0);
    });

    it('should handle last page pagination', async () => {
      const pagination = createPaginationMetadata({
        page: 4,
        first: false,
        last: true,
      });
      const apiResponse = createMockApiResponse(sampleProjects, {
        metadata: pagination as unknown as Record<string, unknown>,
      });
      (api.get as Mock).mockResolvedValue(createMockAxiosResponse(apiResponse));

      const result = await apiService.getPaginated<Project>('/projects', {
        params: {page: 4},
      });

      expect(result.pagination.last).toBe(true);
      expect(result.pagination.first).toBe(false);
    });
  });

  describe('error propagation', () => {
    it('should propagate AxiosError from underlying api', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            timestamp: '2025-12-11T10:00:00',
            status: 404,
            errorCode: 'RES_001',
            message: 'Project not found',
            path: '/api/projects/999',
          },
        },
        message: 'Request failed with status code 404',
      };
      (api.get as Mock).mockRejectedValue(axiosError);

      await expect(apiService.get('/projects/999')).rejects.toMatchObject({
        isAxiosError: true,
        response: {status: 404},
      });
    });

    it('should propagate network errors', async () => {
      const networkError = new Error('Network Error');
      (api.post as Mock).mockRejectedValue(networkError);

      await expect(
        apiService.post('/projects', {name: 'Test'})
      ).rejects.toThrow('Network Error');
    });
  });

  describe('singleton instance', () => {
    it('should export apiService as singleton', async () => {
      const {apiService: instance1} = await import('./apiService');
      const {apiService: instance2} = await import('./apiService');

      expect(instance1).toBe(instance2);
    });

    it('should export default as same instance', async () => {
      const {default: defaultExport, apiService: namedExport} = await import('./apiService');

      expect(defaultExport).toBe(namedExport);
    });
  });
});
