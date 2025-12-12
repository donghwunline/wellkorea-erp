/**
 * Audit service types (domain models).
 */

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

export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}
