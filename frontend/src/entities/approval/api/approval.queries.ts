/**
 * Approval Query Factory.
 *
 * TanStack Query v5 query options factory.
 * Use with useQuery() directly - no custom hooks needed.
 *
 * @example
 * ```typescript
 * // List approvals with pagination
 * const { data } = useQuery(approvalQueries.list({ page: 0, size: 20 }));
 *
 * // Get approval detail
 * const { data } = useQuery(approvalQueries.detail(id));
 *
 * // Get approval history
 * const { data } = useQuery(approvalQueries.history(id));
 * ```
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import type { Paginated } from '@/shared/lib/pagination';
import type { Approval } from '../model/approval';
import type { ApprovalHistory } from '../model/approval-history';
import type { ApprovalStatus } from '../model/approval-status';
import type { EntityType } from '../model/entity-type';
import { approvalMapper, approvalHistoryMapper } from './approval.mapper';
import { getApproval, getApprovals } from './get-approval';
import { getApprovalHistory } from './get-approval-history';
import { getPendingApprovalCount } from './get-pending-count';

// =============================================================================
// Query Parameters
// =============================================================================

export interface ApprovalListQueryParams {
  page?: number;
  size?: number;
  entityType?: EntityType | null;
  status?: ApprovalStatus | null;
  myPending?: boolean;
}

// =============================================================================
// Query Factory
// =============================================================================

export const approvalQueries = {
  // -------------------------------------------------------------------------
  // Query Keys
  // -------------------------------------------------------------------------

  /** Base key for all approval queries */
  all: () => ['approvals'] as const,

  /** Key for approval list queries */
  lists: () => [...approvalQueries.all(), 'list'] as const,

  /** Key for approval detail queries */
  details: () => [...approvalQueries.all(), 'detail'] as const,

  /** Key for approval history queries */
  histories: () => [...approvalQueries.all(), 'history'] as const,

  /** Key for pending count query */
  pendingCountKey: () => [...approvalQueries.all(), 'pending-count'] as const,

  // -------------------------------------------------------------------------
  // Approval List Query
  // -------------------------------------------------------------------------

  /**
   * Query options for paginated approval list.
   */
  list: (params: ApprovalListQueryParams = {}) =>
    queryOptions({
      queryKey: [
        ...approvalQueries.lists(),
        params.page ?? 0,
        params.size ?? 10,
        params.entityType ?? null,
        params.status ?? null,
        params.myPending ?? false,
      ] as const,
      queryFn: async (): Promise<Paginated<Approval>> => {
        const response = await getApprovals({
          page: params.page ?? 0,
          size: params.size ?? 10,
          entityType: params.entityType ?? undefined,
          status: params.status ?? undefined,
          myPending: params.myPending ?? undefined,
        });

        return {
          data: response.data.map(approvalMapper.toDomain),
          pagination: response.pagination,
        };
      },
      placeholderData: keepPreviousData,
    }),

  // -------------------------------------------------------------------------
  // Approval Detail Query
  // -------------------------------------------------------------------------

  /**
   * Query options for approval detail.
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...approvalQueries.details(), id] as const,
      queryFn: async (): Promise<Approval> => {
        const response = await getApproval(id);
        return approvalMapper.toDomain(response);
      },
      enabled: id > 0,
    }),

  // -------------------------------------------------------------------------
  // Approval History Query
  // -------------------------------------------------------------------------

  /**
   * Query options for approval history.
   */
  history: (id: number) =>
    queryOptions({
      queryKey: [...approvalQueries.histories(), id] as const,
      queryFn: async (): Promise<ApprovalHistory[]> => {
        const responses = await getApprovalHistory(id);
        return responses.map(approvalHistoryMapper.toDomain);
      },
      enabled: id > 0,
    }),

  // -------------------------------------------------------------------------
  // Pending Count Query (for navigation badge)
  // -------------------------------------------------------------------------

  /**
   * Query options for pending approval count.
   * Used for badge display in navigation.
   */
  pendingCount: () =>
    queryOptions({
      queryKey: approvalQueries.pendingCountKey(),
      queryFn: getPendingApprovalCount,
      staleTime: 1000 * 10, // 10 seconds
      refetchInterval: 1000 * 10, // Refetch every 10 seconds
    }),
};
