/**
 * Audit log service.
 * Business logic layer for audit log operations.
 *
 * Features:
 * - Audit log querying
 * - DTO → Domain transformations
 * - Type narrowing (string → number for entityId)
 */

import { httpClient, AUDIT_ENDPOINTS } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import { transformPagedResponse } from '@/services/shared';
import type { AuditLogEntry, AuditLogListParams, PaginatedAuditLogs } from './types';

/**
 * DTO type from backend (matches AuditLogResponse.java).
 * entityId comes as Long (number) from backend.
 */
interface AuditLogEntryDto {
  id: number;
  entityType: string;
  entityId: number | null;
  action: string;
  userId: number | null;
  username: string | null;
  ipAddress: string | null;
  changes: string | null;
  metadata: string | null;
  createdAt: string; // ISO 8601 from Instant
}

/**
 * Transform AuditLogEntry DTO to domain model.
 * Currently a passthrough since field names match.
 */
function transformAuditLogEntry(dto: AuditLogEntryDto): AuditLogEntry {
  return {
    id: dto.id,
    entityType: dto.entityType,
    entityId: dto.entityId,
    action: dto.action,
    userId: dto.userId,
    username: dto.username,
    ipAddress: dto.ipAddress,
    changes: dto.changes,
    metadata: dto.metadata,
    createdAt: dto.createdAt,
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
      url: AUDIT_ENDPOINTS.BASE,
      params,
    });

    const paginated = transformPagedResponse(response.data, response.metadata);
    return {
      ...paginated,
      data: paginated.data.map(transformAuditLogEntry),
    };
  },

  /**
   * Get audit log entry by ID.
   */
  async getAuditLog(id: number): Promise<AuditLogEntry> {
    const log = await httpClient.get<AuditLogEntryDto>(AUDIT_ENDPOINTS.byId(id));
    return transformAuditLogEntry(log);
  },
};
