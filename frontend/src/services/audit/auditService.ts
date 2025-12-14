/**
 * Audit log service.
 * Business logic layer for audit log operations.
 *
 * Features:
 * - Audit log querying
 * - DTO → Domain transformations
 * - Type narrowing (string → number for entityId)
 */

import { httpClient } from '@/api';
import type { PaginationMetadata, PagedResponse } from '@/api/types';
import type { AuditLogEntry, AuditLogListParams, PaginatedAuditLogs } from './types';

const BASE_PATH = '/audit';

/**
 * DTO type from backend (entityId is string | null).
 */
interface AuditLogEntryDto {
  id: number;
  username: string;
  action: string;
  entityType: string;
  entityId: string | null; // Backend returns string
  details: string | null;
  ipAddress: string | null;
  timestamp: string;
}

/**
 * Transform AuditLogEntry DTO to domain model.
 * Converts entityId from string to number.
 */
function transformAuditLogEntry(dto: AuditLogEntryDto): AuditLogEntry {
  return {
    id: dto.id,
    username: dto.username,
    action: dto.action,
    entityType: dto.entityType,
    entityId: dto.entityId ? parseInt(dto.entityId, 10) : null, // string → number
    details: dto.details,
    ipAddress: dto.ipAddress,
    timestamp: dto.timestamp,
  };
}

/**
 * Audit log service.
 */
export const auditService = {
  /**
   * Get paginated list of audit logs.
   * Backend returns Page<AuditLogResponse> structure.
   */
  async getAuditLogs(params?: AuditLogListParams): Promise<PaginatedAuditLogs> {
    const response = await httpClient.requestWithMeta<PagedResponse<AuditLogEntryDto>>({
      method: 'GET',
      url: BASE_PATH,
      params,
    });

    const pagedData = response.data;
    const pagination = response.metadata as unknown as PaginationMetadata;

    return {
      data: pagedData.content.map(transformAuditLogEntry),
      pagination: {
        page: pagination.page ?? pagedData.number, // Use metadata if available, fallback to page number
        size: pagination.size ?? pagedData.size,
        totalElements: pagination.totalElements ?? pagedData.totalElements,
        totalPages: pagination.totalPages ?? pagedData.totalPages,
        first: pagination.first ?? pagedData.first,
        last: pagination.last ?? pagedData.last,
      },
    };
  },

  /**
   * Get audit log entry by ID.
   */
  async getAuditLog(id: number): Promise<AuditLogEntry> {
    const log = await httpClient.get<AuditLogEntryDto>(`${BASE_PATH}/${id}`);
    return transformAuditLogEntry(log);
  },
};
