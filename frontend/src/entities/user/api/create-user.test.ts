/**
 * Create User Command Tests.
 *
 * Tests for mapping and API call.
 * Note: User creation doesn't have front-end validation - that's handled by the backend.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createUser, type CreateUserInput } from './create-user';

// =============================================================================
// Mock Setup
// =============================================================================

const mockHttpClient = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api');
  return {
    ...actual,
    httpClient: mockHttpClient,
    USER_ENDPOINTS: {
      BASE: '/api/users',
      byId: (id: number) => `/api/users/${id}`,
    },
  };
});

// =============================================================================
// Test Data Factories
// =============================================================================

function createValidInput(overrides?: Partial<CreateUserInput>): CreateUserInput {
  return {
    username: 'john.doe',
    email: 'JOHN.DOE@example.com',
    password: 'Password123!',
    fullName: 'John Doe',
    roles: ['ROLE_USER'],
    ...overrides,
  };
}

function createMockUserResponse(id = 1) {
  return {
    id,
    username: 'john.doe',
    email: 'john.doe@example.com',
    fullName: 'John Doe',
    isActive: true,
    roles: ['ROLE_USER'],
    createdAt: '2025-01-15T00:00:00Z',
    lastLoginAt: null,
  };
}

describe('createUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.post.mockResolvedValue(createMockUserResponse(1));
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should trim and lowercase username', async () => {
      const input = createValidInput({ username: '  JOHN.DOE  ' });

      await createUser(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({ username: 'john.doe' })
      );
    });

    it('should trim and lowercase email', async () => {
      const input = createValidInput({ email: '  JOHN.DOE@EXAMPLE.COM  ' });

      await createUser(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({ email: 'john.doe@example.com' })
      );
    });

    it('should trim fullName whitespace', async () => {
      const input = createValidInput({ fullName: '  John Doe  ' });

      await createUser(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({ fullName: 'John Doe' })
      );
    });

    it('should preserve password as-is (no trimming)', async () => {
      const input = createValidInput({ password: '  Password123!  ' });

      await createUser(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({ password: '  Password123!  ' })
      );
    });

    it('should pass roles array as-is', async () => {
      const input = createValidInput({ roles: ['ROLE_USER', 'ROLE_ADMIN'] });

      await createUser(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({ roles: ['ROLE_USER', 'ROLE_ADMIN'] })
      );
    });

    it('should map all fields correctly', async () => {
      const input: CreateUserInput = {
        username: 'Jane.Doe',
        email: 'Jane.Doe@Example.COM',
        password: 'SecurePassword123!',
        fullName: 'Jane Doe',
        roles: ['ROLE_ADMIN'],
      };

      await createUser(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/users', {
        username: 'jane.doe',
        email: 'jane.doe@example.com',
        password: 'SecurePassword123!',
        fullName: 'Jane Doe',
        roles: ['ROLE_ADMIN'],
      });
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.post with correct endpoint', async () => {
      const input = createValidInput();

      await createUser(input);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/users',
        expect.any(Object)
      );
    });

    it('should return UserDetailsResponse on success', async () => {
      const expectedResponse = createMockUserResponse(123);
      mockHttpClient.post.mockResolvedValue(expectedResponse);
      const input = createValidInput();

      const result = await createUser(input);

      expect(result).toEqual(expectedResponse);
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);
      const input = createValidInput();

      await expect(createUser(input)).rejects.toThrow('Network error');
    });

    it('should propagate validation errors from backend', async () => {
      const validationError = {
        status: 400,
        message: 'Username already exists',
      };
      mockHttpClient.post.mockRejectedValue(validationError);
      const input = createValidInput();

      await expect(createUser(input)).rejects.toEqual(validationError);
    });
  });
});
