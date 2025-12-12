/**
 * User Management API service.
 * Encapsulates all user-related API endpoints.
 */

import apiService, {type PaginatedResponse} from './apiService';
import type {
  AssignRolesRequest,
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UserDetails,
} from '@/types/auth';

const BASE_PATH = '/users';

/**
 * Query parameters for listing users.
 */
export interface UserListParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
}

/**
 * User Management API endpoints.
 */
export const userApi = {
  /**
   * Get paginated list of users.
   * @param params - Pagination and filter parameters
   * @returns Paginated user list
   */
  getUsers: (params?: UserListParams): Promise<PaginatedResponse<UserDetails>> =>
    apiService.getPaginated<UserDetails>(BASE_PATH, {params}),

  /**
   * Get user by ID.
   * @param id - User ID
   * @returns User details
   */
  getUser: (id: number): Promise<UserDetails> =>
    apiService.get<UserDetails>(`${BASE_PATH}/${id}`),

  /**
   * Create a new user.
   * @param request - User creation data
   * @returns Created user details
   */
  createUser: (request: CreateUserRequest): Promise<UserDetails> =>
    apiService.post<UserDetails>(BASE_PATH, request),

  /**
   * Update an existing user.
   * @param id - User ID
   * @param request - User update data
   * @returns Updated user details
   */
  updateUser: (id: number, request: UpdateUserRequest): Promise<UserDetails> =>
    apiService.put<UserDetails>(`${BASE_PATH}/${id}`, request),

  /**
   * Assign roles to a user.
   * @param id - User ID
   * @param request - Roles to assign
   * @returns Updated user details
   */
  assignRoles: (id: number, request: AssignRolesRequest): Promise<UserDetails> =>
    apiService.put<UserDetails>(`${BASE_PATH}/${id}/roles`, request),

  /**
   * Change user password (admin operation).
   * @param id - User ID
   * @param request - New password
   */
  changePassword: (id: number, request: ChangePasswordRequest): Promise<void> =>
    apiService.put<void>(`${BASE_PATH}/${id}/password`, request),

  /**
   * Activate a deactivated user.
   * @param id - User ID
   * @returns Activated user details
   */
  activateUser: (id: number): Promise<UserDetails> =>
    apiService.post<UserDetails>(`${BASE_PATH}/${id}/activate`),

  /**
   * Delete (deactivate) a user.
   * @param id - User ID
   */
  deleteUser: (id: number): Promise<void> =>
    apiService.delete<void>(`${BASE_PATH}/${id}`),
};

export default userApi;
