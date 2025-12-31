/**
 * Audit query functions.
 *
 * Reusable query functions that map DTOs to domain models.
 * Use these in query hooks and for prefetching.
 */

import type { Paginated } from '@/shared/api/types';
import { auditApi } from '../api/audit.api';
import { auditLogMapper } from '../api/audit.mapper';
import type { AuditLog } from '../model';

/**
 * List query parameters (domain level).
 */
export interface AuditLogListParams {
  page?: number;
  size?: number;
  sort?: string;
  username?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Paginated audit logs response (domain level).
 */
export type PaginatedAuditLogs = Paginated<AuditLog>;

/**
 * Query functions for audit logs.
 */
export const auditQueryFns = {
  /**
   * Fetch paginated list of audit logs.
   * Maps DTOs to domain models.
   */
  async list(params?: AuditLogListParams): Promise<PaginatedAuditLogs> {
    const result = await auditApi.getList(params);
    return {
      data: auditLogMapper.toDomainList(result.data),
      pagination: result.pagination,
    };
  },

  /**
   * Fetch single audit log by ID.
   * Maps DTO to domain model.
   */
  async detail(id: number): Promise<AuditLog> {
    const dto = await auditApi.getById(id);
    return auditLogMapper.toDomain(dto);
  },
};
