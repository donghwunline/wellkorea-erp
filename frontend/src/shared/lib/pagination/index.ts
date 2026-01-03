/**
 * Shared pagination utilities.
 *
 * Provides reusable pagination types, transforms, and search state management.
 */

// Types
export type { Paginated, PaginationMetadata, PagedResponse } from './types';

// Transform utilities
export { transformPagedResponse, createEmptyPaginated } from './transform';

// Search hook
export {
  usePaginatedSearch,
  type UsePaginatedSearchOptions,
  type UsePaginatedSearchReturn,
} from './usePaginatedSearch';
