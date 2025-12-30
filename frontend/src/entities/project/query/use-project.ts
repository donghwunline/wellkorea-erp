/**
 * Single project query hook.
 *
 * Fetches and caches a single project by ID.
 * Returns domain model (not DTO).
 *
 * FSD Layer: entities/project/query
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { Project } from '../model';
import { projectQueryKeys } from './query-keys';
import { projectQueryFns } from './query-fns';

/**
 * Hook options for useProject.
 */
export interface UseProjectOptions extends Omit<
  UseQueryOptions<Project, Error, Project, ReturnType<typeof projectQueryKeys.detail>>,
  'queryKey' | 'queryFn'
> {
  /**
   * Project ID to fetch. If null, query is disabled.
   */
  id: number | null;
}

/**
 * Hook return type for useProject.
 * Maintains backward compatibility with legacy useProjectDetails.
 */
export interface UseProjectReturn {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for fetching a single project.
 *
 * Features:
 * - Auto-caches result with TanStack Query
 * - Returns domain model with business rules
 * - Deduplicates concurrent requests
 * - Handles null ID gracefully (disables query)
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * function ProjectDetail({ id }: { id: number | null }) {
 *   const { project, isLoading, error } = useProject({ id });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Alert variant="error">{error}</Alert>;
 *   if (!project) return null;
 *
 *   return <div>{project.projectName}</div>;
 * }
 * ```
 */
export function useProject({ id, ...options }: UseProjectOptions): UseProjectReturn {
  const query = useQuery({
    queryKey: projectQueryKeys.detail(id ?? 0),
    queryFn: projectQueryFns.detail(id ?? 0),
    enabled: id !== null && id > 0,
    ...options,
  });

  return {
    project: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
