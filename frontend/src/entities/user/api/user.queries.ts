/**
 * User Query Factory.
 *
 * TanStack Query v5 query options factory.
 * Use with useQuery() directly - no custom hooks needed.
 *
 * @example
 * ```typescript
 * // List users with pagination
 * const { data } = useQuery(userQueries.list({ page: 0, size: 20, search: 'john' }));
 *
 * // Get user detail
 * const { data } = useQuery(userQueries.detail(id));
 *
 * // Get user's customer assignments
 * const { data } = useQuery(userQueries.customers(userId));
 * ```
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import type { Paginated } from '@/shared/lib/pagination';
import type { UserDetails } from '../model/user';
import { getUserList } from './get-user-list';
import { getUserById } from './get-user-by-id';
import { getCustomerAssignments } from './assign-customers';
import { userMapper } from './user.mapper';

// =============================================================================
// Query Parameters
// =============================================================================

export interface UserListQueryParams {
  page?: number;
  size?: number;
  search?: string;
  sort?: string;
}

// =============================================================================
// Query Factory
// =============================================================================

export const userQueries = {
  // -------------------------------------------------------------------------
  // Query Keys
  // -------------------------------------------------------------------------

  /** Base key for all user queries */
  all: () => ['users'] as const,

  /** Key for user list queries */
  lists: () => [...userQueries.all(), 'list'] as const,

  /** Key for user detail queries */
  details: () => [...userQueries.all(), 'detail'] as const,

  /** Key for user customers queries */
  customersKeys: () => [...userQueries.all(), 'customers'] as const,

  // -------------------------------------------------------------------------
  // User List Query
  // -------------------------------------------------------------------------

  /**
   * Query options for paginated user list.
   */
  list: (params: UserListQueryParams = {}) =>
    queryOptions({
      queryKey: [
        ...userQueries.lists(),
        params.page ?? 0,
        params.size ?? 10,
        params.search ?? '',
        params.sort ?? '',
      ] as const,
      queryFn: async (): Promise<Paginated<UserDetails>> => {
        const response = await getUserList({
          page: params.page ?? 0,
          size: params.size ?? 10,
          search: params.search || undefined,
          sort: params.sort || undefined,
        });

        return {
          data: response.data.map(userMapper.toDomain),
          pagination: response.pagination,
        };
      },
      placeholderData: keepPreviousData,
    }),

  // -------------------------------------------------------------------------
  // User Detail Query
  // -------------------------------------------------------------------------

  /**
   * Query options for user detail.
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...userQueries.details(), id] as const,
      queryFn: async (): Promise<UserDetails> => {
        const dto = await getUserById(id);
        return userMapper.toDomain(dto);
      },
      enabled: id > 0,
    }),

  // -------------------------------------------------------------------------
  // User Customers Query
  // -------------------------------------------------------------------------

  /**
   * Query options for user's customer assignments.
   */
  customers: (id: number) =>
    queryOptions({
      queryKey: [...userQueries.customersKeys(), id] as const,
      queryFn: async (): Promise<number[]> => {
        return getCustomerAssignments(id);
      },
      enabled: id > 0,
    }),
};
