/**
 * User query functions.
 *
 * Reusable query functions that always return domain models.
 * Used by query hooks and prefetchQuery calls.
 */

import type { UserDetails } from '../model/user';
import type { PaginationMetadata } from '@/shared/lib/pagination';
import { userApi } from '../api/user.api';
import { userMapper } from '../api/user.mapper';

/**
 * Parameters for user list query.
 */
export interface UserListParams {
  page: number;
  size: number;
  search: string;
  sort: string;
}

/**
 * Paginated users result (domain models).
 */
export interface PaginatedUsers {
  data: UserDetails[];
  pagination: PaginationMetadata;
}

/**
 * User query functions.
 */
export const userQueryFns = {
  /**
   * Query function for single user detail.
   *
   * @example
   * ```tsx
   * queryClient.prefetchQuery({
   *   queryKey: userQueryKeys.detail(userId),
   *   queryFn: userQueryFns.detail(userId),
   * });
   * ```
   */
  detail: (id: number) => async (): Promise<UserDetails> => {
    const dto = await userApi.getById(id);
    return userMapper.toDomain(dto);
  },

  /**
   * Query function for paginated user list.
   *
   * @example
   * ```tsx
   * useQuery({
   *   queryKey: userQueryKeys.list(page, size, search, sort),
   *   queryFn: userQueryFns.list({ page, size, search, sort }),
   * });
   * ```
   */
  list: (params: UserListParams) => async (): Promise<PaginatedUsers> => {
    const response = await userApi.getList({
      page: params.page,
      size: params.size,
      search: params.search || undefined,
      sort: params.sort || undefined,
    });

    return {
      data: response.data.map(userMapper.toDomain),
      pagination: response.pagination,
    };
  },

  /**
   * Query function for user's customer assignments.
   */
  customers: (id: number) => async (): Promise<number[]> => {
    return userApi.getCustomers(id);
  },
};
