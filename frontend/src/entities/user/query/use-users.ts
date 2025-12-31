/**
 * useUsers query hook.
 *
 * Fetches paginated list of users.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { userQueryKeys } from './query-keys';
import { userQueryFns, type PaginatedUsers } from './query-fns';

/**
 * Options for useUsers hook.
 */
export interface UseUsersOptions
  extends Omit<
    UseQueryOptions<
      PaginatedUsers,
      Error,
      PaginatedUsers,
      ReturnType<typeof userQueryKeys.list>
    >,
    'queryKey' | 'queryFn'
  > {
  /** Page number (0-indexed) */
  page?: number;
  /** Items per page */
  size?: number;
  /** Search query */
  search?: string;
  /** Sort field */
  sort?: string;
}

/**
 * Default values for list options.
 */
const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 10;
const DEFAULT_SEARCH = '';
const DEFAULT_SORT = '';

/**
 * Query hook for fetching paginated users.
 *
 * @example
 * ```tsx
 * function UserListPage() {
 *   const [page, setPage] = useState(0);
 *   const [search, setSearch] = useState('');
 *
 *   const { data, isLoading, error } = useUsers({
 *     page,
 *     size: 10,
 *     search,
 *   });
 *
 *   return (
 *     <>
 *       <SearchBar value={search} onChange={setSearch} />
 *       <UserTable users={data?.data ?? []} isLoading={isLoading} />
 *       <Pagination
 *         currentPage={page}
 *         totalPages={data?.pagination.totalPages ?? 0}
 *         onPageChange={setPage}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function useUsers({
  page = DEFAULT_PAGE,
  size = DEFAULT_SIZE,
  search = DEFAULT_SEARCH,
  sort = DEFAULT_SORT,
  ...options
}: UseUsersOptions = {}) {
  return useQuery({
    queryKey: userQueryKeys.list(page, size, search, sort),
    queryFn: userQueryFns.list({ page, size, search, sort }),
    ...options,
  });
}
