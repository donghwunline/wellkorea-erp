/**
 * Unit tests for auditService.
 * Tests audit log querying, entity ID transformation, pagination handling, and error propagation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from './auditService';
import type { PagedResponse, ApiError } from '@/api/types';
import type { AuditLogEntry, AuditLogListParams } from './types';

// Mock httpClient
vi.mock('@/api', () => ({
  httpClient: {
    get: vi.fn(),
    requestWithMeta: vi.fn(),
  },
}));

import { httpClient } from '@/api';

// DTO interface (backend returns entityId as string)
interface AuditLogEntryDto {
  id: number;
  username: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  timestamp: string;
}

// Test fixture factory
function createMockAuditLogDto(overrides?: Partial<AuditLogEntryDto>): AuditLogEntryDto {
  return {
    id: 1,
    username: 'admin',
    action: 'CREATE',
    entityType: 'User',
    entityId: '123', // Backend returns string
    details: 'Created user testuser',
    ipAddress: '192.168.1.1',
    timestamp: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should fetch paginated audit logs and transform data', async () => {
      // Given: Mock paginated response
      const mockDto = createMockAuditLogDto();
      const mockResponse = {
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

    it('should transform entityId from string to number', async () => {
      // Given: Response with string entityId
      const mockDto = createMockAuditLogDto({
        entityId: '456', // String from backend
      });
      const mockResponse = {
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

      // Then: entityId transformed to number
      expect(result.data[0].entityId).toBe(456); // Number
      expect(typeof result.data[0].entityId).toBe('number');
    });

    it('should handle null entityId', async () => {
      // Given: Response with null entityId
      const mockDto = createMockAuditLogDto({
        entityId: null,
      });
      const mockResponse = {
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
        data: {
          content: [createMockAuditLogDto()],
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
        data: {
          content: [createMockAuditLogDto()],
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
      const mockDto = createMockAuditLogDto({
        id: 100,
        username: 'testuser',
        action: 'UPDATE',
        entityType: 'Customer',
        entityId: '789',
        details: 'Updated customer name',
        ipAddress: '10.0.0.1',
        timestamp: '2025-06-15T14:30:00Z',
      });
      const mockResponse = {
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

      // Then: All fields preserved and correctly transformed
      const log = result.data[0];
      expect(log.id).toBe(100);
      expect(log.username).toBe('testuser');
      expect(log.action).toBe('UPDATE');
      expect(log.entityType).toBe('Customer');
      expect(log.entityId).toBe(789); // Transformed to number
      expect(log.details).toBe('Updated customer name');
      expect(log.ipAddress).toBe('10.0.0.1');
      expect(log.timestamp).toBe('2025-06-15T14:30:00Z');
    });

    it('should handle entries with null details and ipAddress', async () => {
      // Given: Audit log with null optional fields
      const mockDto = createMockAuditLogDto({
        details: null,
        ipAddress: null,
        entityId: null,
      });
      const mockResponse = {
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
      expect(result.data[0].details).toBeNull();
      expect(result.data[0].ipAddress).toBeNull();
      expect(result.data[0].entityId).toBeNull();
    });

    it('should propagate API errors', async () => {
      // Given: API error
      const apiError: ApiError = {
        status: 500,
        errorCode: 'SERVER_001',
        message: 'Database error',
      };
      vi.mocked(httpClient.requestWithMeta).mockRejectedValue(apiError);

      // When/Then: Propagates error
      await expect(auditService.getAuditLogs()).rejects.toEqual(apiError);
    });
  });

  describe('getAuditLog', () => {
    it('should fetch single audit log by ID and transform', async () => {
      // Given: Mock audit log response
      const mockDto = createMockAuditLogDto({
        id: 555,
        entityId: '999',
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockDto);

      // When: Get audit log by ID
      const result = await auditService.getAuditLog(555);

      // Then: Calls httpClient with correct URL
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/audit/555');

      // And: Returns transformed audit log
      expect(result.id).toBe(555);
      expect(result.entityId).toBe(999); // Transformed to number
    });

    it('should transform entityId from string to number', async () => {
      // Given: DTO with string entityId
      const mockDto = createMockAuditLogDto({
        entityId: '12345',
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
      const mockDto = createMockAuditLogDto({
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
      const mockDto = createMockAuditLogDto({
        id: 777,
        username: 'alice',
        action: 'DELETE',
        entityType: 'Project',
        entityId: '888',
        details: 'Deleted project WK2025-000001-20250101',
        ipAddress: '192.168.100.50',
        timestamp: '2025-12-17T09:30:00Z',
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockDto);

      // When: Get audit log
      const result = await auditService.getAuditLog(777);

      // Then: All fields preserved
      expect(result.id).toBe(777);
      expect(result.username).toBe('alice');
      expect(result.action).toBe('DELETE');
      expect(result.entityType).toBe('Project');
      expect(result.entityId).toBe(888); // Transformed
      expect(result.details).toBe('Deleted project WK2025-000001-20250101');
      expect(result.ipAddress).toBe('192.168.100.50');
      expect(result.timestamp).toBe('2025-12-17T09:30:00Z');
    });

    it('should propagate 404 errors', async () => {
      // Given: Audit log not found
      const apiError: ApiError = {
        status: 404,
        errorCode: 'RES_001',
        message: 'Audit log not found',
      };
      vi.mocked(httpClient.get).mockRejectedValue(apiError);

      // When/Then: Propagates 404
      await expect(auditService.getAuditLog(999)).rejects.toEqual(apiError);
    });

    it('should propagate authorization errors', async () => {
      // Given: Unauthorized access
      const apiError: ApiError = {
        status: 403,
        errorCode: 'AUTH_005',
        message: 'Insufficient permissions to view audit logs',
      };
      vi.mocked(httpClient.get).mockRejectedValue(apiError);

      // When/Then: Propagates auth error
      await expect(auditService.getAuditLog(1)).rejects.toEqual(apiError);
    });
  });
});
