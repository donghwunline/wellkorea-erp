/**
 * Approval history query hook.
 *
 * Fetches and caches the history of an approval.
 * Returns domain models (not DTOs).
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { ApprovalHistory } from '../model';
import { approvalQueryKeys } from './query-keys';
import { approvalQueryFns } from './query-fns';

/**
 * Hook options for useApprovalHistory.
 */
export interface UseApprovalHistoryOptions
  extends Omit<
    UseQueryOptions<
      ApprovalHistory[],
      Error,
      ApprovalHistory[],
      ReturnType<typeof approvalQueryKeys.history>
    >,
    'queryKey' | 'queryFn'
  > {
  /**
   * Approval ID to fetch history for.
   */
  id: number;
}

/**
 * Hook for fetching approval history.
 *
 * Features:
 * - Auto-caches result with TanStack Query
 * - Returns domain models with business rules
 * - Deduplicates concurrent requests
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * function ApprovalHistoryList({ approvalId }: { approvalId: number }) {
 *   const { data: history, isLoading, error } = useApprovalHistory({
 *     id: approvalId,
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!history?.length) return <EmptyState message="No history" />;
 *
 *   return (
 *     <ul>
 *       {history.map(entry => (
 *         <li key={entry.id}>
 *           {entry.actorName} - {approvalHistoryRules.getActionLabel(entry)}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useApprovalHistory({ id, ...options }: UseApprovalHistoryOptions) {
  return useQuery({
    queryKey: approvalQueryKeys.history(id),
    queryFn: approvalQueryFns.history(id),
    ...options,
  });
}
