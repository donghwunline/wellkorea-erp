/**
 * Audit API functions.
 *
 * Raw API calls for audit log operations.
 */

import { httpClient, AUDIT_ENDPOINTS } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import { transformPagedResponse } from '@/shared/api';
import type { AuditLogDTO, AuditLogListParamsDTO, PaginatedAuditLogsDTO } from './audit.dto';

/**
 * Audit log API functions.
 */
export const auditApi = {
  /**
   * Get paginated list of audit logs.
   * Returns raw DTOs - callers should map to domain models.
   */
  async getList(params?: AuditLogListParamsDTO): Promise<PaginatedAuditLogsDTO> {
    const response = await httpClient.requestWithMeta<PagedResponse<AuditLogDTO>>({
      method: 'GET',
      url: AUDIT_ENDPOINTS.BASE,
      params,
    });

    return transformPagedResponse(response.data, response.metadata);
  },

  /**
   * Get audit log by ID.
   * Returns raw DTO - callers should map to domain model.
   */
  async getById(id: number): Promise<AuditLogDTO> {
    return httpClient.get<AuditLogDTO>(AUDIT_ENDPOINTS.byId(id));
  },
};
