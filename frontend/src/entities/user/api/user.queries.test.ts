/**
 * User Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { userQueries, type UserListQueryParams } from './user.queries';
import { expectValidQueryOptions, expectQueryKey, invokeQueryFn } from '@/test/entity-test-utils';
import type { Paginated } from '@/shared/lib/pagination';

// Mock dependencies
vi.mock('./get-user-list', () => ({
  getUserList: vi.fn(),
}));

vi.mock('./get-user-by-id', () => ({
  getUserById: vi.fn(),
}));

vi.mock('./assign-customers', () => ({
  getCustomerAssignments: vi.fn(),
}));

vi.mock('./user.mapper', () => ({
  userMapper: {
    toDomain: vi.fn((response) => ({ ...response, _mapped: true })),
  },
}));

// Import mocked modules
import { getUserList } from './get-user-list';
import { getUserById } from './get-user-by-id';
import { getCustomerAssignments } from './assign-customers';
import { userMapper } from './user.mapper';

describe('userQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(userQueries.all(), ['users']);
      });
    });

    describe('lists()', () => {
      it('should return list query key with "list" segment', () => {
        expectQueryKey(userQueries.lists(), ['users', 'list']);
      });
    });

    describe('details()', () => {
      it('should return detail query key segment', () => {
        expectQueryKey(userQueries.details(), ['users', 'detail']);
      });
    });

    describe('customersKeys()', () => {
      it('should return customers query key segment', () => {
        expectQueryKey(userQueries.customersKeys(), ['users', 'customers']);
      });
    });
  });

  // ==========================================================================
  // List Query Tests
  // ==========================================================================

  describe('list()', () => {
    const defaultParams: UserListQueryParams = {
      page: 0,
      size: 10,
      search: '',
      sort: '',
    };

    it('should return valid queryOptions', () => {
      const options = userQueries.list(defaultParams);
      expectValidQueryOptions(options);
    });

    it('should include all params in query key for cache separation', () => {
      const params: UserListQueryParams = {
        page: 1,
        size: 20,
        search: 'john',
        sort: 'fullName,asc',
      };
      const options = userQueries.list(params);

      expect(options.queryKey).toEqual([
        'users',
        'list',
        1,
        20,
        'john',
        'fullName,asc',
      ]);
    });

    it('should use default values when params are not provided', () => {
      const options = userQueries.list({});

      expect(options.queryKey).toEqual([
        'users',
        'list',
        0,
        10,
        '',
        '',
      ]);
    });

    it('should have placeholderData set for smooth transitions', () => {
      const options = userQueries.list(defaultParams);
      expect(options.placeholderData).toBeDefined();
    });

    it('should call getUserList with correct params in queryFn', async () => {
      const mockResponse = {
        data: [{ id: 1, username: 'john', email: 'john@test.com', fullName: 'John Doe', isActive: true, roles: [], createdAt: '', lastLoginAt: null }],
        pagination: { page: 0, size: 10, totalElements: 1, totalPages: 1, first: true, last: true },
      };
      vi.mocked(getUserList).mockResolvedValue(mockResponse);

      const params: UserListQueryParams = {
        page: 1,
        size: 20,
        search: 'john',
        sort: 'fullName,asc',
      };
      const options = userQueries.list(params);
      await invokeQueryFn(options);

      expect(getUserList).toHaveBeenCalledWith({
        page: 1,
        size: 20,
        search: 'john',
        sort: 'fullName,asc',
      });
    });

    it('should convert empty search/sort to undefined in queryFn', async () => {
      const mockResponse = {
        data: [],
        pagination: { page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true },
      };
      vi.mocked(getUserList).mockResolvedValue(mockResponse);

      const options = userQueries.list({ search: '', sort: '' });
      await invokeQueryFn(options);

      expect(getUserList).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        search: undefined,
        sort: undefined,
      });
    });

    it('should map response data using userMapper.toDomain', async () => {
      const mockResponse = {
        data: [
          { id: 1, username: 'john', email: 'john@test.com', fullName: 'John Doe', isActive: true, roles: [], createdAt: '', lastLoginAt: null },
          { id: 2, username: 'jane', email: 'jane@test.com', fullName: 'Jane Doe', isActive: true, roles: [], createdAt: '', lastLoginAt: null },
        ],
        pagination: { page: 0, size: 10, totalElements: 2, totalPages: 1, first: true, last: true },
      };
      vi.mocked(getUserList).mockResolvedValue(mockResponse);

      const options = userQueries.list(defaultParams);
      const result = await invokeQueryFn<Paginated<unknown>>(options);

      expect(userMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual(mockResponse.pagination);
    });
  });

  // ==========================================================================
  // Detail Query Tests
  // ==========================================================================

  describe('detail()', () => {
    it('should return valid queryOptions', () => {
      const options = userQueries.detail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = userQueries.detail(123);
      expect(options.queryKey).toEqual(['users', 'detail', 123]);
    });

    it('should be enabled when id > 0', () => {
      const options = userQueries.detail(123);
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when id <= 0', () => {
      const options1 = userQueries.detail(0);
      const options2 = userQueries.detail(-1);

      expect(options1.enabled).toBe(false);
      expect(options2.enabled).toBe(false);
    });

    it('should call getUserById with correct id in queryFn', async () => {
      const mockResponse = { id: 123, username: 'john', email: 'john@test.com', fullName: 'John Doe', isActive: true, roles: [], createdAt: '', lastLoginAt: null };
      vi.mocked(getUserById).mockResolvedValue(mockResponse);

      const options = userQueries.detail(123);
      await invokeQueryFn(options);

      expect(getUserById).toHaveBeenCalledWith(123);
    });

    it('should map response using userMapper.toDomain', async () => {
      const mockResponse = { id: 123, username: 'john', email: 'john@test.com', fullName: 'John Doe', isActive: true, roles: [], createdAt: '', lastLoginAt: null };
      vi.mocked(getUserById).mockResolvedValue(mockResponse);

      const options = userQueries.detail(123);
      const result = await invokeQueryFn(options);

      expect(userMapper.toDomain).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual({ ...mockResponse, _mapped: true });
    });

    it('should generate different query keys for different ids', () => {
      const key1 = userQueries.detail(1).queryKey;
      const key2 = userQueries.detail(2).queryKey;

      expect(key1).not.toEqual(key2);
      expect(key1[2]).toBe(1);
      expect(key2[2]).toBe(2);
    });
  });

  // ==========================================================================
  // Customers Query Tests
  // ==========================================================================

  describe('customers()', () => {
    it('should return valid queryOptions', () => {
      const options = userQueries.customers(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = userQueries.customers(123);
      expect(options.queryKey).toEqual(['users', 'customers', 123]);
    });

    it('should be enabled when id > 0', () => {
      const options = userQueries.customers(123);
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when id <= 0', () => {
      const options1 = userQueries.customers(0);
      const options2 = userQueries.customers(-1);

      expect(options1.enabled).toBe(false);
      expect(options2.enabled).toBe(false);
    });

    it('should call getCustomerAssignments with correct id in queryFn', async () => {
      const mockCustomerIds = [1, 2, 3];
      vi.mocked(getCustomerAssignments).mockResolvedValue(mockCustomerIds);

      const options = userQueries.customers(123);
      const result = await invokeQueryFn(options);

      expect(getCustomerAssignments).toHaveBeenCalledWith(123);
      expect(result).toEqual([1, 2, 3]);
    });
  });
});
