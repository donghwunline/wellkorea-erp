/**
 * Single approval query hook.
 *
 * Fetches and caches a single approval by ID.
 * Returns domain model (not DTO).
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { Approval } from '../model/approval';
import { approvalQueryKeys } from './query-keys';
import { approvalQueryFns } from './query-fns';

/**
 * Hook options for useApproval.
 */
export interface UseApprovalOptions
  extends Omit<
    UseQueryOptions<Approval, Error, Approval, ReturnType<typeof approvalQueryKeys.detail>>,
    'queryKey' | 'queryFn'
  > {
  /**
   * Approval ID to fetch.
   */
  id: number;
}

/**
 * Hook for fetching a single approval.
 *
 * Features:
 * - Auto-caches result with TanStack Query
 * - Returns domain model with business rules
 * - Deduplicates concurrent requests
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * function ApprovalDetail({ id }: { id: number }) {
 *   const { data: approval, isLoading, error } = useApproval({ id });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!approval) return null;
 *
 *   // Use domain rules
 *   const canAct = approvalRules.canAct(approval, currentUserId);
 *   const progress = approvalRules.getProgressPercentage(approval);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useApproval({ id, ...options }: UseApprovalOptions) {
  return useQuery({
    queryKey: approvalQueryKeys.detail(id),
    queryFn: approvalQueryFns.detail(id),
    ...options,
  });
}
