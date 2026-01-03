/**
 * Audit Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 */

import type { AuditLog } from '../model/audit-log';

// =============================================================================
// RESPONSE TYPE
// =============================================================================

/**
 * Audit log entry as returned by the API.
 * Matches backend AuditLogResponse.java
 */
export interface AuditLogResponse {
  id: number;
  entityType: string;
  entityId: number | null;
  action: string;
  userId: number | null;
  username: string | null;
  ipAddress: string | null;
  changes: string | null;
  metadata: string | null;
  createdAt: string;
}

// =============================================================================
// MAPPER
// =============================================================================

/**
 * Audit log mapper functions.
 */
export const auditLogMapper = {
  /**
   * Map AuditLogResponse to AuditLog domain model.
   */
  toDomain(response: AuditLogResponse): AuditLog {
    return {
      id: response.id,
      entityType: response.entityType,
      entityId: response.entityId,
      action: response.action,
      userId: response.userId,
      username: response.username,
      ipAddress: response.ipAddress,
      changes: response.changes,
      metadata: response.metadata,
      createdAt: response.createdAt,
    };
  },
};
