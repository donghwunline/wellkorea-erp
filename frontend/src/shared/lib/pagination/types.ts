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
