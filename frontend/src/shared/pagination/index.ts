/**
 * Shared pagination utilities.
 *
 * Provides reusable pagination types and search state management.
 */

export type { Paginated, PaginationMetadata } from './types';

export {
  usePaginatedSearch,
  type UsePaginatedSearchOptions,
  type UsePaginatedSearchReturn,
} from './usePaginatedSearch';
