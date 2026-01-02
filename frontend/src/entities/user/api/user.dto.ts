/**
 * User API DTOs.
 *
 * Data Transfer Objects for user API endpoints.
 * These match the backend API contract exactly.
 */

import type { RoleName } from '../model/role';

// ==================== RESPONSE DTOs ====================

/**
 * User details as returned by the API.
 */
export interface UserDetailsDTO {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: RoleName[];
  createdAt: string;
  lastLoginAt: string | null;
}

// ==================== REQUEST DTOs ====================

/**
 * Request DTO for creating a new user.
 */
export interface CreateUserRequestDTO {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roles: RoleName[];
}

/**
 * Request DTO for updating user details.
 */
export interface UpdateUserRequestDTO {
  fullName: string;
  email: string;
}

/**
 * Request DTO for assigning roles.
 */
export interface AssignRolesRequestDTO {
  roles: RoleName[];
}

/**
 * Request DTO for changing password.
 */
export interface ChangePasswordRequestDTO {
  newPassword: string;
}

/**
 * Request DTO for assigning customers.
 */
export interface AssignCustomersRequestDTO {
  customerIds: number[];
}

// ==================== QUERY PARAMS ====================

/**
 * Parameters for user list query.
 */
export interface UserListParamsDTO {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
}

// ==================== COMMAND RESULT ====================

/**
 * Standard command result from write operations.
 */
export interface UserCommandResultDTO {
  id: number;
  message: string;
}
