/**
 * Unit tests for auditService.
 * Tests audit log querying, entity ID transformation, pagination handling, and error propagation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditService } from './auditService';
import { createMockAuditLog, mockApiErrors } from '@/test/fixtures';
import type { AuditLogListParams } from './types';
import { httpClient } from '@/shared/api';

// Mock httpClient with inline factory (vi.mock is hoisted, so can't use imported functions)
vi.mock('@/shared/api', () => ({
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

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should fetch paginated audit logs and transform data', async () => {
      // Given: Mock paginated response
      const mockDto = createMockAuditLog();
      const mockResponse = {
        success: true,
        message: 'Audit logs retrieved successfully',
        timestamp: '2025-01-01T00:00:00Z',
        data: {
          content: [mockDto],
          number: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
        metadata: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
      };
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get audit logs
      const result = await auditService.getAuditLogs({ page: 0, size: 20 });

      // Then: Calls httpClient with correct params
      expect(httpClient.requestWithMeta).toHaveBeenCalledOnce();
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/audit',
        params: { page: 0, size: 20 },
      });

      // And: Returns paginated data
      expect(result.data).toHaveLength(1);
      expect(result.data[0].username).toBe('admin');
      expect(result.pagination.totalElements).toBe(1);
    });

    it('should pass through entityId as number', async () => {
      // Given: Response with number entityId (backend returns Long)
      const mockDto = createMockAuditLog({
        entityId: 456,
      });
      const mockResponse = {
        success: true,
        message: 'Success',
        timestamp: '2025-01-01T00:00:00Z',
        data: {
          content: [mockDto],
          number: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
        metadata: {},
      };
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get audit logs
      const result = await auditService.getAuditLogs();

      // Then: entityId passed through as number
      expect(result.data[0].entityId).toBe(456);
      expect(typeof result.data[0].entityId).toBe('number');
    });

    it('should handle null entityId', async () => {
      // Given: Response with null entityId
      const mockDto = createMockAuditLog({
        entityId: null,
      });
      const mockResponse = {
        success: true,
        message: 'Success',
        timestamp: '2025-01-01T00:00:00Z',
        data: {
          content: [mockDto],
          number: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
        metadata: {},
      };
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get audit logs
      const result = await auditService.getAuditLogs();

      // Then: entityId remains null
      expect(result.data[0].entityId).toBeNull();
    });

    it('should handle pagination metadata from metadata field', async () => {
      // Given: Response with metadata
      const mockResponse = {
        success: true,
        message: 'Success',
        timestamp: '2025-01-01T00:00:00Z',
        data: {
          content: [createMockAuditLog()],
          number: 5, // Different from metadata
          size: 100,
          totalElements: 500,
          totalPages: 50,
          first: false,
          last: false,
        },
        metadata: {
          page: 2, // Preferred value
          size: 20,
          totalElements: 100,
          totalPages: 5,
          first: false,
          last: false,
        },
      };
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get audit logs
      const result = await auditService.getAuditLogs();

      // Then: Uses metadata values
      expect(result.pagination.page).toBe(2); // From metadata
      expect(result.pagination.size).toBe(20); // From metadata
      expect(result.pagination.totalElements).toBe(100); // From metadata
    });

    it('should fallback to PagedResponse fields if metadata missing', async () => {
      // Given: Response without metadata
      const mockResponse = {
        success: true,
        message: 'Success',
        timestamp: '2025-01-01T00:00:00Z',
        data: {
          content: [createMockAuditLog()],
          number: 3,
          size: 25,
          totalElements: 150,
          totalPages: 6,
          first: false,
          last: false,
        },
        metadata: undefined,
      };
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get audit logs
      const result = await auditService.getAuditLogs();

      // Then: Falls back to PagedResponse fields
      expect(result.pagination.page).toBe(3); // From PagedResponse.number
      expect(result.pagination.size).toBe(25);
      expect(result.pagination.totalElements).toBe(150);
    });

    it('should handle filter params', async () => {
      // Given: Filter params
      const filters: AuditLogListParams = {
        page: 0,
        size: 10,
        username: 'admin',
        action: 'CREATE',
        entityType: 'User',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        sort: 'timestamp,desc',
      };

      const mockResponse = {
        success: true,
        message: 'Success',
        timestamp: '2025-01-01T00:00:00Z',
        data: {
          content: [],
          number: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        },
        metadata: {},
      };
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get audit logs with filters
      await auditService.getAuditLogs(filters);

      // Then: Passes all filter params
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/audit',
        params: filters,
      });
    });

    it('should handle empty results', async () => {
      // Given: Empty response
      const mockResponse = {
        success: true,
        message: 'Success',
        timestamp: '2025-01-01T00:00:00Z',
        data: {
          content: [],
          number: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        },
        metadata: {},
      };
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get audit logs
      const result = await auditService.getAuditLogs();

      // Then: Returns empty array
      expect(result.data).toEqual([]);
      expect(result.pagination.totalElements).toBe(0);
    });

    it('should preserve all audit log fields', async () => {
      // Given: Complete audit log entry
      const mockDto = createMockAuditLog({
        id: 100,
        entityType: 'Customer',
        entityId: 789,
        action: 'UPDATE',
        userId: 5,
        username: 'testuser',
        ipAddress: '10.0.0.1',
        changes: '{"name": "New Customer Name"}',
        metadata: '{"source": "web"}',
        createdAt: '2025-06-15T14:30:00Z',
      });
      const mockResponse = {
        success: true,
        message: 'Success',
        timestamp: '2025-01-01T00:00:00Z',
        data: {
          content: [mockDto],
          number: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
        metadata: {},
      };
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get audit logs
      const result = await auditService.getAuditLogs();

      // Then: All fields preserved
      const log = result.data[0];
      expect(log.id).toBe(100);
      expect(log.entityType).toBe('Customer');
      expect(log.entityId).toBe(789);
      expect(log.action).toBe('UPDATE');
      expect(log.userId).toBe(5);
      expect(log.username).toBe('testuser');
      expect(log.ipAddress).toBe('10.0.0.1');
      expect(log.changes).toBe('{"name": "New Customer Name"}');
      expect(log.metadata).toBe('{"source": "web"}');
      expect(log.createdAt).toBe('2025-06-15T14:30:00Z');
    });

    it('should handle entries with null optional fields', async () => {
      // Given: Audit log with null optional fields
      const mockDto = createMockAuditLog({
        entityId: null,
        userId: null,
        username: null,
        ipAddress: null,
        changes: null,
        metadata: null,
      });
      const mockResponse = {
        success: true,
        message: 'Success',
        timestamp: '2025-01-01T00:00:00Z',
        data: {
          content: [mockDto],
          number: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
        metadata: {},
      };
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get audit logs
      const result = await auditService.getAuditLogs();

      // Then: Null values preserved
      expect(result.data[0].entityId).toBeNull();
      expect(result.data[0].userId).toBeNull();
      expect(result.data[0].username).toBeNull();
      expect(result.data[0].ipAddress).toBeNull();
      expect(result.data[0].changes).toBeNull();
      expect(result.data[0].metadata).toBeNull();
    });

    it('should propagate API errors', async () => {
      // Given: API error
      vi.mocked(httpClient.requestWithMeta).mockRejectedValue(mockApiErrors.serverError);

      // When/Then: Propagates error
      await expect(auditService.getAuditLogs()).rejects.toEqual(mockApiErrors.serverError);
    });
  });

  describe('getAuditLog', () => {
    it('should fetch single audit log by ID', async () => {
      // Given: Mock audit log response
      const mockDto = createMockAuditLog({
        id: 555,
        entityId: 999,
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockDto);

      // When: Get audit log by ID
      const result = await auditService.getAuditLog(555);

      // Then: Calls httpClient with correct URL
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/audit/555');

      // And: Returns audit log
      expect(result.id).toBe(555);
      expect(result.entityId).toBe(999);
    });

    it('should pass through entityId as number', async () => {
      // Given: DTO with number entityId
      const mockDto = createMockAuditLog({
        entityId: 12345,
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockDto);

      // When: Get audit log
      const result = await auditService.getAuditLog(1);

      // Then: entityId is number
      expect(result.entityId).toBe(12345);
      expect(typeof result.entityId).toBe('number');
    });

    it('should handle null entityId', async () => {
      // Given: DTO with null entityId
      const mockDto = createMockAuditLog({
        entityId: null,
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockDto);

      // When: Get audit log
      const result = await auditService.getAuditLog(1);

      // Then: entityId remains null
      expect(result.entityId).toBeNull();
    });

    it('should preserve all fields', async () => {
      // Given: Complete audit log DTO
      const mockDto = createMockAuditLog({
        id: 777,
        entityType: 'Project',
        entityId: 888,
        action: 'DELETE',
        userId: 10,
        username: 'alice',
        ipAddress: '192.168.100.50',
        changes: '{"deleted": true}',
        metadata: '{"reason": "cleanup"}',
        createdAt: '2025-12-17T09:30:00Z',
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockDto);

      // When: Get audit log
      const result = await auditService.getAuditLog(777);

      // Then: All fields preserved
      expect(result.id).toBe(777);
      expect(result.entityType).toBe('Project');
      expect(result.entityId).toBe(888);
      expect(result.action).toBe('DELETE');
      expect(result.userId).toBe(10);
      expect(result.username).toBe('alice');
      expect(result.ipAddress).toBe('192.168.100.50');
      expect(result.changes).toBe('{"deleted": true}');
      expect(result.metadata).toBe('{"reason": "cleanup"}');
      expect(result.createdAt).toBe('2025-12-17T09:30:00Z');
    });

    it('should propagate 404 errors', async () => {
      // Given: Audit log not found
      vi.mocked(httpClient.get).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(auditService.getAuditLog(999)).rejects.toEqual(mockApiErrors.notFound);
    });

    it('should propagate authorization errors', async () => {
      // Given: Unauthorized access
      vi.mocked(httpClient.get).mockRejectedValue(mockApiErrors.forbidden);

      // When/Then: Propagates auth error
      await expect(auditService.getAuditLog(1)).rejects.toEqual(mockApiErrors.forbidden);
    });
  });
});
