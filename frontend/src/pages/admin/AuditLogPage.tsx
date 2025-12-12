/**
 * Audit Log Page - Admin Only
 *
 * Features:
 * - Paginated audit log list with filtering
 * - Filter by entity type, action, user
 * - View log details in modal
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { auditService, type AuditLogEntry as ApiAuditLogEntry } from '@/services';
import type { PaginationMetadata } from '@/api/types';

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

const ACTION_COLORS: Record<AuditAction, { bg: string; text: string }> = {
  CREATE: { bg: 'bg-green-500/20', text: 'text-green-400' },
  UPDATE: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  DELETE: { bg: 'bg-red-500/20', text: 'text-red-400' },
  VIEW: { bg: 'bg-steel-500/20', text: 'text-steel-300' },
  DOWNLOAD: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  APPROVE: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  REJECT: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  LOGIN: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  LOGOUT: { bg: 'bg-steel-600/20', text: 'text-steel-400' },
  ACCESS_DENIED: { bg: 'bg-red-600/20', text: 'text-red-300' },
};

const ENTITY_TYPES = ['User', 'Project', 'Quotation', 'Product', 'Invoice', 'Delivery'];

export function AuditLogPage() {
  // List state
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');

  // Detail modal state
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await auditService.getAuditLogs({
        page,
        size: 20,
        sort: 'createdAt,desc',
        entityType: filterEntityType || undefined,
        action: filterAction || undefined,
      });
      // Cast the result to our local type which has additional fields
      setLogs(result.data as unknown as AuditLogEntry[]);
      setPagination(result.pagination);
    } catch {
      setError('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [page, filterEntityType, filterAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle filter submit
  const handleApplyFilters = (e: FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilterEntityType('');
    setFilterAction('');
    setPage(0);
  };

  // Format timestamp
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

  // Parse JSON safely
  const parseJson = (str: string | null): Record<string, unknown> | null => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  // Select classes for filters
  const selectClasses =
    'rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20';

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
        <p className="mt-1 text-steel-400">System activity and security events</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <form onSubmit={handleApplyFilters} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-steel-500">
              Entity Type
            </label>
            <select
              value={filterEntityType}
              onChange={e => setFilterEntityType(e.target.value)}
              className={selectClasses}
            >
              <option value="">All Types</option>
              {ENTITY_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-steel-500">
              Action
            </label>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className={selectClasses}
            >
              <option value="">All Actions</option>
              {ALL_ACTIONS.map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-steel-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-steel-700"
            >
              Apply Filters
            </button>
            {(filterEntityType || filterAction) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-lg border border-steel-700/50 px-4 py-2 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-steel-800/50 bg-steel-900/60 backdrop-blur-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-steel-800/50 bg-steel-900/80">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-steel-400">
                Timestamp
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-steel-400">
                Action
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-steel-400">
                Entity
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-steel-400">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-steel-400">
                IP Address
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-steel-400">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-800/30">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <svg
                    className="mx-auto h-8 w-8 animate-spin text-copper-500"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-steel-400">Loading audit logs...</p>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-steel-400">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const actionColor = ACTION_COLORS[log.action] || {
                  bg: 'bg-steel-500/20',
                  text: 'text-steel-400',
                };
                return (
                  <tr key={log.id} className="transition-colors hover:bg-steel-800/30">
                    <td className="px-6 py-4 font-mono text-sm text-steel-300">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${actionColor.bg} ${actionColor.text}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{log.entityType}</div>
                      {log.entityId && (
                        <div className="font-mono text-xs text-steel-500">ID: {log.entityId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.username ? (
                        <div className="text-sm text-white">{log.username}</div>
                      ) : (
                        <span className="text-sm text-steel-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-steel-400">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
                        title="View details"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
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
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-steel-800/50 bg-steel-900/80 px-6 py-3">
            <div className="text-sm text-steel-400">
              Showing {page * pagination.size + 1} -{' '}
              {Math.min((page + 1) * pagination.size, pagination.totalElements)} of{' '}
              {pagination.totalElements} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={pagination.first}
                className="rounded-lg border border-steel-700/50 px-3 py-1.5 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={pagination.last}
                className="rounded-lg border border-steel-700/50 px-3 py-1.5 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl border border-steel-800/50 bg-steel-900 p-6 shadow-elevated">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Audit Log Details</h2>
                <p className="mt-1 text-sm text-steel-400">
                  Entry #{selectedLog.id} - {formatTimestamp(selectedLog.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Action & Entity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                    Action
                  </label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium ${ACTION_COLORS[selectedLog.action]?.bg || 'bg-steel-500/20'} ${ACTION_COLORS[selectedLog.action]?.text || 'text-steel-400'}`}
                    >
                      {selectedLog.action}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                    Entity
                  </label>
                  <div className="mt-1 text-white">
                    {selectedLog.entityType}
                    {selectedLog.entityId && (
                      <span className="ml-2 font-mono text-sm text-steel-400">
                        (ID: {selectedLog.entityId})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* User & IP */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                    User
                  </label>
                  <div className="mt-1 text-white">
                    {selectedLog.username || (
                      <span className="text-steel-500">System</span>
                    )}
                    {selectedLog.userId && (
                      <span className="ml-2 font-mono text-sm text-steel-400">
                        (ID: {selectedLog.userId})
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                    IP Address
                  </label>
                  <div className="mt-1 font-mono text-white">
                    {selectedLog.ipAddress || <span className="text-steel-500">-</span>}
                  </div>
                </div>
              </div>

              {/* Changes */}
              {selectedLog.changes && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                    Changes
                  </label>
                  <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-steel-700/50 bg-steel-800/50 p-4">
                    <pre className="font-mono text-xs text-steel-300 whitespace-pre-wrap">
                      {JSON.stringify(parseJson(selectedLog.changes), null, 2) ||
                        selectedLog.changes}
                    </pre>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-steel-500">
                    Metadata
                  </label>
                  <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-steel-700/50 bg-steel-800/50 p-4">
                    <pre className="font-mono text-xs text-steel-300 whitespace-pre-wrap">
                      {JSON.stringify(parseJson(selectedLog.metadata), null, 2) ||
                        selectedLog.metadata}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-steel-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-steel-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogPage;
