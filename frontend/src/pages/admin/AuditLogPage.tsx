/**
 * Audit Log Page - Admin Only
 *
 * FSD pattern:
 * - Pages are pure composition layer
 * - Server state via Query Factory (auditQueries.list)
 * - Entity UI components receive data via props
 * - Local state for filters and modal
 */

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  type AuditLog,
  auditQueries,
  AuditLogTable,
  AuditLogTableSkeleton,
} from '@/entities/audit';
import {
  Badge,
  type BadgeVariant,
  Button,
  Card,
  FilterBar,
  Modal,
  PageHeader,
  Pagination,
} from '@/shared/ui';

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

const ENTITY_TYPES = ['User', 'Project', 'Quotation', 'Product', 'Invoice', 'Delivery'];

interface AuditFilters {
  entityType: string;
  action: string;
}

const INITIAL_FILTERS: AuditFilters = {
  entityType: '',
  action: '',
};

export function AuditLogPage() {
  // Local UI State - filters, pagination, modal
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<AuditFilters>(INITIAL_FILTERS);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filter handlers
  const handleFilterChange = useCallback((key: keyof AuditFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Reset pagination on filter change
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(0);
  }, []);

  // Server state via Query Factory
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery(auditQueries.list({
    page,
    size: 10,
    sort: 'createdAt,desc',
    entityType: filters.entityType || undefined,
    action: filters.action || undefined,
  }));

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

  const hasActiveFilters = filters.entityType || filters.action;
  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title="이력 관리" description="System activity and security events" />
      </PageHeader>

      {/* Filters */}
      <FilterBar className="mb-6">
        <FilterBar.Field label="Entity Type">
          <FilterBar.Select
            value={filters.entityType}
            onValueChange={value => handleFilterChange('entityType', value)}
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

      {/* Error State */}
      {error && (
        <Card variant="table" className="mb-6">
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
      )}

      {/* Loading State */}
      {isLoading && <AuditLogTableSkeleton />}

      {/* Audit Log Table */}
      {!isLoading && !error && (
        <>
          <AuditLogTable
            logs={logs}
            onViewDetails={setSelectedLog}
            emptyMessage="No audit logs found."
          />

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
        </>
      )}

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
