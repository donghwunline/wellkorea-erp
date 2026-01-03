/**
 * Get User List query function.
 *
 * Fetches paginated list of users.
 * Used by user.queries.ts for TanStack Query integration.
 */

import { httpClient, USER_ENDPOINTS, type PagedResponse } from '@/shared/api';
import { transformPagedResponse, type Paginated } from '@/shared/lib/pagination';
import type { UserDetailsResponse } from './user.mapper';

// =============================================================================
// QUERY PARAMS
// =============================================================================

/**
 * Parameters for user list query.
 */
export interface GetUserListParams {
  page?: number;
  size?: number;
  search?: string;
  sort?: string;
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Get paginated list of users.
 *
 * @param params - Query parameters
 * @returns Paginated user list
 *
 * @example
 * ```typescript
 * const users = await getUserList({ page: 0, size: 20, search: 'john' });
 * ```
 */
export async function getUserList(params: GetUserListParams = {}): Promise<Paginated<UserDetailsResponse>> {
  const response = await httpClient.requestWithMeta<PagedResponse<UserDetailsResponse>>({
    method: 'GET',
    url: USER_ENDPOINTS.BASE,
    params: {
      page: params.page,
      size: params.size,
      search: params.search || undefined,
      sort: params.sort || undefined,
    },
  });

  return transformPagedResponse(response.data, response.metadata);
}
