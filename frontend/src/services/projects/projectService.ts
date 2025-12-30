/**
 * Project management service.
 * Business logic layer for project operations.
 *
 * Features:
 * - Project CRUD operations
 * - DTO transformations
 * - Data normalization
 */

import { httpClient, PROJECT_ENDPOINTS } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import { transformPagedResponse } from '@/services/shared';
import type {
  CreateProjectRequest,
  PaginatedProjects,
  ProjectCommandResult,
  ProjectDetails,
  ProjectListParams,
  UpdateProjectRequest,
} from './types';

/**
 * Transform ProjectDetails DTO.
 * Normalizes data from API response.
 */
function transformProjectDetails(dto: ProjectDetails): ProjectDetails {
  return {
    ...dto,
    projectName: dto.projectName?.trim() ?? '',
    requesterName: dto.requesterName?.trim() ?? null,
  };
}

/**
 * Project management service.
 */
export const projectService = {
  /**
   * Get paginated list of projects.
   * Backend returns Page<ProjectResponse> structure.
   */
  async getProjects(params?: ProjectListParams): Promise<PaginatedProjects> {
    const response = await httpClient.requestWithMeta<PagedResponse<ProjectDetails>>({
      method: 'GET',
      url: PROJECT_ENDPOINTS.BASE,
      params,
    });

    const paginated = transformPagedResponse(response.data, response.metadata);
    return {
      ...paginated,
      data: paginated.data.map(transformProjectDetails),
    };
  },

  /**
   * Get project by ID.
   */
  async getProject(id: number): Promise<ProjectDetails> {
    const project = await httpClient.get<ProjectDetails>(PROJECT_ENDPOINTS.byId(id));
    return transformProjectDetails(project);
  },

  /**
   * Get project by JobCode.
   */
  async getProjectByJobCode(jobCode: string): Promise<ProjectDetails> {
    const project = await httpClient.get<ProjectDetails>(PROJECT_ENDPOINTS.byJobCode(jobCode));
    return transformProjectDetails(project);
  },

  /**
   * Create a new project.
   * Returns command result with ID and auto-generated JobCode.
   */
  async createProject(request: CreateProjectRequest): Promise<ProjectCommandResult> {
    return httpClient.post<ProjectCommandResult>(PROJECT_ENDPOINTS.BASE, request);
  },

  /**
   * Update an existing project.
   * Returns command result with ID.
   */
  async updateProject(id: number, request: UpdateProjectRequest): Promise<ProjectCommandResult> {
    return httpClient.put<ProjectCommandResult>(PROJECT_ENDPOINTS.byId(id), request);
  },
};
