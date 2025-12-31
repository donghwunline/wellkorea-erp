/**
 * User API functions.
 *
 * Raw HTTP calls without business logic.
 * Returns DTOs, not domain models.
 */

import { httpClient, USER_ENDPOINTS } from '@/shared/api';
import type { PagedResponse, PaginationMetadata } from '@/shared/api/types';
import type {
  UserDetailsDTO,
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  AssignRolesRequestDTO,
  ChangePasswordRequestDTO,
  AssignCustomersRequestDTO,
  UserListParamsDTO,
} from './user.dto';

/**
 * Paginated users response from API.
 */
export interface PaginatedUsersDTO {
  data: UserDetailsDTO[];
  pagination: PaginationMetadata;
}

/**
 * User API functions.
 */
export const userApi = {
  /**
   * Get paginated list of users.
   */
  async getList(params: UserListParamsDTO): Promise<PaginatedUsersDTO> {
    const response = await httpClient.requestWithMeta<PagedResponse<UserDetailsDTO>>({
      method: 'GET',
      url: USER_ENDPOINTS.BASE,
      params,
    });

    return {
      data: response.data.content,
      pagination: {
        page: response.data.number,
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements,
        size: response.data.size,
        first: response.data.first,
        last: response.data.last,
      },
    };
  },

  /**
   * Get user by ID.
   */
  async getById(id: number): Promise<UserDetailsDTO> {
    return httpClient.get<UserDetailsDTO>(USER_ENDPOINTS.byId(id));
  },

  /**
   * Create a new user.
   */
  async create(request: CreateUserRequestDTO): Promise<UserDetailsDTO> {
    return httpClient.post<UserDetailsDTO>(USER_ENDPOINTS.BASE, request);
  },

  /**
   * Update user details.
   */
  async update(id: number, request: UpdateUserRequestDTO): Promise<UserDetailsDTO> {
    return httpClient.put<UserDetailsDTO>(USER_ENDPOINTS.byId(id), request);
  },

  /**
   * Assign roles to a user.
   */
  async assignRoles(id: number, request: AssignRolesRequestDTO): Promise<void> {
    await httpClient.put<void>(USER_ENDPOINTS.roles(id), request);
  },

  /**
   * Change user password (admin operation).
   */
  async changePassword(id: number, request: ChangePasswordRequestDTO): Promise<void> {
    await httpClient.put<void>(USER_ENDPOINTS.password(id), request);
  },

  /**
   * Activate a deactivated user.
   */
  async activate(id: number): Promise<void> {
    await httpClient.post<void>(USER_ENDPOINTS.activate(id));
  },

  /**
   * Deactivate a user.
   */
  async deactivate(id: number): Promise<void> {
    await httpClient.delete<void>(USER_ENDPOINTS.byId(id));
  },

  /**
   * Get customer assignments for a user.
   */
  async getCustomers(id: number): Promise<number[]> {
    const response = await httpClient.get<{ customerIds: number[] }>(
      USER_ENDPOINTS.customers(id)
    );
    return response.customerIds;
  },

  /**
   * Assign customers to a user.
   */
  async assignCustomers(id: number, request: AssignCustomersRequestDTO): Promise<void> {
    await httpClient.put<void>(USER_ENDPOINTS.customers(id), request);
  },
};
