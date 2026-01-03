/**
 * Pagination types for query layer.
 *
 * Core types for handling paginated data in TanStack Query and UI components.
 */

/**
 * Pagination metadata from backend responses.
 * Matches Spring Data Page structure.
 */
export interface PaginationMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Generic paginated result wrapper.
 * Used by query factories to return paginated data with metadata.
 *
 * @example
 * const result: Paginated<User> = await getUsers();
 * console.log(result.data);                    // User[]
 * console.log(result.pagination.totalPages);   // number
 */
export interface Paginated<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Paged response structure from backend.
 * Used when backend returns paginated data objects directly in ApiResponse.data.
 *
 * This represents the backend's Page<T> structure, which differs from PaginationMetadata:
 * - Uses 'content' array for data
 * - Uses 'number' instead of 'page' for current page index
 *
 * @example
 * // Backend returns: ApiResponse<Page<UserResponse>>
 * const response = await httpClient.requestWithMeta<PagedResponse<User>>(...);
 * const users = response.data.content;
 * const currentPage = response.data.number;
 */
export interface PagedResponse<T> {
  content: T[];
  number: number; // Current page index (0-based)
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
