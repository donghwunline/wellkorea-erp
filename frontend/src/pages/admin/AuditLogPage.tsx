/**
 * Audit Log Page - Admin Only
 *
 * Follows Constitution Principle VI:
 * - Pure composition layer (composes features and UI components)
 * - No direct service calls (uses feature components instead)
 * - 4-Tier State Separation:
 *   Tier 1 (Local UI State): Detail modal open/close -> Local state in page
 *   Tier 2 (Page UI State): Filters/pagination -> useAuditLogPage hook
 *   Tier 3 (Server State): Audit log data -> AuditLogTable component
 *   Tier 4 (App Global State): Auth -> authStore via useAuth (not needed here)
 *
 * Import Policy:
 * - pages -> features: YES (via @/components/features/audit)
 * - pages -> ui: YES (via @/shared/ui)
 * - pages -> shared/hooks: YES (via @/shared/hooks)
 * - pages -> services: NO (use feature components instead)
 * - pages -> stores: NO (use shared hooks instead)
 */

import { useState } from 'react';
import type { AuditLog } from '@/entities/audit';
import { Alert, Badge, type BadgeVariant, Button, FilterBar, Modal, PageHeader } from '@/shared/ui';
import { AuditLogTable, useAuditLogPage } from '@/components/features/audit';

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

export function AuditLogPage() {
  // Page UI State (Tier 2) - from feature hook
  const { page, setPage, filters, handleFilterChange, handleClearFilters } = useAuditLogPage();

  // Local UI State (Tier 1) - Detail modal and error
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      {/* Audit Log Table (Server State managed by feature component) */}
      <AuditLogTable
        page={page}
        filters={{
          entityType: filters.username || undefined,
          action: filters.action || undefined,
        }}
        onPageChange={setPage}
        onViewDetails={setSelectedLog}
        onError={setError}
      />

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
