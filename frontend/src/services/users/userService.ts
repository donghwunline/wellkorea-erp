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
import type { PaginationMetadata, PagedResponse } from '@/api/types';
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
   * Backend returns Page<UserResponse> structure.
   */
  async getUsers(params?: UserListParams): Promise<PaginatedUsers> {
    const response = await httpClient.requestWithMeta<PagedResponse<UserDetails>>({
      method: 'GET',
      url: BASE_PATH,
      params,
    });

    const pagedData = response.data;
    const pagination = response.metadata as unknown as PaginationMetadata;

    return {
      data: pagedData.content.map(transformUserDetails),
      pagination: {
        page: pagination.page ?? pagedData.number, // Use metadata if available, fallback to page number
        size: pagination.size ?? pagedData.size,
        totalElements: pagination.totalElements ?? pagedData.totalElements,
        totalPages: pagination.totalPages ?? pagedData.totalPages,
        first: pagination.first ?? pagedData.first,
        last: pagination.last ?? pagedData.last,
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

  /**
   * Get customer assignments for a user (Sales role filtering per FR-062).
   */
  async getUserCustomers(id: number): Promise<number[]> {
    const response = await httpClient.get<{ customerIds: number[] }>(`${BASE_PATH}/${id}/customers`);
    return response.customerIds;
  },

  /**
   * Assign customers to a user (Sales role filtering per FR-062).
   */
  async assignCustomers(id: number, customerIds: number[]): Promise<void> {
    await httpClient.put<void>(`${BASE_PATH}/${id}/customers`, { customerIds });
  },
};
