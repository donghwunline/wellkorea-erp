/**
 * Project API functions.
 *
 * Low-level HTTP functions for project operations.
 * Returns DTOs only - use query hooks for domain models with caching.
 *
 * FSD Layer: entities/project/api
 */

import { httpClient, PROJECT_ENDPOINTS } from '@/shared/api';
import type { ProjectDetailsDTO } from './project.dto';

/**
 * Project API functions.
 *
 * Returns DTOs only - use query hooks for domain models.
 */
export const projectApi = {
  /**
   * Get project by ID.
   *
   * @param id - Project ID
   */
  async getById(id: number): Promise<ProjectDetailsDTO> {
    return httpClient.get<ProjectDetailsDTO>(PROJECT_ENDPOINTS.byId(id));
  },

  /**
   * Get project by JobCode.
   *
   * @param jobCode - Project job code
   */
  async getByJobCode(jobCode: string): Promise<ProjectDetailsDTO> {
    return httpClient.get<ProjectDetailsDTO>(PROJECT_ENDPOINTS.byJobCode(jobCode));
  },
};
