/**
 * Project getter functions.
 *
 * HTTP GET operations for project data.
 * Returns raw responses - mapping to domain models happens in query factory.
 */

import { httpClient, PROJECT_ENDPOINTS, type PagedResponse } from '@/shared/api';
import {
  transformPagedResponse,
  type Paginated,
} from '@/shared/lib/pagination';
import type {
  ProjectDetailsResponse,
  ProjectListItemResponse,
  ProjectListParams,
} from './project.mapper';

/**
 * Get a single project by ID.
 *
 * @param id - Project ID
 * @returns Raw project response
 */
export async function getProject(id: number): Promise<ProjectDetailsResponse> {
  return httpClient.get<ProjectDetailsResponse>(PROJECT_ENDPOINTS.byId(id));
}

/**
 * Get a single project by JobCode.
 *
 * @param jobCode - Project JobCode
 * @returns Raw project response
 */
export async function getProjectByJobCode(jobCode: string): Promise<ProjectDetailsResponse> {
  return httpClient.get<ProjectDetailsResponse>(PROJECT_ENDPOINTS.byJobCode(jobCode));
}

/**
 * Get paginated list of projects.
 *
 * @param params - Query parameters (pagination, filters)
 * @returns Paginated response with project responses
 */
export async function getProjects(
  params?: ProjectListParams
): Promise<Paginated<ProjectListItemResponse>> {
  const response = await httpClient.requestWithMeta<PagedResponse<ProjectListItemResponse>>({
    method: 'GET',
    url: PROJECT_ENDPOINTS.BASE,
    params,
  });

  return transformPagedResponse(response.data, response.metadata);
}
