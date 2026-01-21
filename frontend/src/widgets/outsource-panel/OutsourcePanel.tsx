/**
 * Outsource Panel Widget
 *
 * Displays outsourcing/subcontracting request information for a project including:
 * - Purchase request summary stats (for outsourced services)
 * - List of purchase requests with status
 * - Link to create new purchase request (future)
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Alert, Badge, Card, Icon, LoadingState, Table } from '@/shared/ui';
import {
  type PurchaseRequestListItem,
  purchaseRequestQueries,
  purchaseRequestRules,
  PurchaseRequestStatus,
  PurchaseRequestStatusConfig,
} from '@/entities/purchase-request';
import { formatDate } from '@/shared/lib/formatting';

export interface OutsourcePanelProps {
  /** Project ID to filter purchase requests */
  readonly projectId: number;
}

/**
 * Summary stats for purchase requests
 */
function PurchaseRequestSummaryStats({
  requests,
  t,
}: {
  readonly requests: readonly PurchaseRequestListItem[];
  readonly t: (key: string) => string;
}) {
  const stats = useMemo(() => {
    const total = requests.length;
    const draft = requests.filter(r => r.status === PurchaseRequestStatus.DRAFT).length;
    const rfqSent = requests.filter(r => r.status === PurchaseRequestStatus.RFQ_SENT).length;
    const vendorSelected = requests.filter(
      r => r.status === PurchaseRequestStatus.VENDOR_SELECTED
    ).length;
    const ordered = requests.filter(r => r.status === PurchaseRequestStatus.ORDERED).length;
    const closed = requests.filter(r => r.status === PurchaseRequestStatus.CLOSED).length;

    return { total, draft, rfqSent, vendorSelected, ordered, closed };
  }, [requests]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
      <Card className="p-4">
        <div className="text-sm text-steel-400">{t('widgets:outsourcePanel.stats.total')}</div>
        <div className="mt-1 text-2xl font-bold text-white">{stats.total}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">{t('widgets:outsourcePanel.stats.draft')}</div>
        <div className="mt-1 text-2xl font-bold text-steel-300">{stats.draft}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">{t('widgets:outsourcePanel.stats.rfqSent')}</div>
        <div className="mt-1 text-2xl font-bold text-blue-400">{stats.rfqSent}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">{t('widgets:outsourcePanel.stats.vendorSelected')}</div>
        <div className="mt-1 text-2xl font-bold text-orange-400">{stats.vendorSelected}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">{t('widgets:outsourcePanel.stats.ordered')}</div>
        <div className="mt-1 text-2xl font-bold text-cyan-400">{stats.ordered}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-steel-400">{t('widgets:outsourcePanel.stats.closed')}</div>
        <div className="mt-1 text-2xl font-bold text-green-400">{stats.closed}</div>
      </Card>
    </div>
  );
}

/**
 * Status badge for purchase request
 */
function PurchaseRequestStatusBadge({
  status,
  isOverdue,
  t,
}: {
  readonly status: PurchaseRequestStatus;
  readonly isOverdue: boolean;
  readonly t: (key: string) => string;
}) {
  const statusLabel = t(`entities:purchaseRequest.status.${status}`);
  const config = PurchaseRequestStatusConfig[status];

  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={config.color} dot>
        {statusLabel}
      </Badge>
      {isOverdue && (
        <span
          className="inline-flex items-center rounded-full bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400"
          title={t('widgets:outsourcePanel.overdueWarning')}
        >
          <Icon name="warning" className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}

export function OutsourcePanel({ projectId }: OutsourcePanelProps) {
  const { t } = useTranslation(['widgets', 'entities']);

  // Fetch purchase requests for this project
  const {
    data: purchaseRequestsData,
    isLoading,
    error,
  } = useQuery(
    purchaseRequestQueries.list({
      page: 0,
      size: 100,
      status: null,
      projectId,
      dtype: 'SERVICE',
    })
  );

  const purchaseRequests = purchaseRequestsData?.data ?? [];

  if (isLoading) {
    return (
      <Card>
        <LoadingState message={t('widgets:outsourcePanel.loading')} />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        {t('widgets:outsourcePanel.loadError', { message: error.message })}
      </Alert>
    );
  }

  // Empty state - no purchase requests yet
  if (purchaseRequests.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Icon name="handshake" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
        <h3 className="text-lg font-semibold text-white">{t('widgets:outsourcePanel.emptyTitle')}</h3>
        <p className="mt-2 text-steel-500">
          {t('widgets:outsourcePanel.emptyDescription')}
        </p>
        <p className="mt-1 text-sm text-steel-600">
          {t('widgets:outsourcePanel.emptyHint')}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <PurchaseRequestSummaryStats requests={purchaseRequests} t={t} />

      {/* Purchase Requests Table */}
      <Card className="overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t('widgets:outsourcePanel.table.requestNumber')}</Table.HeaderCell>
              <Table.HeaderCell>{t('widgets:outsourcePanel.table.category')}</Table.HeaderCell>
              <Table.HeaderCell>{t('widgets:outsourcePanel.table.description')}</Table.HeaderCell>
              <Table.HeaderCell>{t('widgets:outsourcePanel.table.quantity')}</Table.HeaderCell>
              <Table.HeaderCell>{t('widgets:outsourcePanel.table.requiredDate')}</Table.HeaderCell>
              <Table.HeaderCell>{t('widgets:outsourcePanel.table.status')}</Table.HeaderCell>
              <Table.HeaderCell>{t('widgets:outsourcePanel.table.requester')}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {purchaseRequests.map((request: PurchaseRequestListItem) => {
              const isOverdue = purchaseRequestRules.isOverdue(request);

              return (
                <Table.Row
                  key={request.id}
                  className="cursor-pointer transition-colors hover:bg-steel-800/50"
                >
                  <Table.Cell>
                    <span className="font-medium text-copper-400">
                      {request.requestNumber}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-steel-300">
                    {request.serviceCategoryName}
                  </Table.Cell>
                  <Table.Cell className="max-w-xs truncate text-steel-300">
                    {request.description}
                  </Table.Cell>
                  <Table.Cell className="text-steel-300">
                    {request.quantity} {request.uom}
                  </Table.Cell>
                  <Table.Cell className={isOverdue ? 'text-red-400' : 'text-steel-300'}>
                    {formatDate(request.requiredDate)}
                  </Table.Cell>
                  <Table.Cell>
                    <PurchaseRequestStatusBadge status={request.status} isOverdue={isOverdue} t={t} />
                  </Table.Cell>
                  <Table.Cell className="text-steel-300">
                    {request.createdByName}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </Card>
    </div>
  );
}
