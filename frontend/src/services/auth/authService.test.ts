/**
 * Unit tests for authService.
 * Tests authentication business logic, API calls, and data normalization.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from './authService';
import { createMockUser, mockUsers } from '@/test/fixtures';
import type { LoginRequest, LoginResponse } from './types';
import type { ApiError } from '@/api/types';
// Import mocked module
import { httpClient } from '@/api';

// Mock httpClient
vi.mock('@/api', () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should call httpClient.post with credentials and return normalized data', async () => {
      // Given: Valid credentials
      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      };

      // Mock response with email that needs lowercasing and fullName that needs trimming
      const mockResponse: LoginResponse = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        user: createMockUser({
          email: 'Test.User@Example.COM', // Mixed case - should be normalized
          fullName: '  Test User  ', // Leading/trailing whitespace - should be trimmed
          roles: ['ROLE_ADMIN'],
        }),
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      // When: Login
      const result = await authService.login(credentials);

      // Then: Calls httpClient.post with correct endpoint and data
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/auth/login', credentials);

      // And: Returns normalized response
      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-456');
      expect(result.user.email).toBe('test.user@example.com'); // Normalized to lowercase
      expect(result.user.fullName).toBe('Test User'); // Trimmed whitespace
      expect(result.user.roles).toEqual(['ROLE_ADMIN']);
    });

    it('should normalize email to lowercase', async () => {
      // Given: Response with uppercase email
      const mockResponse: LoginResponse = {
        accessToken: 'token',
        user: createMockUser({
          email: 'USER@EXAMPLE.COM',
          roles: ['ROLE_SALES'],
        }),
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      // When: Login
      const result = await authService.login({ username: 'user', password: 'pass' });

      // Then: Email is lowercase
      expect(result.user.email).toBe('user@example.com');
    });

    it('should trim whitespace from fullName', async () => {
      // Given: Response with whitespace in fullName
      const mockResponse: LoginResponse = {
        accessToken: 'token',
        user: createMockUser({
          fullName: '\n  Spaces Everywhere  \t',
          roles: ['ROLE_FINANCE'],
        }),
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      // When: Login
      const result = await authService.login({ username: 'user', password: 'pass' });

      // Then: fullName is trimmed
      expect(result.user.fullName).toBe('Spaces Everywhere');
    });

    it('should handle multiple roles', async () => {
      // Given: Response with multiple roles (use pre-configured multiRole fixture)
      const mockResponse: LoginResponse = {
        accessToken: 'token',
        user: mockUsers.multiRole,
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      // When: Login
      const result = await authService.login({ username: 'admin', password: 'pass' });

      // Then: All roles are preserved
      expect(result.user.roles).toEqual(['ROLE_ADMIN', 'ROLE_SALES']);
    });

    it('should handle optional refreshToken', async () => {
      // Given: Response without refreshToken
      const mockResponse: LoginResponse = {
        accessToken: 'access-token-123',
        user: mockUsers.sales,
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      // When: Login
      const result = await authService.login({ username: 'user', password: 'pass' });

      // Then: No refreshToken in response
      expect(result.refreshToken).toBeUndefined();
    });

    it('should propagate API errors', async () => {
      // Given: API returns error (invalid credentials)
      const apiError: ApiError = {
        status: 401,
        errorCode: 'AUTH_001',
        message: 'Invalid credentials',
      };

      vi.mocked(httpClient.post).mockRejectedValue(apiError);

      // When/Then: Login rejects with API error
      await expect(authService.login({ username: 'wrong', password: 'wrong' })).rejects.toEqual(
        apiError
      );

      expect(httpClient.post).toHaveBeenCalledWith('/auth/login', {
        username: 'wrong',
        password: 'wrong',
      });
    });
  });

  describe('logout', () => {
    it('should call httpClient.post to /auth/logout', async () => {
      // Given: Successful logout response
      vi.mocked(httpClient.post).mockResolvedValue(undefined);

      // When: Logout
      await authService.logout();

      // Then: Calls logout endpoint
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('should return void on success', async () => {
      // Given: Successful logout
      vi.mocked(httpClient.post).mockResolvedValue(undefined);

      // When: Logout
      const result = await authService.logout();

      // Then: Returns void
      expect(result).toBeUndefined();
    });

    it('should propagate API errors', async () => {
      // Given: API returns error (token already invalidated)
      const apiError: ApiError = {
        status: 401,
        errorCode: 'AUTH_002',
        message: 'Invalid token',
      };

      vi.mocked(httpClient.post).mockRejectedValue(apiError);

      // When/Then: Logout rejects with API error
      await expect(authService.logout()).rejects.toEqual(apiError);
    });
  });

  describe('getCurrentUser', () => {
    it('should call httpClient.get and return normalized user data', async () => {
      // Given: Mock user response with data to normalize
      const mockUser = createMockUser({
        email: 'Current.User@EXAMPLE.com', // Mixed case
        fullName: '  Current User Name  ', // Whitespace
        roles: ['ROLE_PRODUCTION', 'ROLE_SALES'],
      });

      vi.mocked(httpClient.get).mockResolvedValue(mockUser);

      // When: Get current user
      const result = await authService.getCurrentUser();

      // Then: Calls correct endpoint
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/auth/me');

      // And: Returns normalized data
      expect(result.email).toBe('current.user@example.com'); // Normalized
      expect(result.fullName).toBe('Current User Name'); // Trimmed
      expect(result.roles).toEqual(['ROLE_PRODUCTION', 'ROLE_SALES']);
    });

    it('should normalize email to lowercase', async () => {
      // Given: User with uppercase email
      const mockUser = createMockUser({
        email: 'ALL.CAPS@DOMAIN.COM',
        roles: ['ROLE_ADMIN'],
      });

      vi.mocked(httpClient.get).mockResolvedValue(mockUser);

      // When: Get current user
      const result = await authService.getCurrentUser();

      // Then: Email is lowercase
      expect(result.email).toBe('all.caps@domain.com');
    });

    it('should trim fullName whitespace', async () => {
      // Given: User with whitespace in fullName
      const mockUser = createMockUser({
        fullName: '\t\n  Whitespace User  \r\n',
        roles: ['ROLE_FINANCE'],
      });

      vi.mocked(httpClient.get).mockResolvedValue(mockUser);

      // When: Get current user
      const result = await authService.getCurrentUser();

      // Then: fullName is trimmed
      expect(result.fullName).toBe('Whitespace User');
    });

    it('should preserve all user properties', async () => {
      // Given: Complete user response (use pre-configured admin fixture)
      vi.mocked(httpClient.get).mockResolvedValue(mockUsers.admin);

      // When: Get current user
      const result = await authService.getCurrentUser();

      // Then: All properties preserved
      expect(result.id).toBe(mockUsers.admin.id);
      expect(result.username).toBe(mockUsers.admin.username);
      expect(result.roles).toEqual(mockUsers.admin.roles);
    });

    it('should propagate API errors', async () => {
      // Given: API returns error (user not found or token invalid)
      const apiError: ApiError = {
        status: 404,
        errorCode: 'AUTH_004',
        message: 'User not found',
      };

      vi.mocked(httpClient.get).mockRejectedValue(apiError);

      // When/Then: getCurrentUser rejects with API error
      await expect(authService.getCurrentUser()).rejects.toEqual(apiError);

      expect(httpClient.get).toHaveBeenCalledWith('/auth/me');
    });
  });
});
