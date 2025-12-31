/**
 * User query key factory.
 *
 * Centralized query keys for cache management.
 * Keys use primitives only for stable serialization.
 */

export const userQueryKeys = {
  /**
   * Root key for all user queries.
   */
  all: ['users'] as const,

  /**
   * Base key for all list queries.
   */
  lists: () => [...userQueryKeys.all, 'list'] as const,

  /**
   * Key for specific list query with pagination/filters.
   */
  list: (
    page: number,
    size: number,
    search: string,
    sort: string
  ) => [...userQueryKeys.lists(), page, size, search, sort] as const,

  /**
   * Base key for all detail queries.
   */
  details: () => [...userQueryKeys.all, 'detail'] as const,

  /**
   * Key for specific user detail.
   */
  detail: (id: number) => [...userQueryKeys.details(), id] as const,

  /**
   * Key for user's customer assignments.
   */
  customers: (id: number) => [...userQueryKeys.all, 'customers', id] as const,
};
