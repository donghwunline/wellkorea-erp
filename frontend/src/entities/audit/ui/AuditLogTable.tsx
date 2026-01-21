/**
 * Audit Log Table.
 *
 * Entity display component for audit logs.
 * Receives data via props - no data fetching.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - No direct data fetching
 * - Receives value and delegates actions via props
 */

import { useTranslation } from 'react-i18next';
import type { AuditLog } from '../model/audit-log';
import { Badge, type BadgeVariant, Card, IconButton, Table } from '@/shared/ui';

/** Known audit actions for badge styling. */
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

export interface AuditLogTableProps {
  /**
   * Audit log entries to display.
   */
  logs: readonly AuditLog[];

  /**
   * Called when user clicks view details.
   */
  onViewDetails?: (log: AuditLog) => void;

  /**
   * Message shown when no logs found.
   */
  emptyMessage?: string;

  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * Format timestamp for display.
 */
function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Dumb audit log table component.
 *
 * @example
 * ```tsx
 * <AuditLogTable
 *   logs={logs}
 *   onViewDetails={handleViewDetails}
 *   emptyMessage="No audit logs found."
 * />
 * ```
 */
export function AuditLogTable({
  logs,
  onViewDetails,
  emptyMessage,
  className,
}: Readonly<AuditLogTableProps>) {
  const { t } = useTranslation('entities');
  const displayEmptyMessage = emptyMessage ?? t('audit.logTable.empty');

  return (
    <Card variant="table" className={className}>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t('audit.logTable.headers.timestamp')}</Table.HeaderCell>
            <Table.HeaderCell>{t('audit.logTable.headers.action')}</Table.HeaderCell>
            <Table.HeaderCell>{t('audit.logTable.headers.entity')}</Table.HeaderCell>
            <Table.HeaderCell>{t('audit.logTable.headers.user')}</Table.HeaderCell>
            <Table.HeaderCell>{t('audit.logTable.headers.ipAddress')}</Table.HeaderCell>
            <Table.HeaderCell className="text-right">{t('audit.logTable.headers.details')}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {logs.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6} className="text-center text-steel-400">
                {displayEmptyMessage}
              </Table.Cell>
            </Table.Row>
          ) : (
            logs.map(log => (
              <Table.Row key={log.id}>
                <Table.Cell className="font-mono text-sm">
                  {formatTimestamp(log.createdAt)}
                </Table.Cell>
                <Table.Cell>
                  <Badge variant={ACTION_BADGE_VARIANTS[log.action] || 'steel'}>
                    {log.action}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div>
                    <div className="text-sm text-white">{log.entityType}</div>
                    {log.entityId && (
                      <div className="font-mono text-xs text-steel-500">
                        ID: {log.entityId}
                      </div>
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
                <Table.Cell className="font-mono text-sm">
                  {log.ipAddress || '-'}
                </Table.Cell>
                <Table.Cell className="text-right">
                  {onViewDetails && (
                    <IconButton
                      onClick={() => onViewDetails(log)}
                      title={t('audit.logTable.viewDetails')}
                      aria-label={t('audit.logTable.viewDetails')}
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
                    </IconButton>
                  )}
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Card>
  );
}

/**
 * Skeleton loader for audit log table.
 */
export function AuditLogTableSkeleton() {
  const { t } = useTranslation('entities');

  return (
    <Card variant="table">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t('audit.logTable.headers.timestamp')}</Table.HeaderCell>
            <Table.HeaderCell>{t('audit.logTable.headers.action')}</Table.HeaderCell>
            <Table.HeaderCell>{t('audit.logTable.headers.entity')}</Table.HeaderCell>
            <Table.HeaderCell>{t('audit.logTable.headers.user')}</Table.HeaderCell>
            <Table.HeaderCell>{t('audit.logTable.headers.ipAddress')}</Table.HeaderCell>
            <Table.HeaderCell className="text-right">{t('audit.logTable.headers.details')}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Array.from({ length: 5 }).map((_, index) => (
            <Table.Row key={index}>
              <Table.Cell>
                <div className="h-4 w-32 animate-pulse rounded bg-steel-700" />
              </Table.Cell>
              <Table.Cell>
                <div className="h-5 w-16 animate-pulse rounded bg-steel-700" />
              </Table.Cell>
              <Table.Cell>
                <div className="space-y-1">
                  <div className="h-4 w-20 animate-pulse rounded bg-steel-700" />
                  <div className="h-3 w-12 animate-pulse rounded bg-steel-700" />
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="h-4 w-24 animate-pulse rounded bg-steel-700" />
              </Table.Cell>
              <Table.Cell>
                <div className="h-4 w-28 animate-pulse rounded bg-steel-700" />
              </Table.Cell>
              <Table.Cell className="text-right">
                <div className="ml-auto h-6 w-6 animate-pulse rounded bg-steel-700" />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}
