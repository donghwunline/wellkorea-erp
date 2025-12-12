/**
 * Tests for auditApi service
 */

import {describe, it, expect, beforeEach, vi, type Mock} from 'vitest';
import {auditApi} from './auditApi';
import apiService from './apiService';

// Mock dependencies
vi.mock('./apiService');

describe('auditApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAuditLog = {
    id: 1,
    username: 'admin',
    action: 'CREATE',
    entityType: 'User',
    entityId: '2',
    details: 'Created user testuser',
    ipAddress: '127.0.0.1',
    timestamp: '2024-01-01T00:00:00Z',
  };

  const mockPaginatedResponse = {
    data: [mockAuditLog],
    pagination: {
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    },
  };

  describe('getAuditLogs', () => {
    it('should call apiService.getPaginated with correct parameters', async () => {
      (apiService.getPaginated as Mock).mockResolvedValue(mockPaginatedResponse);

      const params = {
        page: 0,
        size: 20,
        sort: 'timestamp,desc',
        username: 'admin',
        action: 'CREATE',
      };
      const result = await auditApi.getAuditLogs(params);

      expect(apiService.getPaginated).toHaveBeenCalledWith('/audit', {params});
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should work without parameters', async () => {
      (apiService.getPaginated as Mock).mockResolvedValue(mockPaginatedResponse);

      await auditApi.getAuditLogs();

      expect(apiService.getPaginated).toHaveBeenCalledWith('/audit', {params: undefined});
    });

    it('should support date range filtering', async () => {
      (apiService.getPaginated as Mock).mockResolvedValue(mockPaginatedResponse);

      const params = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        entityType: 'User',
      };
      await auditApi.getAuditLogs(params);

      expect(apiService.getPaginated).toHaveBeenCalledWith('/audit', {params});
    });
  });

  describe('getAuditLog', () => {
    it('should call apiService.get with correct path', async () => {
      (apiService.get as Mock).mockResolvedValue(mockAuditLog);

      const result = await auditApi.getAuditLog(1);

      expect(apiService.get).toHaveBeenCalledWith('/audit/1');
      expect(result).toEqual(mockAuditLog);
    });
  });
});
