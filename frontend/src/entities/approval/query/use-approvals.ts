/**
 * Paginated approvals query hook.
 *
 * Fetches and caches a paginated list of approvals.
 * Returns domain models (not DTOs).
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { ApprovalStatus, EntityType } from '../model';
import { approvalQueryKeys } from './query-keys';
import { approvalQueryFns, type PaginatedApprovals, type ApprovalListParams } from './query-fns';

/**
 * Hook parameters for useApprovals.
 */
export interface UseApprovalsParams {
  page?: number;
  size?: number;
  entityType?: EntityType | null;
  status?: ApprovalStatus | null;
  myPending?: boolean;
}

/**
 * Hook options for useApprovals.
 */
export type UseApprovalsOptions = Omit<
  UseQueryOptions<
    PaginatedApprovals,
    Error,
    PaginatedApprovals,
    ReturnType<typeof approvalQueryKeys.list>
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Hook for fetching paginated approvals.
 *
 * Features:
 * - Auto-caches result with TanStack Query
 * - Supports filtering by entity type, status, and my pending
 * - Returns domain models with business rules
 *
 * @param params - Query parameters
 * @param options - Additional query options
 *
 * @example
 * ```tsx
 * function ApprovalList() {
 *   const { data, isLoading, error } = useApprovals({
 *     page: 0,
 *     size: 10,
 *     myPending: true,
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!data) return null;
 *
 *   return (
 *     <div>
 *       {data.data.map(approval => (
 *         <ApprovalCard key={approval.id} approval={approval} />
 *       ))}
 *       <Pagination
 *         currentPage={0}
 *         totalPages={data.totalPages}
 *         totalElements={data.totalElements}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useApprovals(
  params: UseApprovalsParams = {},
  options: UseApprovalsOptions = {}
) {
  const page = params.page ?? 0;
  const size = params.size ?? 20;
  const entityType = params.entityType ?? null;
  const status = params.status ?? null;
  const myPending = params.myPending ?? false;

  const queryParams: ApprovalListParams = {
    page,
    size,
    entityType,
    status,
    myPending,
  };

  return useQuery({
    queryKey: approvalQueryKeys.list(page, size, entityType, status, myPending),
    queryFn: approvalQueryFns.list(queryParams),
    ...options,
  });
}
