/**
 * User service types (domain models).
 */

export type {
  UserDetails,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRolesRequest,
  ChangePasswordRequest,
} from '@/types/auth';

export interface UserListParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
}

export interface PaginatedUsers {
  data: UserDetails[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

// Re-export for convenience
import type { UserDetails } from '@/types/auth';
