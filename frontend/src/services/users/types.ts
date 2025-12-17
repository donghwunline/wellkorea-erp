/**
 * User service types (domain models).
 */

import type { Paginated } from '@/api/types';
import type { UserDetails } from '@/shared/types/auth';

export type {
  UserDetails,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRolesRequest,
  ChangePasswordRequest,
} from '@/shared/types/auth';

export interface UserListParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
}

/**
 * Paginated user list response.
 * Uses generic Paginated<T> instead of custom interface.
 */
export type PaginatedUsers = Paginated<UserDetails>;
