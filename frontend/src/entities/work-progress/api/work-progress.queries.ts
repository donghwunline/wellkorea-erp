/**
 * Work Progress Query Factory.
 *
 * Centralized query factory following TanStack Query v5 + FSD pattern.
 * Combines query keys and functions using queryOptions for type safety.
 *
 * Usage:
 * - Direct in components: useQuery(workProgressQueries.list(projectId))
 * - Prefetching: queryClient.prefetchQuery(workProgressQueries.detail(id))
 * - Invalidation: queryClient.invalidateQueries({ queryKey: workProgressQueries.lists() })
 */

import { queryOptions } from '@tanstack/react-query';
import type { Paginated } from '@/shared/lib/pagination/types';
import { transformPagedResponse } from '@/shared/lib/pagination';
import type { WorkProgressSheet, WorkProgressSheetListItem, ProjectProductionSummary } from '../model/work-progress-sheet';
import type { WorkProgressStep } from '../model/work-progress-step';
import { workProgressMapper, summaryMapper } from './work-progress.mapper';
import {
  getWorkProgressSheets,
  getWorkProgressSheet,
  getProjectSummary,
  getOutsourcedSteps,
} from './get-work-progress';

/**
 * Work progress query factory.
 *
 * Follows FSD pattern with hierarchical keys and queryOptions.
 * All queries return domain models (not DTOs).
 */
export const workProgressQueries = {
  /**
   * Base key for all work progress queries.
   */
  all: () => ['work-progress'] as const,

  /**
   * Base key for list queries.
   */
  lists: () => [...workProgressQueries.all(), 'list'] as const,

  /**
   * List query for a specific project (paginated).
   *
   * @example
   * const { data } = useQuery(workProgressQueries.list(projectId, 0, 100));
   */
  list: (projectId: number, page: number = 0, size: number = 100) =>
    queryOptions({
      queryKey: [...workProgressQueries.lists(), projectId, page, size] as const,
      queryFn: async (): Promise<Paginated<WorkProgressSheetListItem>> => {
        const response = await getWorkProgressSheets({ projectId, page, size });
        const paginated = transformPagedResponse(response);
        return {
          data: paginated.data.map(workProgressMapper.responseToListItem),
          pagination: paginated.pagination,
        };
      },
    }),

  /**
   * Base key for detail queries.
   */
  details: () => [...workProgressQueries.all(), 'detail'] as const,

  /**
   * Single work progress sheet detail query.
   *
   * @example
   * const { data } = useQuery(workProgressQueries.detail(123));
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...workProgressQueries.details(), id] as const,
      queryFn: async (): Promise<WorkProgressSheet> => {
        const response = await getWorkProgressSheet(id);
        return workProgressMapper.toDomain(response);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Base key for project summary queries.
   */
  summaries: () => [...workProgressQueries.all(), 'summary'] as const,

  /**
   * Project production summary query.
   *
   * @example
   * const { data } = useQuery(workProgressQueries.projectSummary(projectId));
   */
  projectSummary: (projectId: number) =>
    queryOptions({
      queryKey: [...workProgressQueries.summaries(), projectId] as const,
      queryFn: async (): Promise<ProjectProductionSummary> => {
        const response = await getProjectSummary(projectId);
        return summaryMapper.toDomain(response);
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Base key for outsourced steps queries.
   */
  outsourced: () => [...workProgressQueries.all(), 'outsourced'] as const,

  /**
   * Outsourced steps query for a project.
   *
   * @example
   * const { data } = useQuery(workProgressQueries.outsourcedSteps(projectId));
   */
  outsourcedSteps: (projectId: number) =>
    queryOptions({
      queryKey: [...workProgressQueries.outsourced(), projectId] as const,
      queryFn: async (): Promise<WorkProgressStep[]> => {
        const responses = await getOutsourcedSteps(projectId);
        return responses.map(workProgressMapper.stepToDomain);
      },
    }),

  /**
   * Base key for all sheets queries (cross-project).
   */
  allSheetLists: () => [...workProgressQueries.all(), 'all'] as const,

  /**
   * All work progress sheets across all projects (paginated).
   *
   * @example
   * const { data } = useQuery(workProgressQueries.allSheets(0, 20));
   */
  allSheets: (page: number, size: number) =>
    queryOptions({
      queryKey: [...workProgressQueries.allSheetLists(), page, size] as const,
      queryFn: async (): Promise<Paginated<WorkProgressSheetListItem>> => {
        const response = await getWorkProgressSheets({ page, size });
        const paginated = transformPagedResponse(response);
        return {
          data: paginated.data.map(workProgressMapper.responseToListItem),
          pagination: paginated.pagination,
        };
      },
    }),
};
