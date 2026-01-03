/**
 * Project API functions.
 *
 * @deprecated Use projectQueries (for reads) and createProject/updateProject (for writes) instead.
 * This file is kept for backward compatibility with legacy components.
 */

import { httpClient, PROJECT_ENDPOINTS, type PagedResponse } from '@/shared/api';
import {
  transformPagedResponse,
  type Paginated,
} from '@/shared/lib/pagination';
import type {
  ProjectDetailsDTO,
  ProjectListItemDTO,
  ProjectCommandResultDTO,
  CreateProjectRequestDTO,
  UpdateProjectRequestDTO,
  ProjectListParamsDTO,
} from './project.dto';

/**
 * @deprecated Use projectQueries and command functions instead.
 */
export const projectApi = {
  async getList(params?: ProjectListParamsDTO): Promise<Paginated<ProjectListItemDTO>> {
    const response = await httpClient.requestWithMeta<PagedResponse<ProjectListItemDTO>>({
      method: 'GET',
      url: PROJECT_ENDPOINTS.BASE,
      params,
    });
    return transformPagedResponse(response.data, response.metadata);
  },

  async getById(id: number): Promise<ProjectDetailsDTO> {
    return httpClient.get<ProjectDetailsDTO>(PROJECT_ENDPOINTS.byId(id));
  },

  async getByJobCode(jobCode: string): Promise<ProjectDetailsDTO> {
    return httpClient.get<ProjectDetailsDTO>(PROJECT_ENDPOINTS.byJobCode(jobCode));
  },

  async create(request: CreateProjectRequestDTO): Promise<ProjectCommandResultDTO> {
    return httpClient.post<ProjectCommandResultDTO>(PROJECT_ENDPOINTS.BASE, request);
  },

  async update(id: number, request: UpdateProjectRequestDTO): Promise<ProjectCommandResultDTO> {
    return httpClient.put<ProjectCommandResultDTO>(PROJECT_ENDPOINTS.byId(id), request);
  },
};
