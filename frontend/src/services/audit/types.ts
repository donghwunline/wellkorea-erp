/**
 * Audit service types (domain models).
 *
 * Field names match backend AuditLogResponse.java
 */

import type { Paginated } from '@/api/types';

export interface AuditLogEntry {
  id: number;
  entityType: string;
  entityId: number | null; // Transformed from string to number
  action: string;
  userId: number | null;
  username: string | null;
  ipAddress: string | null;
  changes: string | null;
  metadata: string | null;
  createdAt: string; // ISO 8601 string from Instant
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
