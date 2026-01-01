/**
 * Project getter functions.
 *
 * HTTP GET operations for project data.
 * Returns raw DTOs - mapping to domain models happens in query factory.
 *
 * @internal This module is internal to the entity and should not be exported.
 */

import { httpClient, PROJECT_ENDPOINTS, transformPagedResponse } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import type { Paginated } from '@/shared/lib/pagination';
import type {
  ProjectDetailsDTO,
  ProjectListItemDTO,
  ProjectListParamsDTO,
} from './project.dto';

export async function getProject(id: number): Promise<ProjectDetailsDTO> {
  return httpClient.get<ProjectDetailsDTO>(PROJECT_ENDPOINTS.byId(id));
}

export async function getProjectByJobCode(jobCode: string): Promise<ProjectDetailsDTO> {
  return httpClient.get<ProjectDetailsDTO>(PROJECT_ENDPOINTS.byJobCode(jobCode));
}

export async function getProjects(
  params?: ProjectListParamsDTO
): Promise<Paginated<ProjectListItemDTO>> {
  const response = await httpClient.requestWithMeta<PagedResponse<ProjectListItemDTO>>({
    method: 'GET',
    url: PROJECT_ENDPOINTS.BASE,
    params,
  });

  return transformPagedResponse(response.data, response.metadata);
}
