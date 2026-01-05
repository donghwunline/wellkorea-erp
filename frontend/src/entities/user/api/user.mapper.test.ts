/**
 * User Mapper Tests.
 *
 * Tests for DTO → Domain model transformations.
 */

import { describe, expect, it } from 'vitest';
import { userMapper, type UserDetailsResponse } from './user.mapper';
import { expectDomainShape, expectTrimmedStrings } from '@/test/entity-test-utils';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockUserDetailsResponse(
  overrides?: Partial<UserDetailsResponse>
): UserDetailsResponse {
  return {
    id: 1,
    username: 'john.doe',
    email: 'JOHN.DOE@example.com',
    fullName: 'John Doe',
    isActive: true,
    roles: ['ROLE_USER'],
    createdAt: '2025-01-15T00:00:00Z',
    lastLoginAt: '2025-01-20T10:30:00Z',
    ...overrides,
  };
}

describe('userMapper', () => {
  // ==========================================================================
  // toDomain Tests
  // ==========================================================================

  describe('toDomain()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockUserDetailsResponse();
      const result = userMapper.toDomain(response);

      expectDomainShape(result, [
        'id',
        'username',
        'email',
        'fullName',
        'isActive',
        'roles',
        'createdAt',
        'lastLoginAt',
      ]);
    });

    it('should preserve field values correctly', () => {
      const response = createMockUserDetailsResponse();
      const result = userMapper.toDomain(response);

      expect(result.id).toBe(1);
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBe('2025-01-15T00:00:00Z');
    });

    it('should trim whitespace from username', () => {
      const response = createMockUserDetailsResponse({ username: '  john.doe  ' });
      const result = userMapper.toDomain(response);

      expectTrimmedStrings(result, ['username']);
      expect(result.username).toBe('john.doe');
    });

    it('should trim whitespace from fullName', () => {
      const response = createMockUserDetailsResponse({ fullName: '  John Doe  ' });
      const result = userMapper.toDomain(response);

      expectTrimmedStrings(result, ['fullName']);
      expect(result.fullName).toBe('John Doe');
    });

    it('should lowercase and trim email', () => {
      const response = createMockUserDetailsResponse({
        email: '  JOHN.DOE@EXAMPLE.COM  ',
      });
      const result = userMapper.toDomain(response);

      expect(result.email).toBe('john.doe@example.com');
    });

    it('should preserve roles array', () => {
      const response = createMockUserDetailsResponse({
        roles: ['ROLE_USER', 'ROLE_ADMIN'],
      });
      const result = userMapper.toDomain(response);

      expect(result.roles).toEqual(['ROLE_USER', 'ROLE_ADMIN']);
    });

    it('should handle null lastLoginAt', () => {
      const response = createMockUserDetailsResponse({ lastLoginAt: null });
      const result = userMapper.toDomain(response);

      expect(result.lastLoginAt).toBeNull();
    });

    it('should preserve lastLoginAt when present', () => {
      const response = createMockUserDetailsResponse({
        lastLoginAt: '2025-01-20T10:30:00Z',
      });
      const result = userMapper.toDomain(response);

      expect(result.lastLoginAt).toBe('2025-01-20T10:30:00Z');
    });

    it('should handle isActive false', () => {
      const response = createMockUserDetailsResponse({ isActive: false });
      const result = userMapper.toDomain(response);

      expect(result.isActive).toBe(false);
    });
  });

  // ==========================================================================
  // toListItem Tests
  // ==========================================================================

  describe('toListItem()', () => {
    it('should map only list-relevant fields', () => {
      const user = userMapper.toDomain(createMockUserDetailsResponse());
      const result = userMapper.toListItem(user);

      expectDomainShape(result, [
        'id',
        'username',
        'fullName',
        'email',
        'isActive',
        'roles',
        'lastLoginAt',
      ]);
    });

    it('should not include createdAt in list item', () => {
      const user = userMapper.toDomain(createMockUserDetailsResponse());
      const result = userMapper.toListItem(user);

      expect(result).not.toHaveProperty('createdAt');
    });

    it('should preserve user values', () => {
      const user = userMapper.toDomain(createMockUserDetailsResponse({
        id: 5,
        username: 'jane.doe',
        fullName: 'Jane Doe',
      }));
      const result = userMapper.toListItem(user);

      expect(result.id).toBe(5);
      expect(result.username).toBe('jane.doe');
      expect(result.fullName).toBe('Jane Doe');
    });
  });

  // ==========================================================================
  // responseToListItem Tests
  // ==========================================================================

  describe('responseToListItem()', () => {
    it('should map response directly to list item', () => {
      const response = createMockUserDetailsResponse();
      const result = userMapper.responseToListItem(response);

      expect(result.id).toBe(response.id);
      expect(result.username).toBe('john.doe');
      expect(result.isActive).toBe(response.isActive);
    });

    it('should trim username', () => {
      const response = createMockUserDetailsResponse({
        username: '  john.doe  ',
      });
      const result = userMapper.responseToListItem(response);

      expect(result.username).toBe('john.doe');
    });

    it('should trim fullName', () => {
      const response = createMockUserDetailsResponse({
        fullName: '  John Doe  ',
      });
      const result = userMapper.responseToListItem(response);

      expect(result.fullName).toBe('John Doe');
    });

    it('should lowercase and trim email', () => {
      const response = createMockUserDetailsResponse({
        email: '  JOHN@EXAMPLE.COM  ',
      });
      const result = userMapper.responseToListItem(response);

      expect(result.email).toBe('john@example.com');
    });

    it('should preserve roles array', () => {
      const response = createMockUserDetailsResponse({
        roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
      });
      const result = userMapper.responseToListItem(response);

      expect(result.roles).toEqual(['ROLE_ADMIN', 'ROLE_MANAGER']);
    });

    it('should handle null lastLoginAt', () => {
      const response = createMockUserDetailsResponse({ lastLoginAt: null });
      const result = userMapper.responseToListItem(response);

      expect(result.lastLoginAt).toBeNull();
    });

    it('should not include createdAt in list item', () => {
      const response = createMockUserDetailsResponse();
      const result = userMapper.responseToListItem(response);

      expect(result).not.toHaveProperty('createdAt');
    });
  });
});
