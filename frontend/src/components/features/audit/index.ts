/**
 * Audit Feature Components
 *
 * Smart components for audit log feature.
 * These components can fetch data, access stores, and manage complex state.
 *
 * Components:
 * - AuditLogTable: Data table with audit logs, fetches from service
 *
 * Hooks:
 * - useAuditLogPage: Page UI state (pagination, filters)
 */

// Re-export hooks for convenience
export * from './hooks';

// Table component (handles data fetching)
export { AuditLogTable } from './AuditLogTable';
export type { AuditLogTableProps, AuditLogFilters } from './AuditLogTable';
