/**
 * Task Flow Query Factory.
 * Provides query options for TanStack Query.
 * Exported from entity barrel.
 */

import { queryOptions } from '@tanstack/react-query';
import { getTaskFlow, getTaskFlowById } from './get-task-flow';
import { taskFlowMapper } from './task-flow.mapper';
import type { TaskFlow } from '../model/task-flow';

export const taskFlowQueries = {
  /**
   * Base query key for all task flow queries.
   */
  all: () => ['task-flows'] as const,

  /**
   * Query key for task flows by project.
   */
  byProjects: () => [...taskFlowQueries.all(), 'project'] as const,

  /**
   * Query key for task flow details.
   */
  details: () => [...taskFlowQueries.all(), 'detail'] as const,

  /**
   * Query options for fetching task flow by project ID.
   * Creates a new empty flow if one doesn't exist.
   */
  byProject: (projectId: number) =>
    queryOptions({
      queryKey: [...taskFlowQueries.byProjects(), projectId] as const,
      queryFn: async (): Promise<TaskFlow> => {
        const response = await getTaskFlow({ projectId });
        return taskFlowMapper.toDomain(response);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Query options for fetching task flow by ID.
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...taskFlowQueries.details(), id] as const,
      queryFn: async (): Promise<TaskFlow> => {
        const response = await getTaskFlowById(id);
        return taskFlowMapper.toDomain(response);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
