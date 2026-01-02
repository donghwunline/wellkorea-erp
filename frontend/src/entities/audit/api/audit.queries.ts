/**
 * Audit Query Factory.
 *
 * TanStack Query v5 query options factory.
 * Use with useQuery() directly - no custom hooks needed.
 *
 * @example
 * ```typescript
 * // List audit logs with pagination
 * const { data } = useQuery(auditQueries.list({ page: 0, size: 20 }));
 *
 * // Get audit log detail
 * const { data } = useQuery(auditQueries.detail(id));
 * ```
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import type { Paginated } from '@/shared/lib/pagination';
import type { AuditLog } from '../model/audit-log';
import { auditApi } from './audit.api';
import { auditLogMapper } from './audit.mapper';

// =============================================================================
// Query Parameters
// =============================================================================

export interface AuditListQueryParams {
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
// Query Factory
// =============================================================================

export const auditQueries = {
  // -------------------------------------------------------------------------
  // Query Keys
  // -------------------------------------------------------------------------

  /** Base key for all audit queries */
  all: () => ['audit'] as const,

  /** Key for audit list queries */
  lists: () => [...auditQueries.all(), 'list'] as const,

  /** Key for audit detail queries */
  details: () => [...auditQueries.all(), 'detail'] as const,

  // -------------------------------------------------------------------------
  // Audit List Query
  // -------------------------------------------------------------------------

  /**
   * Query options for paginated audit log list.
   */
  list: (params: AuditListQueryParams = {}) =>
    queryOptions({
      queryKey: [
        ...auditQueries.lists(),
        params.page ?? 0,
        params.size ?? 10,
        params.sort ?? '',
        params.username ?? '',
        params.action ?? '',
        params.entityType ?? '',
        params.startDate ?? '',
        params.endDate ?? '',
      ] as const,
      queryFn: async (): Promise<Paginated<AuditLog>> => {
        const response = await auditApi.getList({
          page: params.page ?? 0,
          size: params.size ?? 10,
          sort: params.sort,
          username: params.username,
          action: params.action,
          entityType: params.entityType,
          startDate: params.startDate,
          endDate: params.endDate,
        });

        return {
          data: response.data.map(auditLogMapper.toDomain),
          pagination: response.pagination,
        };
      },
      placeholderData: keepPreviousData,
    }),

  // -------------------------------------------------------------------------
  // Audit Detail Query
  // -------------------------------------------------------------------------

  /**
   * Query options for audit log detail.
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...auditQueries.details(), id] as const,
      queryFn: async (): Promise<AuditLog> => {
        const dto = await auditApi.getById(id);
        return auditLogMapper.toDomain(dto);
      },
      enabled: id > 0,
    }),
};
