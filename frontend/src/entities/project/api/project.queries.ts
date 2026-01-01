/**
 * Project Query Factory.
 *
 * Centralized query factory following TanStack Query v5 + FSD pattern.
 * Combines query keys and functions using queryOptions for type safety.
 *
 * @example
 * ```tsx
 * // Direct usage - no custom hook needed
 * const { data: project } = useQuery(projectQueries.detail(123));
 *
 * // List query with pagination
 * const { data } = useQuery(projectQueries.list({ page: 0, size: 10, search: '', status: null }));
 *
 * // Prefetching
 * queryClient.prefetchQuery(projectQueries.detail(nextId));
 *
 * // Cache invalidation
 * queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
 * ```
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import type { Project, ProjectListItem, ProjectStatus } from '../model';
import { projectMapper } from './project.mapper';
import { getProject, getProjectByJobCode, getProjects } from './get-project';
import type { Paginated } from '@/shared/lib/pagination';

/**
 * Parameters for list query.
 */
export interface ProjectListQueryParams {
  page: number;
  size: number;
  search: string;
  status: ProjectStatus | null;
}

/**
 * Project query factory.
 *
 * Follows FSD pattern with hierarchical keys and queryOptions.
 * All queries return domain models (not DTOs).
 */
export const projectQueries = {
  /**
   * Base key for all project queries.
   */
  all: () => ['projects'] as const,

  /**
   * Base key for list queries.
   */
  lists: () => [...projectQueries.all(), 'list'] as const,

  /**
   * Paginated list query with filters.
   *
   * @example
   * const { data } = useQuery(projectQueries.list({ page: 0, size: 10, search: '', status: null }));
   */
  list: (params: ProjectListQueryParams) =>
    queryOptions({
      queryKey: [
        ...projectQueries.lists(),
        params.page,
        params.size,
        params.search,
        params.status,
      ] as const,
      queryFn: async (): Promise<Paginated<ProjectListItem>> => {
        const response = await getProjects({
          page: params.page,
          size: params.size,
          search: params.search || undefined,
          status: params.status ?? undefined,
        });

        return {
          data: response.data.map(projectMapper.toListItem),
          pagination: response.pagination,
        };
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Base key for detail queries.
   */
  details: () => [...projectQueries.all(), 'detail'] as const,

  /**
   * Single project detail query by ID.
   *
   * @example
   * const { data: project } = useQuery(projectQueries.detail(123));
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...projectQueries.details(), id] as const,
      queryFn: async (): Promise<Project> => {
        const dto = await getProject(id);
        return projectMapper.toDomain(dto);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Base key for jobCode queries.
   */
  byJobCodes: () => [...projectQueries.all(), 'byJobCode'] as const,

  /**
   * Single project detail query by JobCode.
   *
   * @example
   * const { data: project } = useQuery(projectQueries.byJobCode('WK2-001-20250101'));
   */
  byJobCode: (jobCode: string) =>
    queryOptions({
      queryKey: [...projectQueries.byJobCodes(), jobCode] as const,
      queryFn: async (): Promise<Project> => {
        const dto = await getProjectByJobCode(jobCode);
        return projectMapper.toDomain(dto);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
