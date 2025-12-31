/**
 * Audit query keys for TanStack Query.
 *
 * Structured key factory for cache management.
 * Keys use primitives only (no objects) for stable serialization.
 */

export const auditQueryKeys = {
  /** Root key for all audit queries */
  all: ['audit'] as const,

  /** Key for list queries */
  lists: () => [...auditQueryKeys.all, 'list'] as const,

  /**
   * Key for paginated list with filters.
   * Each filter is a separate primitive for stable hashing.
   */
  list: (
    page: number,
    size: number,
    sort: string | undefined,
    username: string | undefined,
    action: string | undefined,
    entityType: string | undefined,
    startDate: string | undefined,
    endDate: string | undefined
  ) =>
    [
      ...auditQueryKeys.lists(),
      page,
      size,
      sort,
      username,
      action,
      entityType,
      startDate,
      endDate,
    ] as const,

  /** Key for detail queries */
  details: () => [...auditQueryKeys.all, 'detail'] as const,

  /** Key for single audit log by ID */
  detail: (id: number) => [...auditQueryKeys.details(), id] as const,
};
