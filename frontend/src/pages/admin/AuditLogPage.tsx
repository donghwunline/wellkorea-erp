/**
 * Audit Log Page - Admin Only
 *
 * FSD pattern:
 * - Pages are pure composition layer
 * - Server state via Query Factory (auditQueries.list)
 * - Entity UI components receive data via props
 * - Local state for filters and modal
 */

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('admin');

  // Local UI State - filters, pagination, modal
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<AuditFilters>(INITIAL_FILTERS);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Translated action options
  const actionOptions = useMemo(() =>
    ALL_ACTIONS.map(action => ({
      value: action,
      label: t(`audit.actions.${action}`, { defaultValue: action })
    })),
  [t]);

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
        <PageHeader.Title title={t('audit.title')} description={t('audit.description')} />
      </PageHeader>

      {/* Filters */}
      <FilterBar className="mb-6">
        <FilterBar.Field label={t('audit.filters.entityType')}>
          <FilterBar.Select
            value={filters.entityType}
            onValueChange={value => handleFilterChange('entityType', value)}
            options={ENTITY_TYPES.map(type => ({ value: type, label: type }))}
            placeholder={t('audit.filters.allTypes')}
          />
        </FilterBar.Field>

        <FilterBar.Field label={t('audit.filters.action')}>
          <FilterBar.Select
            value={filters.action}
            onValueChange={value => handleFilterChange('action', value)}
            options={actionOptions}
            placeholder={t('audit.filters.allActions')}
          />
        </FilterBar.Field>

        {hasActiveFilters && (
          <Button variant="secondary" onClick={handleClearFilters} className="self-end">
            {t('audit.filters.clearFilters')}
          </Button>
        )}
      </FilterBar>

      {/* Error State */}
      {error && (
        <Card variant="table" className="mb-6">
          <div className="p-8 text-center">
            <p className="text-red-400">{t('audit.list.loadError')}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-sm text-copper-500 hover:underline"
            >
              {t('common.retry')}
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
            emptyMessage={t('audit.list.empty')}
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
          title={t('audit.details.title')}
          size="lg"
        >
          <p className="mb-6 text-sm text-steel-400">
            {t('audit.details.entry', { id: selectedLog.id })} - {formatTimestamp(selectedLog.createdAt)}
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  {t('audit.fields.action')}
                </label>
                <Badge variant={ACTION_BADGE_VARIANTS[selectedLog.action] || 'steel'}>
                  {t(`audit.actions.${selectedLog.action}`, { defaultValue: selectedLog.action })}
                </Badge>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  {t('audit.fields.entity')}
                </label>
                <p className="mt-1 text-white">{selectedLog.entityType}</p>
              </div>
            </div>

            {selectedLog.entityId && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  {t('audit.fields.entityId')}
                </label>
                <p className="mt-1 font-mono text-white">{selectedLog.entityId}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  {t('audit.fields.user')}
                </label>
                <p className="mt-1 text-white">{selectedLog.username || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  {t('audit.fields.ipAddress')}
                </label>
                <p className="mt-1 font-mono text-white">{selectedLog.ipAddress || '-'}</p>
              </div>
            </div>

            {selectedLog.changes && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  {t('audit.fields.changes')}
                </label>
                <pre className="mt-1 overflow-auto rounded-lg bg-steel-950 p-4 text-xs text-steel-300">
                  {JSON.stringify(parseJson(selectedLog.changes), null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.metadata && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                  {t('audit.details.metadata')}
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
