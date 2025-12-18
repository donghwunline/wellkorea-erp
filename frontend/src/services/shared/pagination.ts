/**
 * Pagination utilities for service layer.
 *
 * Provides utilities for transforming backend PagedResponse structures
 * to frontend Paginated format with normalized pagination metadata.
 */

import type { PagedResponse, PaginationMetadata, Paginated } from '@/api/types';

/**
 * Transform backend PagedResponse to frontend Paginated format.
 *
 * Handles two sources of pagination data:
 * 1. metadata field (PaginationMetadata) - preferred when available
 * 2. PagedResponse structure fields - fallback for backward compatibility
 *
 * @param pagedData - Backend PagedResponse<T> structure containing content array and page info
 * @param metadata - Optional metadata field from ApiResponse
 * @returns Normalized Paginated<T> structure for frontend consumption
 *
 * @example
 * ```typescript
 * const response = await httpClient.requestWithMeta<PagedResponse<UserDto>>({ ... });
 * const paginated = transformPagedResponse(response.data, response.metadata);
 * // Result: { data: UserDto[], pagination: PaginationMetadata }
 * ```
 */
export function transformPagedResponse<T>(
  pagedData: PagedResponse<T>,
  metadata?: unknown
): Paginated<T> {
  const paginationMetadata = metadata as PaginationMetadata | undefined;

  return {
    data: pagedData.content,
    pagination: {
      page: paginationMetadata?.page ?? pagedData.number,
      size: paginationMetadata?.size ?? pagedData.size,
      totalElements: paginationMetadata?.totalElements ?? pagedData.totalElements,
      totalPages: paginationMetadata?.totalPages ?? pagedData.totalPages,
      first: paginationMetadata?.first ?? pagedData.first,
      last: paginationMetadata?.last ?? pagedData.last,
    },
  };
}

/**
 * Create an empty paginated response.
 * Useful for initializing state or handling empty results.
 *
 * @returns Empty Paginated<T> structure with zero pages/elements
 *
 * @example
 * ```typescript
 * const [users, setUsers] = useState<Paginated<User>>(createEmptyPaginated());
 * ```
 */
export function createEmptyPaginated<T>(): Paginated<T> {
  return {
    data: [],
    pagination: {
      page: 0,
      size: 0,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    },
  };
}
