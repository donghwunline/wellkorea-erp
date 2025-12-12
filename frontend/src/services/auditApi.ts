/**
 * Audit Log API service.
 * Encapsulates all audit-related API endpoints.
 */

import apiService, {type PaginatedResponse} from './apiService';

const BASE_PATH = '/audit';

/**
 * Audit log entry from the API.
 */
export interface AuditLogEntry {
  id: number;
  username: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  timestamp: string;
}

/**
 * Query parameters for listing audit logs.
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
 * Audit Log API endpoints.
 */
export const auditApi = {
  /**
   * Get paginated list of audit logs.
   * @param params - Pagination and filter parameters
   * @returns Paginated audit log list
   */
  getAuditLogs: (params?: AuditLogListParams): Promise<PaginatedResponse<AuditLogEntry>> =>
    apiService.getPaginated<AuditLogEntry>(BASE_PATH, {params}),

  /**
   * Get audit log entry by ID.
   * @param id - Audit log ID
   * @returns Audit log entry details
   */
  getAuditLog: (id: number): Promise<AuditLogEntry> =>
    apiService.get<AuditLogEntry>(`${BASE_PATH}/${id}`),
};

export default auditApi;
