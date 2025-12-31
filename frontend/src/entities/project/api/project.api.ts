/**
 * Project API functions.
 *
 * Low-level HTTP functions for project operations.
 * Returns DTOs only - use query hooks for domain models with caching.
 *
 * FSD Layer: entities/project/api
 */

import { httpClient, PROJECT_ENDPOINTS, transformPagedResponse } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import type { Paginated } from '@/shared/pagination';
import type {
  ProjectDetailsDTO,
  ProjectListItemDTO,
  ProjectCommandResultDTO,
  CreateProjectRequestDTO,
  UpdateProjectRequestDTO,
  ProjectListParamsDTO,
} from './project.dto';

/**
 * Project API functions.
 *
 * Returns DTOs only - use query hooks for domain models.
 */
export const projectApi = {
  /**
   * Get paginated list of projects.
   */
  async getList(params?: ProjectListParamsDTO): Promise<Paginated<ProjectListItemDTO>> {
    const response = await httpClient.requestWithMeta<PagedResponse<ProjectListItemDTO>>({
      method: 'GET',
      url: PROJECT_ENDPOINTS.BASE,
      params,
    });
    return transformPagedResponse(response.data, response.metadata);
  },

  /**
   * Get project by ID.
   */
  async getById(id: number): Promise<ProjectDetailsDTO> {
    return httpClient.get<ProjectDetailsDTO>(PROJECT_ENDPOINTS.byId(id));
  },

  /**
   * Get project by JobCode.
   */
  async getByJobCode(jobCode: string): Promise<ProjectDetailsDTO> {
    return httpClient.get<ProjectDetailsDTO>(PROJECT_ENDPOINTS.byJobCode(jobCode));
  },

  /**
   * Create a new project.
   * Returns command result with ID and auto-generated JobCode.
   */
  async create(request: CreateProjectRequestDTO): Promise<ProjectCommandResultDTO> {
    return httpClient.post<ProjectCommandResultDTO>(PROJECT_ENDPOINTS.BASE, request);
  },

  /**
   * Update an existing project.
   */
  async update(id: number, request: UpdateProjectRequestDTO): Promise<ProjectCommandResultDTO> {
    return httpClient.put<ProjectCommandResultDTO>(PROJECT_ENDPOINTS.byId(id), request);
  },
};
