/**
 * Unit tests for userService.
 * Tests user CRUD operations, data transformation, pagination handling, and error propagation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { userService } from '@/services';
import {
  createMockUserDetails,
  createMockPagedResponse,
  createMockApiResponse,
  mockApiErrors,
} from '@/test/fixtures';
import type {
  AssignRolesRequest,
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
} from './types';
import { httpClient } from '@/api';

// Mock httpClient with inline factory (vi.mock is hoisted, so can't use imported functions)
vi.mock('@/api', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    requestWithMeta: vi.fn(),
  },
  AUTH_ENDPOINTS: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  USER_ENDPOINTS: {
    BASE: '/users',
    byId: (id: number) => `/users/${id}`,
    roles: (id: number) => `/users/${id}/roles`,
    password: (id: number) => `/users/${id}/password`,
    activate: (id: number) => `/users/${id}/activate`,
    customers: (id: number) => `/users/${id}/customers`,
  },
  AUDIT_ENDPOINTS: {
    BASE: '/audit',
    byId: (id: number) => `/audit/${id}`,
  },
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should fetch paginated users and transform data', async () => {
      // Given: Mock paginated response
      const mockUser = createMockUserDetails();
      const mockResponse = createMockPagedResponse([mockUser]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get users
      const result = await userService.getUsers({ page: 0, size: 10 });

      // Then: Calls httpClient with correct params
      expect(httpClient.requestWithMeta).toHaveBeenCalledOnce();
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users',
        params: { page: 0, size: 10 },
      });

      // And: Returns paginated data
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockUser);
      expect(result.pagination.totalElements).toBe(1);
    });

    it('should normalize email to lowercase', async () => {
      // Given: Response with uppercase email
      const mockUser = createMockUserDetails({
        email: 'Test.User@EXAMPLE.COM', // Mixed case
      });
      const mockResponse = createMockPagedResponse([mockUser]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get users
      const result = await userService.getUsers();

      // Then: Email is normalized to lowercase
      expect(result.data[0].email).toBe('test.user@example.com');
    });

    it('should trim whitespace from fullName', async () => {
      // Given: Response with whitespace in fullName
      const mockUser = createMockUserDetails({
        fullName: '  Whitespace User  ', // Leading/trailing whitespace
      });
      const mockResponse = createMockPagedResponse([mockUser]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get users
      const result = await userService.getUsers();

      // Then: fullName whitespace is trimmed
      expect(result.data[0].fullName).toBe('Whitespace User');
    });

    it('should handle pagination metadata from metadata field', async () => {
      // Given: Response with metadata
      const mockResponse = createMockApiResponse(
        {
          content: [createMockUserDetails()],
          number: 5, // Different from metadata
          size: 100,
          totalElements: 500,
          totalPages: 50,
          first: false,
          last: false,
        },
        {
          page: 2, // Preferred value
          size: 20,
          totalElements: 100,
          totalPages: 5,
          first: false,
          last: false,
        }
      );
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get users
      const result = await userService.getUsers();

      // Then: Uses metadata values (not PagedResponse.number)
      expect(result.pagination.page).toBe(2); // From metadata
      expect(result.pagination.size).toBe(20); // From metadata
      expect(result.pagination.totalElements).toBe(100); // From metadata
    });

    it('should fallback to PagedResponse fields if metadata missing', async () => {
      // Given: Response without metadata
      const mockResponse = createMockApiResponse(
        {
          content: [createMockUserDetails()],
          number: 3,
          size: 25,
          totalElements: 150,
          totalPages: 6,
          first: false,
          last: false,
        },
        undefined
      );
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get users
      const result = await userService.getUsers();

      // Then: Falls back to PagedResponse fields
      expect(result.pagination.page).toBe(3); // From PagedResponse.number
      expect(result.pagination.size).toBe(25);
      expect(result.pagination.totalElements).toBe(150);
    });

    it('should handle search and filter params', async () => {
      // Given: Search and filter params
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get users with search
      await userService.getUsers({
        page: 0,
        size: 10,
        search: 'john',
        sort: 'username,asc',
      });

      // Then: Passes all params
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users',
        params: {
          page: 0,
          size: 10,
          search: 'john',
          sort: 'username,asc',
        },
      });
    });

    it('should handle empty results', async () => {
      // Given: Empty response
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get users
      const result = await userService.getUsers();

      // Then: Returns empty array
      expect(result.data).toEqual([]);
      expect(result.pagination.totalElements).toBe(0);
    });

    it('should propagate API errors', async () => {
      // Given: API error
      vi.mocked(httpClient.requestWithMeta).mockRejectedValue(mockApiErrors.serverError);

      // When/Then: Propagates error
      await expect(userService.getUsers()).rejects.toEqual(mockApiErrors.serverError);
    });
  });

  describe('getUser', () => {
    it('should fetch single user by ID and transform', async () => {
      // Given: Mock user response
      const mockUser = createMockUserDetails({ id: 123 });
      vi.mocked(httpClient.get).mockResolvedValue(mockUser);

      // When: Get user by ID
      const result = await userService.getUser(123);

      // Then: Calls httpClient with correct URL
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/users/123');

      // And: Returns transformed user
      expect(result.id).toBe(123);
    });

    it('should normalize email and fullName', async () => {
      // Given: User with mixed case email and whitespace
      const mockUser = createMockUserDetails({
        email: 'Test@EXAMPLE.com',
        fullName: '  Test User  ',
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockUser);

      // When: Get user
      const result = await userService.getUser(1);

      // Then: Data is normalized
      expect(result.email).toBe('test@example.com');
      expect(result.fullName).toBe('Test User');
    });

    it('should propagate 404 errors', async () => {
      // Given: User not found
      vi.mocked(httpClient.get).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(userService.getUser(999)).rejects.toEqual(mockApiErrors.notFound);
    });
  });

  describe('createUser', () => {
    it('should create user and return transformed result', async () => {
      // Given: Create request
      const createRequest: CreateUserRequest = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
        roles: ['ROLE_SALES'],
      };

      const mockCreatedUser = createMockUserDetails({
        id: 100,
        username: 'newuser',
        email: 'new@example.com',
        fullName: 'New User',
      });
      vi.mocked(httpClient.post).mockResolvedValue(mockCreatedUser);

      // When: Create user
      const result = await userService.createUser(createRequest);

      // Then: Calls httpClient.post with correct data
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/users', createRequest);

      // And: Returns transformed user
      expect(result.id).toBe(100);
      expect(result.username).toBe('newuser');
    });

    it('should normalize response data', async () => {
      // Given: Create request
      const createRequest: CreateUserRequest = {
        username: 'test',
        email: 'TEST@EXAMPLE.COM',
        password: 'pass',
        fullName: '  Test  ',
        roles: ['ROLE_ADMIN'],
      };

      const mockCreatedUser = createMockUserDetails({
        email: 'TEST@EXAMPLE.COM',
        fullName: '  Test  ',
      });
      vi.mocked(httpClient.post).mockResolvedValue(mockCreatedUser);

      // When: Create user
      const result = await userService.createUser(createRequest);

      // Then: Response is normalized
      expect(result.email).toBe('test@example.com');
      expect(result.fullName).toBe('Test');
    });

    it('should propagate validation errors', async () => {
      // Given: Validation error
      vi.mocked(httpClient.post).mockRejectedValue(mockApiErrors.validation);

      // When/Then: Propagates validation error
      const request: CreateUserRequest = {
        username: 'existing',
        email: 'test@example.com',
        password: 'pass',
        fullName: 'Test',
        roles: ['ROLE_SALES'],
      };
      await expect(userService.createUser(request)).rejects.toEqual(mockApiErrors.validation);
    });
  });

  describe('updateUser', () => {
    it('should update user and return transformed result', async () => {
      // Given: Update request
      const updateRequest: UpdateUserRequest = {
        fullName: 'Updated Name',
        email: 'updated@example.com',
      };

      const mockUpdatedUser = createMockUserDetails({
        id: 50,
        fullName: 'Updated Name',
        email: 'updated@example.com',
      });
      vi.mocked(httpClient.put).mockResolvedValue(mockUpdatedUser);

      // When: Update user
      const result = await userService.updateUser(50, updateRequest);

      // Then: Calls httpClient.put with correct URL and data
      expect(httpClient.put).toHaveBeenCalledOnce();
      expect(httpClient.put).toHaveBeenCalledWith('/users/50', updateRequest);

      // And: Returns transformed user
      expect(result.id).toBe(50);
      expect(result.fullName).toBe('Updated Name');
    });

    it('should normalize response data', async () => {
      // Given: Update request with mixed case email
      const updateRequest: UpdateUserRequest = {
        fullName: '  Updated  ',
        email: 'UPDATED@EXAMPLE.COM',
      };

      const mockUpdatedUser = createMockUserDetails({
        fullName: '  Updated  ',
        email: 'UPDATED@EXAMPLE.COM',
      });
      vi.mocked(httpClient.put).mockResolvedValue(mockUpdatedUser);

      // When: Update user
      const result = await userService.updateUser(1, updateRequest);

      // Then: Response is normalized
      expect(result.fullName).toBe('Updated');
      expect(result.email).toBe('updated@example.com');
    });

    it('should propagate 404 errors', async () => {
      // Given: User not found
      vi.mocked(httpClient.put).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      const request: UpdateUserRequest = {
        fullName: 'Test',
        email: 'test@example.com',
      };
      await expect(userService.updateUser(999, request)).rejects.toEqual(mockApiErrors.notFound);
    });
  });

  describe('assignRoles', () => {
    it('should assign roles successfully', async () => {
      // Given: Assign roles request
      const assignRequest: AssignRolesRequest = {
        roles: ['ROLE_ADMIN', 'ROLE_FINANCE'],
      };

      vi.mocked(httpClient.put).mockResolvedValue(undefined);

      // When: Assign roles
      await userService.assignRoles(10, assignRequest);

      // Then: Calls httpClient.put with correct URL
      expect(httpClient.put).toHaveBeenCalledOnce();
      expect(httpClient.put).toHaveBeenCalledWith('/users/10/roles', assignRequest);
    });

    it('should propagate authorization errors', async () => {
      // Given: Authorization error
      vi.mocked(httpClient.put).mockRejectedValue(mockApiErrors.forbidden);

      // When/Then: Propagates auth error
      const request: AssignRolesRequest = { roles: ['ROLE_ADMIN'] };
      await expect(userService.assignRoles(1, request)).rejects.toEqual(mockApiErrors.forbidden);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      // Given: Change password request
      const changeRequest: ChangePasswordRequest = {
        newPassword: 'newPassword123',
      };
      vi.mocked(httpClient.put).mockResolvedValue(undefined);

      // When: Change password
      await userService.changePassword(15, changeRequest);

      // Then: Calls httpClient.put with correct URL
      expect(httpClient.put).toHaveBeenCalledOnce();
      expect(httpClient.put).toHaveBeenCalledWith('/users/15/password', changeRequest);
    });

    it('should propagate validation errors', async () => {
      // Given: Weak password error
      vi.mocked(httpClient.put).mockRejectedValue(mockApiErrors.validation);

      // When/Then: Propagates validation error
      const request: ChangePasswordRequest = { newPassword: '123' };
      await expect(userService.changePassword(1, request)).rejects.toEqual(mockApiErrors.validation);
    });
  });

  describe('activateUser', () => {
    it('should activate user (no return value)', async () => {
      // Given: Backend returns void
      vi.mocked(httpClient.post).mockResolvedValue(undefined);

      // When: Activate user
      await userService.activateUser(20);

      // Then: Calls httpClient.post with correct URL
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/users/20/activate');
    });

    it('should propagate 404 errors', async () => {
      // Given: User not found
      vi.mocked(httpClient.post).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(userService.activateUser(999)).rejects.toEqual(mockApiErrors.notFound);
    });
  });

  describe('deleteUser', () => {
    it('should delete (deactivate) user', async () => {
      // Given: Mock delete success
      vi.mocked(httpClient.delete).mockResolvedValue(undefined);

      // When: Delete user
      await userService.deleteUser(30);

      // Then: Calls httpClient.delete with correct URL
      expect(httpClient.delete).toHaveBeenCalledOnce();
      expect(httpClient.delete).toHaveBeenCalledWith('/users/30');
    });

    it('should propagate 404 errors', async () => {
      // Given: User not found
      vi.mocked(httpClient.delete).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(userService.deleteUser(999)).rejects.toEqual(mockApiErrors.notFound);
    });
  });

  describe('getUserCustomers', () => {
    it('should fetch user customer assignments', async () => {
      // Given: Mock customer IDs response
      const mockResponse = { customerIds: [1, 2, 3] };
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      // When: Get user customers
      const result = await userService.getUserCustomers(40);

      // Then: Calls httpClient.get with correct URL
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/users/40/customers');

      // And: Returns customer IDs array
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle empty customer assignments', async () => {
      // Given: No customers assigned
      const mockResponse = { customerIds: [] };
      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      // When: Get user customers
      const result = await userService.getUserCustomers(1);

      // Then: Returns empty array
      expect(result).toEqual([]);
    });

    it('should propagate API errors', async () => {
      // Given: API error
      vi.mocked(httpClient.get).mockRejectedValue(mockApiErrors.serverError);

      // When/Then: Propagates error
      await expect(userService.getUserCustomers(1)).rejects.toEqual(mockApiErrors.serverError);
    });
  });

  describe('assignCustomers', () => {
    it('should assign customers to user', async () => {
      // Given: Customer IDs to assign
      const customerIds = [10, 20, 30];
      vi.mocked(httpClient.put).mockResolvedValue(undefined);

      // When: Assign customers
      await userService.assignCustomers(50, customerIds);

      // Then: Calls httpClient.put with correct URL and data
      expect(httpClient.put).toHaveBeenCalledOnce();
      expect(httpClient.put).toHaveBeenCalledWith('/users/50/customers', {
        customerIds: [10, 20, 30],
      });
    });

    it('should handle empty customer array', async () => {
      // Given: Empty customer array (unassign all)
      vi.mocked(httpClient.put).mockResolvedValue(undefined);

      // When: Assign empty array
      await userService.assignCustomers(1, []);

      // Then: Sends empty array
      expect(httpClient.put).toHaveBeenCalledWith('/users/1/customers', {
        customerIds: [],
      });
    });

    it('should propagate validation errors', async () => {
      // Given: Invalid customer IDs
      vi.mocked(httpClient.put).mockRejectedValue(mockApiErrors.validation);

      // When/Then: Propagates validation error
      await expect(userService.assignCustomers(1, [999])).rejects.toEqual(mockApiErrors.validation);
    });
  });
});
