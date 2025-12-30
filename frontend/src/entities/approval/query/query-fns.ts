/**
 * Approval query functions.
 *
 * Reusable query functions that always return domain models.
 * Must be used in all query hooks, prefetchQuery, ensureQueryData calls
 * to maintain consistent cache data format.
 */

import type { Approval, ApprovalHistory, ApprovalStatus, EntityType } from '../model';
import { approvalApi, approvalMapper, approvalHistoryMapper } from '../api';
import type { Paginated } from '@/shared/api/types';

/**
 * Parameters for list query.
 */
export interface ApprovalListParams {
  page: number;
  size: number;
  entityType: EntityType | null;
  status: ApprovalStatus | null;
  myPending: boolean;
}

/**
 * Paginated approval result with domain models.
 * Extends Paginated with flattened pagination properties for convenience.
 */
export interface PaginatedApprovals extends Paginated<Approval> {
  // Flattened pagination properties for convenience
  totalPages: number;
  totalElements: number;
  size: number;
  first: boolean;
  last: boolean;
}

/**
 * Query functions for approval data.
 *
 * These functions:
 * 1. Call the API
 * 2. Map DTOs to domain models
 * 3. Return domain models (never DTOs)
 *
 * Usage:
 * - useQuery({ queryKey: ..., queryFn: approvalQueryFns.detail(id) })
 * - queryClient.prefetchQuery({ queryKey: ..., queryFn: approvalQueryFns.detail(id) })
 */
export const approvalQueryFns = {
  /**
   * Query function for single approval.
   * Returns a function that fetches and maps to domain model.
   *
   * @param id - Approval ID
   */
  detail: (id: number) => async (): Promise<Approval> => {
    const dto = await approvalApi.getById(id);
    return approvalMapper.toDomain(dto);
  },

  /**
   * Query function for paginated approval list.
   * Returns a function that fetches and maps to domain models.
   *
   * @param params - Query parameters
   */
  list: (params: ApprovalListParams) => async (): Promise<PaginatedApprovals> => {
    const response = await approvalApi.getList({
      page: params.page,
      size: params.size,
      entityType: params.entityType ?? undefined,
      status: params.status ?? undefined,
      myPending: params.myPending || undefined,
    });

    return {
      data: response.data.map(approvalMapper.toDomain),
      pagination: response.pagination,
      // Flatten pagination properties for convenience
      totalPages: response.pagination.totalPages,
      totalElements: response.pagination.totalElements,
      size: response.pagination.size,
      first: response.pagination.first,
      last: response.pagination.last,
    };
  },

  /**
   * Query function for approval history.
   * Returns a function that fetches and maps to domain models.
   *
   * @param id - Approval ID
   */
  history: (id: number) => async (): Promise<ApprovalHistory[]> => {
    const dtos = await approvalApi.getHistory(id);
    return dtos.map(approvalHistoryMapper.toDomain);
  },
};
