/**
 * Audit API DTOs.
 *
 * Data transfer objects matching the backend API contract.
 */

/**
 * Audit log entry DTO from API response.
 * Matches backend AuditLogResponse.java
 */
export interface AuditLogDTO {
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

/**
 * Query parameters for listing audit logs.
 */
export interface AuditLogListParamsDTO {
  page?: number;
  size?: number;
  sort?: string;
  username?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

