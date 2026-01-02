/**
 * useAuditLog hook.
 *
 * TanStack Query hook for fetching a single audit log by ID.
 */

import { useQuery } from '@tanstack/react-query';
import type { AuditLog } from '../model/audit-log';
import { auditQueryKeys } from './query-keys';
import { auditQueryFns } from './query-fns';

/**
 * Hook options.
 */
export interface UseAuditLogOptions {
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Fetch single audit log by ID.
 *
 * @param id - Audit log ID
 * @param options - Query options
 *
 * @example
 * ```tsx
 * const { data: log, isLoading } = useAuditLog(123);
 *
 * if (log) {
 *   console.log(log.action, log.entityType);
 * }
 * ```
 */
export function useAuditLog(id: number, options: UseAuditLogOptions = {}) {
  const { enabled = true } = options;

  return useQuery<AuditLog>({
    queryKey: auditQueryKeys.detail(id),
    queryFn: () => auditQueryFns.detail(id),
    enabled: enabled && id > 0,
  });
}
