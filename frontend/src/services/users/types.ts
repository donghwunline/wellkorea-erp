/**
 * User service types.
 *
 * API DTOs are defined here. Shared domain types are re-exported from @/shared/types.
 */

import type { Paginated } from '@/api/types';
import type { RoleName, UserDetails } from '@/shared/types/auth';

// Re-export shared domain types for convenience
export type { UserDetails } from '@/shared/types/auth';

// API DTOs (service-specific)
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roles: RoleName[];
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
}

export interface AssignRolesRequest {
  roles: RoleName[];
}

export interface ChangePasswordRequest {
  newPassword: string;
}

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
