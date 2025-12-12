/**
 * User management service.
 * Business logic layer for user operations.
 *
 * Features:
 * - User CRUD operations
 * - DTO → Domain transformations
 * - Data normalization (dates, emails, etc.)
 */

import { httpClient } from '@/api';
import type { PaginationMetadata } from '@/types/api';
import type {
  UserDetails,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRolesRequest,
  ChangePasswordRequest,
  UserListParams,
  PaginatedUsers,
} from './types';

const BASE_PATH = '/users';

/**
 * Transform UserDetails DTO to domain model.
 * Normalizes data and converts string dates to Date objects.
 */
function transformUserDetails(dto: UserDetails): UserDetails {
  return {
    ...dto,
    email: dto.email.toLowerCase(), // Normalize email
    fullName: dto.fullName.trim(), // Trim whitespace
    createdAt: typeof dto.createdAt === 'string' ? dto.createdAt : dto.createdAt, // Keep as string for now (can convert to Date if needed)
    lastLoginAt: dto.lastLoginAt, // Keep as string for now
  };
}

/**
 * User management service.
 */
export const userService = {
  /**
   * Get paginated list of users.
   */
  async getUsers(params?: UserListParams): Promise<PaginatedUsers> {
    const response = await httpClient.requestWithMeta<UserDetails[]>({
      method: 'GET',
      url: BASE_PATH,
      params,
    });

    const pagination = response.metadata as unknown as PaginationMetadata;

    return {
      data: response.data.map(transformUserDetails),
      pagination: {
        page: pagination.page,
        size: pagination.size,
        totalElements: pagination.totalElements,
        totalPages: pagination.totalPages,
      },
    };
  },

  /**
   * Get user by ID.
   */
  async getUser(id: number): Promise<UserDetails> {
    const user = await httpClient.get<UserDetails>(`${BASE_PATH}/${id}`);
    return transformUserDetails(user);
  },

  /**
   * Create a new user.
   */
  async createUser(request: CreateUserRequest): Promise<UserDetails> {
    const user = await httpClient.post<UserDetails>(BASE_PATH, request);
    return transformUserDetails(user);
  },

  /**
   * Update an existing user.
   */
  async updateUser(id: number, request: UpdateUserRequest): Promise<UserDetails> {
    const user = await httpClient.put<UserDetails>(`${BASE_PATH}/${id}`, request);
    return transformUserDetails(user);
  },

  /**
   * Assign roles to a user.
   */
  async assignRoles(id: number, request: AssignRolesRequest): Promise<UserDetails> {
    const user = await httpClient.put<UserDetails>(`${BASE_PATH}/${id}/roles`, request);
    return transformUserDetails(user);
  },

  /**
   * Change user password (admin operation).
   */
  async changePassword(id: number, request: ChangePasswordRequest): Promise<void> {
    await httpClient.put<void>(`${BASE_PATH}/${id}/password`, request);
  },

  /**
   * Activate a deactivated user.
   */
  async activateUser(id: number): Promise<UserDetails> {
    const user = await httpClient.post<UserDetails>(`${BASE_PATH}/${id}/activate`);
    return transformUserDetails(user);
  },

  /**
   * Delete (deactivate) a user.
   */
  async deleteUser(id: number): Promise<void> {
    await httpClient.delete<void>(`${BASE_PATH}/${id}`);
  },
};
