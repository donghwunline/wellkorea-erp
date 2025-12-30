/**
 * Project query keys.
 *
 * Centralized query key factory for TanStack Query cache management.
 *
 * FSD Layer: entities/project/query
 */

/**
 * Query key factory for project queries.
 *
 * Structure:
 * - ['projects'] - all project-related queries
 * - ['projects', 'lists'] - all list queries
 * - ['projects', 'lists', ...params] - specific list query
 * - ['projects', 'detail', id] - single project by ID
 */
export const projectQueryKeys = {
  all: () => ['projects'] as const,

  lists: () => [...projectQueryKeys.all(), 'lists'] as const,

  list: (page: number, size: number, search?: string, status?: string) =>
    [...projectQueryKeys.lists(), page, size, search ?? '', status ?? ''] as const,

  details: () => [...projectQueryKeys.all(), 'detail'] as const,

  detail: (id: number) => [...projectQueryKeys.details(), id] as const,
};
