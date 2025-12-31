/**
 * useAuditLogs hook.
 *
 * TanStack Query hook for fetching paginated audit logs.
 */

import { useQuery } from '@tanstack/react-query';
import { auditQueryKeys } from './query-keys';
import { auditQueryFns, type AuditLogListParams, type PaginatedAuditLogs } from './query-fns';

/**
 * Hook options.
 */
export interface UseAuditLogsOptions {
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Hook parameters - combined with options.
 */
export interface UseAuditLogsParams extends AuditLogListParams, UseAuditLogsOptions {}

/**
 * Fetch paginated list of audit logs.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAuditLogs({
 *   page: 0,
 *   size: 10,
 *   entityType: 'User',
 *   action: 'CREATE',
 * });
 *
 * if (data) {
 *   console.log(data.data); // AuditLog[]
 *   console.log(data.pagination); // PaginationMetadata
 * }
 * ```
 */
export function useAuditLogs(params: UseAuditLogsParams = {}) {
  const {
    page = 0,
    size = 10,
    sort,
    username,
    action,
    entityType,
    startDate,
    endDate,
    enabled = true,
  } = params;

  return useQuery<PaginatedAuditLogs>({
    queryKey: auditQueryKeys.list(
      page,
      size,
      sort,
      username,
      action,
      entityType,
      startDate,
      endDate
    ),
    queryFn: () =>
      auditQueryFns.list({
        page,
        size,
        sort,
        username,
        action,
        entityType,
        startDate,
        endDate,
      }),
    enabled,
  });
}
