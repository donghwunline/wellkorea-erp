/**
 * Get Audit List query function.
 *
 * Fetches paginated list of audit logs.
 * Used by audit.queries.ts for TanStack Query integration.
 */

import { httpClient, AUDIT_ENDPOINTS, type PagedResponse } from '@/shared/api';
import { transformPagedResponse, type Paginated } from '@/shared/lib/pagination';
import type { AuditLogResponse } from './audit.mapper';

// =============================================================================
// QUERY PARAMS
// =============================================================================

/**
 * Parameters for audit log list query.
 */
export interface GetAuditListParams {
  page?: number;
  size?: number;
  sort?: string;
  username?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Get paginated list of audit logs.
 *
 * @param params - Query parameters
 * @returns Paginated audit log list
 *
 * @example
 * ```typescript
 * const logs = await getAuditList({ page: 0, size: 20, action: 'CREATE' });
 * ```
 */
export async function getAuditList(params: GetAuditListParams = {}): Promise<Paginated<AuditLogResponse>> {
  const response = await httpClient.requestWithMeta<PagedResponse<AuditLogResponse>>({
    method: 'GET',
    url: AUDIT_ENDPOINTS.BASE,
    params: {
      page: params.page,
      size: params.size,
      sort: params.sort || undefined,
      username: params.username || undefined,
      action: params.action || undefined,
      entityType: params.entityType || undefined,
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
    },
  });

  return transformPagedResponse(response.data, response.metadata);
}
