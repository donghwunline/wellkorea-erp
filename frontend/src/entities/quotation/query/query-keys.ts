/**
 * Quotation query key factory.
 *
 * Centralized query keys for cache management.
 * Keys use primitives only for stable serialization.
 *
 * Pattern:
 * - all: Base key for all quotation data
 * - lists: Base for list queries
 * - list(params): Specific list with filters
 * - details: Base for detail queries
 * - detail(id): Specific detail
 */

import type { QuotationStatus } from '../model';

/**
 * Query key factory for quotation queries.
 *
 * Usage:
 * - Invalidate all: queryClient.invalidateQueries({ queryKey: quotationQueryKeys.all })
 * - Invalidate lists: queryClient.invalidateQueries({ queryKey: quotationQueryKeys.lists() })
 * - Invalidate specific: queryClient.invalidateQueries({ queryKey: quotationQueryKeys.detail(id) })
 */
export const quotationQueryKeys = {
  /**
   * Base key for all quotation queries.
   */
  all: ['quotations'] as const,

  /**
   * Base key for list queries.
   */
  lists: () => [...quotationQueryKeys.all, 'list'] as const,

  /**
   * Key for specific list with filters.
   * Uses primitives only - no objects in query keys.
   *
   * @param page - Page number (0-indexed)
   * @param size - Page size
   * @param search - Search term (empty string if none)
   * @param status - Status filter (null if none)
   * @param projectId - Project filter (null if none)
   */
  list: (
    page: number,
    size: number,
    search: string,
    status: QuotationStatus | null,
    projectId: number | null
  ) => [...quotationQueryKeys.lists(), page, size, search, status, projectId] as const,

  /**
   * Base key for detail queries.
   */
  details: () => [...quotationQueryKeys.all, 'detail'] as const,

  /**
   * Key for specific quotation detail.
   *
   * @param id - Quotation ID
   */
  detail: (id: number) => [...quotationQueryKeys.details(), id] as const,
};
