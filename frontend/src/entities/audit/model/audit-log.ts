/**
 * Audit log domain model.
 *
 * Represents an audit log entry for tracking system changes.
 * All properties are readonly to enforce immutability.
 */

/**
 * Audit log entry domain model.
 */
export interface AuditLog {
  /** Unique identifier */
  readonly id: number;

  /** Type of entity that was modified (e.g., User, Quotation) */
  readonly entityType: string;

  /** ID of the modified entity */
  readonly entityId: number | null;

  /** Action performed (e.g., CREATE, UPDATE, DELETE) */
  readonly action: string;

  /** User ID who performed the action */
  readonly userId: number | null;

  /** Username who performed the action */
  readonly username: string | null;

  /** IP address of the request */
  readonly ipAddress: string | null;

  /** JSON string of changed fields */
  readonly changes: string | null;

  /** Additional metadata */
  readonly metadata: string | null;

  /** When the action was performed (ISO 8601) */
  readonly createdAt: string;
}

/**
 * Pure functions for audit log business rules.
 */
export const auditLogRules = {
  /**
   * Check if the log entry has associated user information.
   */
  hasUser(log: AuditLog): boolean {
    return log.userId !== null && log.username !== null;
  },

  /**
   * Check if the log entry has entity reference.
   */
  hasEntityReference(log: AuditLog): boolean {
    return log.entityId !== null;
  },

  /**
   * Check if the log entry has changes recorded.
   */
  hasChanges(log: AuditLog): boolean {
    return log.changes !== null && log.changes.trim().length > 0;
  },

  /**
   * Parse changes JSON to object.
   * Returns null if parsing fails or changes is empty.
   */
  parseChanges(log: AuditLog): Record<string, unknown> | null {
    if (!log.changes) return null;
    try {
      return JSON.parse(log.changes);
    } catch {
      return null;
    }
  },

  /**
   * Parse metadata JSON to object.
   * Returns null if parsing fails or metadata is empty.
   */
  parseMetadata(log: AuditLog): Record<string, unknown> | null {
    if (!log.metadata) return null;
    try {
      return JSON.parse(log.metadata);
    } catch {
      return null;
    }
  },
};
