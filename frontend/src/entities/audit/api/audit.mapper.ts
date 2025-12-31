/**
 * Audit log mapper.
 *
 * Transforms DTOs to domain models.
 */

import type { AuditLog } from '../model';
import type { AuditLogDTO } from './audit.dto';

/**
 * Map AuditLogDTO to AuditLog domain model.
 */
function toDomain(dto: AuditLogDTO): AuditLog {
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
 * Map array of DTOs to domain models.
 */
function toDomainList(dtos: AuditLogDTO[]): AuditLog[] {
  return dtos.map(toDomain);
}

export const auditLogMapper = {
  toDomain,
  toDomainList,
};
