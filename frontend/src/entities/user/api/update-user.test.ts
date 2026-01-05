/**
 * Update User Command Tests.
 *
 * Tests for mapping and API call.
 * Note: User update validation is handled by the backend.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { updateUser, type UpdateUserInput } from './update-user';

// =============================================================================
// Mock Setup
// =============================================================================

const mockHttpClient = vi.hoisted(() => ({
  put: vi.fn(),
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

function createValidInput(overrides?: Partial<UpdateUserInput>): UpdateUserInput {
  return {
    fullName: 'John Doe Updated',
    email: 'john.updated@example.com',
    ...overrides,
  };
}

function createMockUserResponse(id = 123) {
  return {
    id,
    username: 'john.doe',
    email: 'john.updated@example.com',
    fullName: 'John Doe Updated',
    isActive: true,
    roles: ['ROLE_USER'],
    createdAt: '2025-01-15T00:00:00Z',
    lastLoginAt: '2025-01-20T10:30:00Z',
  };
}

describe('updateUser', () => {
  const userId = 123;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpClient.put.mockResolvedValue(createMockUserResponse(userId));
  });

  // ==========================================================================
  // Mapping Tests
  // ==========================================================================

  describe('mapping', () => {
    it('should trim fullName whitespace', async () => {
      const input = createValidInput({ fullName: '  John Doe Updated  ' });

      await updateUser(userId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/users/${userId}`,
        expect.objectContaining({ fullName: 'John Doe Updated' })
      );
    });

    it('should trim and lowercase email', async () => {
      const input = createValidInput({ email: '  JOHN.UPDATED@EXAMPLE.COM  ' });

      await updateUser(userId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/users/${userId}`,
        expect.objectContaining({ email: 'john.updated@example.com' })
      );
    });

    it('should map all fields correctly', async () => {
      const input: UpdateUserInput = {
        fullName: 'Jane Doe',
        email: 'Jane.Doe@Example.COM',
      };

      await updateUser(userId, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(`/api/users/${userId}`, {
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
      });
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call httpClient.put with correct endpoint including id', async () => {
      const input = createValidInput();

      await updateUser(456, input);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/api/users/456',
        expect.any(Object)
      );
    });

    it('should return UserDetailsResponse on success', async () => {
      const expectedResponse = createMockUserResponse(userId);
      mockHttpClient.put.mockResolvedValue(expectedResponse);
      const input = createValidInput();

      const result = await updateUser(userId, input);

      expect(result).toEqual(expectedResponse);
    });

    it('should propagate httpClient errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.put.mockRejectedValue(error);
      const input = createValidInput();

      await expect(updateUser(userId, input)).rejects.toThrow('Network error');
    });

    it('should propagate validation errors from backend', async () => {
      const validationError = {
        status: 400,
        message: 'Email already in use',
      };
      mockHttpClient.put.mockRejectedValue(validationError);
      const input = createValidInput();

      await expect(updateUser(userId, input)).rejects.toEqual(validationError);
    });

    it('should handle different user IDs', async () => {
      const input = createValidInput();

      await updateUser(1, input);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/users/1', expect.any(Object));

      await updateUser(999, input);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/users/999', expect.any(Object));
    });
  });
});
