/**
 * Audit service types (domain models).
 */

import type { Paginated } from '@/api/types';

export interface AuditLogEntry {
  id: number;
  username: string;
  action: string;
  entityType: string;
  entityId: number | null; // Transformed from string to number
  details: string | null;
  ipAddress: string | null;
  timestamp: string; // ISO 8601 string (can be converted to Date if needed)
}

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
 * Paginated audit log list response.
 * Uses generic Paginated<T> instead of custom interface.
 */
export type PaginatedAuditLogs = Paginated<AuditLogEntry>;
