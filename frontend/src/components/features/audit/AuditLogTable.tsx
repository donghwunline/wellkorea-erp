/**
 * Audit Log Table - Smart Feature Component
 *
 * Responsibilities:
 * - Fetch audit log data using TanStack Query
 * - Display logs in table format
 * - Delegate detail view to parent via callback
 * - Respond to filter/page changes
 *
 * This component uses server state via useAuditLogs hook.
 */

import { type AuditLog, useAuditLogs } from '@/entities/audit';
import { Badge, type BadgeVariant, Card, IconButton, LoadingState, Pagination, Table } from '@/shared/ui';

/** Known audit actions for badge styling. API may return unknown actions. */
const ACTION_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  VIEW: 'steel',
  DOWNLOAD: 'purple',
  APPROVE: 'success',
  REJECT: 'warning',
  LOGIN: 'info',
  LOGOUT: 'steel',
  ACCESS_DENIED: 'danger',
};

export interface AuditLogFilters {
  entityType?: string;
  action?: string;
}

export interface AuditLogTableProps {
  /** Current page (0-indexed) */
  page: number;
  /** Filter values */
  filters: AuditLogFilters;
  /** Called when page changes */
  onPageChange: (page: number) => void;
  /** Called when user clicks view details */
  onViewDetails: (log: AuditLog) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

/**
 * Smart table component that fetches and displays audit logs.
 *
 * @example
 * ```tsx
 * <AuditLogTable
 *   page={page}
 *   filters={{ entityType: 'User', action: 'CREATE' }}
 *   onPageChange={setPage}
 *   onViewDetails={handleViewDetails}
 * />
 * ```
 */
export function AuditLogTable({
  page,
  filters,
  onPageChange,
  onViewDetails,
}: Readonly<AuditLogTableProps>) {
  // Use TanStack Query for server state
  const { data, isLoading, error, refetch } = useAuditLogs({
    page,
    size: 10,
    sort: 'createdAt,desc',
    entityType: filters.entityType || undefined,
    action: filters.action || undefined,
  });

  // Format timestamp utility
  const formatTimestamp = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card variant="table">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Timestamp</Table.HeaderCell>
              <Table.HeaderCell>Action</Table.HeaderCell>
              <Table.HeaderCell>Entity</Table.HeaderCell>
              <Table.HeaderCell>User</Table.HeaderCell>
              <Table.HeaderCell>IP Address</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Details</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <LoadingState variant="table" colspan={6} message="Loading audit logs..." />
          </Table.Body>
        </Table>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card variant="table">
        <div className="p-8 text-center">
          <p className="text-red-400">Failed to load audit logs</p>
          <button
            onClick={() => refetch()}
            className="mt-4 text-sm text-copper-500 hover:underline"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  return (
    <Card variant="table">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Timestamp</Table.HeaderCell>
            <Table.HeaderCell>Action</Table.HeaderCell>
            <Table.HeaderCell>Entity</Table.HeaderCell>
            <Table.HeaderCell>User</Table.HeaderCell>
            <Table.HeaderCell>IP Address</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Details</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {logs.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6} className="text-center text-steel-400">
                No audit logs found.
              </Table.Cell>
            </Table.Row>
          ) : (
            logs.map(log => (
              <Table.Row key={log.id}>
                <Table.Cell className="font-mono text-sm">
                  {formatTimestamp(log.createdAt)}
                </Table.Cell>
                <Table.Cell>
                  <Badge variant={ACTION_BADGE_VARIANTS[log.action] || 'steel'}>{log.action}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <div>
                    <div className="text-sm text-white">{log.entityType}</div>
                    {log.entityId && (
                      <div className="font-mono text-xs text-steel-500">ID: {log.entityId}</div>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  {log.username ? (
                    <div className="text-sm">{log.username}</div>
                  ) : (
                    <span className="text-sm text-steel-500">-</span>
                  )}
                </Table.Cell>
                <Table.Cell className="font-mono text-sm">{log.ipAddress || '-'}</Table.Cell>
                <Table.Cell className="text-right">
                  <IconButton
                    onClick={() => onViewDetails(log)}
                    title="View details"
                    aria-label="View details"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalItems={pagination.totalElements}
          itemsPerPage={pagination.size}
          onPageChange={onPageChange}
          isFirst={pagination.first}
          isLast={pagination.last}
        />
      )}
    </Card>
  );
}
