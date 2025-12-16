/**
 * Audit Log Page - Admin Only
 *
 * Refactored following Constitution Principle VI:
 * - Pure composition layer (minimal inline markup)
 * - No business logic (delegated to services)
 * - 4-Tier State Separation:
 *   Tier 1 (Local UI State): Detail modal open/close → Local state in page
 *   Tier 2 (Page UI State): Filters/pagination → useAuditLogPage hook
 *   Tier 3 (Server State): Audit log data → Direct service calls (TODO: migrate to React Query)
 *   Tier 4 (App Global State): Auth → authStore (already implemented)
 */

import { useCallback, useEffect, useState } from 'react';
import { type AuditLogEntry as ApiAuditLogEntry, auditService } from '@/services';
import type { PaginationMetadata } from '@/api/types';
import {
  Alert,
  Badge,
  type BadgeVariant,
  Button,
  Card,
  FilterBar,
  IconButton,
  LoadingState,
  Modal,
  PageHeader,
  Pagination,
  Table,
} from '@/components/ui';
import { useAuditLogPage } from './_hooks/useAuditLogPage';

interface AuditLogEntry extends Omit<ApiAuditLogEntry, 'action' | 'entityId'> {
  entityId: number | null;
  action: AuditAction;
  userId: number | null;
  changes: string | null;
  metadata: string | null;
  createdAt: string;
}

type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'DOWNLOAD'
  | 'APPROVE'
  | 'REJECT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'ACCESS_DENIED';

const ALL_ACTIONS: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'VIEW',
  'DOWNLOAD',
  'APPROVE',
  'REJECT',
  'LOGIN',
  'LOGOUT',
  'ACCESS_DENIED',
];

const ACTION_BADGE_VARIANTS: Record<AuditAction, BadgeVariant> = {
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

const ENTITY_TYPES = ['User', 'Project', 'Quotation', 'Product', 'Invoice', 'Delivery'];

export function AuditLogPage() {
  // Page UI State (Tier 2) - from page hook
  const { page, setPage, filters, handleFilterChange, handleClearFilters } = useAuditLogPage();

  // Server State (Tier 3) - TODO: Move to React Query
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local UI State (Tier 1) - Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await auditService.getAuditLogs({
        page,
        size: 10,
        sort: 'createdAt,desc',
        entityType: filters.username || undefined,
        action: filters.action || undefined,
      });
      setLogs(result.data as unknown as AuditLogEntry[]);
      setPagination(result.pagination);
    } catch {
      setError('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Utilities
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

  const parseJson = (str: string | null): Record<string, unknown> | null => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  const hasActiveFilters = filters.username || filters.action;

  // Render table body based on loading/empty/data state
  const renderTableBody = () => {
    if (isLoading) {
      return <LoadingState variant="table" colspan={6} message="Loading audit logs..." />;
    }

    if (logs.length === 0) {
      return (
        <Table.Row>
          <Table.Cell colSpan={6} className="text-center text-steel-400">
            No audit logs found.
          </Table.Cell>
        </Table.Row>
      );
    }

    return logs.map(log => (
      <Table.Row key={log.id}>
        <Table.Cell className="font-mono text-sm">{formatTimestamp(log.createdAt)}</Table.Cell>
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
            onClick={() => setSelectedLog(log)}
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
    ));
  };

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title="Audit Logs" description="System activity and security events" />
      </PageHeader>

      {/* Filters */}
      <FilterBar className="mb-6">
        <FilterBar.Field label="Entity Type">
          <FilterBar.Select
            value={filters.username}
            onValueChange={value => handleFilterChange('username', value)}
            options={ENTITY_TYPES.map(type => ({ value: type, label: type }))}
            placeholder="All Types"
          />
        </FilterBar.Field>

        <FilterBar.Field label="Action">
          <FilterBar.Select
            value={filters.action}
            onValueChange={value => handleFilterChange('action', value)}
            options={ALL_ACTIONS.map(action => ({ value: action, label: action }))}
            placeholder="All Actions"
          />
        </FilterBar.Field>

        {hasActiveFilters && (
          <Button variant="secondary" onClick={handleClearFilters} className="self-end">
            Clear Filters
          </Button>
        )}
      </FilterBar>

      {/* Error Message */}
      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Audit Log Table */}
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
          <Table.Body>{renderTableBody()}</Table.Body>
        </Table>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalItems={pagination.totalElements}
            itemsPerPage={pagination.size}
            onPageChange={setPage}
            isFirst={pagination.first}
            isLast={pagination.last}
          />
        )}
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Details"
          size="lg"
        >
          <p className="mb-6 text-sm text-steel-400">
            Entry #{selectedLog.id} - {formatTimestamp(selectedLog.createdAt)}
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  Action
                </label>
                <Badge variant={ACTION_BADGE_VARIANTS[selectedLog.action] || 'steel'}>
                  {selectedLog.action}
                </Badge>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  Entity Type
                </label>
                <p className="mt-1 text-white">{selectedLog.entityType}</p>
              </div>
            </div>

            {selectedLog.entityId && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  Entity ID
                </label>
                <p className="mt-1 font-mono text-white">{selectedLog.entityId}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  User
                </label>
                <p className="mt-1 text-white">{selectedLog.username || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  IP Address
                </label>
                <p className="mt-1 font-mono text-white">{selectedLog.ipAddress || '-'}</p>
              </div>
            </div>

            {selectedLog.changes && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  Changes
                </label>
                <pre className="mt-1 overflow-auto rounded-lg bg-steel-950 p-4 text-xs text-steel-300">
                  {JSON.stringify(parseJson(selectedLog.changes), null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.metadata && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  Metadata
                </label>
                <pre className="mt-1 overflow-auto rounded-lg bg-steel-950 p-4 text-xs text-steel-300">
                  {JSON.stringify(parseJson(selectedLog.metadata), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
