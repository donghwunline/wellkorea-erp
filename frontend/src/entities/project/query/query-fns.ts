/**
 * Project query functions.
 *
 * Reusable query functions for TanStack Query.
 * Transform DTOs to domain models.
 *
 * FSD Layer: entities/project/query
 */

import type { Project } from '../model';
import { projectApi, projectMapper } from '../api';

/**
 * Query function factories for project queries.
 *
 * Returns functions that can be used as TanStack Query queryFn.
 * All functions transform DTOs to domain models.
 */
export const projectQueryFns = {
  /**
   * Query function for fetching a single project by ID.
   *
   * @param id - Project ID
   */
  detail: (id: number) => async (): Promise<Project> => {
    const dto = await projectApi.getById(id);
    return projectMapper.toDomain(dto);
  },
};
