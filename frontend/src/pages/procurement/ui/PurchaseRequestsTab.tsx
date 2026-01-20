/**
 * Purchase Requests Tab - Displays all purchase requests.
 *
 * Shows both SERVICE (outsourcing) and MATERIAL purchase requests.
 * Provides filtering by status and type.
 * Click on row to open detail modal with RFQ management.
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  type PurchaseRequestListItem,
  type PurchaseRequestStatus,
  purchaseRequestQueries,
  purchaseRequestRules,
  PurchaseRequestStatusConfig,
} from '@/entities/purchase-request';
import { Badge, Card, Pagination, Spinner, Table } from '@/shared/ui';
import { formatDate } from '@/shared/lib/formatting';
import {
  PurchaseRequestDetailModal,
  SendRfqModal,
  type SendRfqData,
} from '@/widgets/purchase-request-panel';

const PAGE_SIZE = 20;

/**
 * Status badge for purchase request.
 */
function StatusBadge({ status }: { readonly status: PurchaseRequestStatus }) {
  const { t } = useTranslation('purchasing');
  const config = PurchaseRequestStatusConfig[status];
  return (
    <Badge variant={config.color} dot>
      {t(`purchaseRequest.status.${status}`)}
    </Badge>
  );
}

/**
 * Type badge for purchase request.
 */
function TypeBadge({ dtype }: { readonly dtype: 'SERVICE' | 'MATERIAL' }) {
  const { t } = useTranslation('purchasing');
  return (
    <Badge variant={dtype === 'SERVICE' ? 'info' : 'copper'} size="sm">
      {t(`type.${dtype}`)}
    </Badge>
  );
}

/**
 * Purchase requests tab content.
 */
export function PurchaseRequestsTab() {
  const { t } = useTranslation('purchasing');

  // Local state for filters and pagination
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<'SERVICE' | 'MATERIAL' | null>(null);

  // Modal state
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [sendRfqState, setSendRfqState] = useState<{
    isOpen: boolean;
    data: SendRfqData | null;
  }>({ isOpen: false, data: null });

  // Handle filter changes with pagination reset
  const handleStatusChange = useCallback((status: PurchaseRequestStatus | null) => {
    setStatusFilter(status);
    setPage(0);
  }, []);

  const handleTypeChange = useCallback((type: 'SERVICE' | 'MATERIAL' | null) => {
    setTypeFilter(type);
    setPage(0);
  }, []);

  // Server state via Query Factory
  const {
    data: requestsData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    purchaseRequestQueries.list({
      page,
      size: PAGE_SIZE,
      status: statusFilter,
      projectId: null,
      dtype: typeFilter,
    })
  );

  const requests = requestsData?.data ?? [];
  const pagination = requestsData?.pagination;

  // Row click handler
  const handleRowClick = useCallback((request: PurchaseRequestListItem) => {
    setSelectedRequestId(request.id);
    setDetailModalOpen(true);
  }, []);

  // Open send RFQ modal (handles both SERVICE and MATERIAL types)
  const handleOpenSendRfq = useCallback((data: SendRfqData) => {
    setDetailModalOpen(false); // Close detail modal first
    setSendRfqState({ isOpen: true, data });
  }, []);

  // Close send RFQ modal
  const handleCloseSendRfq = useCallback(() => {
    setSendRfqState({ isOpen: false, data: null });
  }, []);

  // Handle successful RFQ send
  const handleSendRfqSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        {/* Status Filter */}
        <select
          value={statusFilter || ''}
          onChange={e =>
            handleStatusChange(e.target.value ? (e.target.value as PurchaseRequestStatus) : null)
          }
          className="rounded-lg border border-steel-700/50 bg-steel-800/60 px-3 py-2 text-sm text-white focus:border-copper-500 focus:outline-none"
        >
          <option value="">{t('purchaseRequest.list.allStatuses')}</option>
          {Object.entries(PurchaseRequestStatusConfig).map(([status]) => (
            <option key={status} value={status}>
              {t(`purchaseRequest.status.${status}`)}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter || ''}
          onChange={e =>
            handleTypeChange(e.target.value ? (e.target.value as 'SERVICE' | 'MATERIAL') : null)
          }
          className="rounded-lg border border-steel-700/50 bg-steel-800/60 px-3 py-2 text-sm text-white focus:border-copper-500 focus:outline-none"
        >
          <option value="">{t('purchaseRequest.list.allTypes')}</option>
          <option value="SERVICE">{t('type.SERVICE')}</option>
          <option value="MATERIAL">{t('type.MATERIAL')}</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <Card variant="table" className="p-8 text-center">
          <p className="text-red-400">{t('purchaseRequest.list.loadError')}</p>
          <button onClick={() => refetch()} className="mt-4 text-sm text-copper-500 hover:underline">
            {t('common.retry')}
          </button>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Request List */}
      {!isLoading && !error && (
        <>
          <Card className="overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t('table.headers.requestNumber')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.type')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.project')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.item')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.description')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.quantity')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.requiredDate')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.status')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.requester')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {requests.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={9} className="py-12 text-center text-steel-400">
                      {t('purchaseRequest.list.empty')}
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  requests.map((request: PurchaseRequestListItem) => {
                    const isOverdue = purchaseRequestRules.isOverdue(request);

                    return (
                      <Table.Row
                        key={request.id}
                        onClick={() => handleRowClick(request)}
                        className="cursor-pointer transition-colors hover:bg-steel-800/50"
                      >
                        <Table.Cell>
                          <span className="font-medium text-copper-400">{request.requestNumber}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <TypeBadge dtype={request.dtype} />
                        </Table.Cell>
                        <Table.Cell className="text-steel-300">{request.jobCode ?? '-'}</Table.Cell>
                        <Table.Cell className="text-steel-300">{request.itemName}</Table.Cell>
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
                          <StatusBadge status={request.status} />
                        </Table.Cell>
                        <Table.Cell className="text-steel-300">{request.createdByName}</Table.Cell>
                      </Table.Row>
                    );
                  })
                )}
              </Table.Body>
            </Table>
          </Card>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalItems={pagination.totalElements}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              isFirst={pagination.first}
              isLast={pagination.last}
              itemLabel={t('purchaseRequest.title').toLowerCase()}
            />
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedRequestId !== null && (
        <PurchaseRequestDetailModal
          purchaseRequestId={selectedRequestId}
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          onSuccess={() => refetch()}
          onOpenSendRfq={handleOpenSendRfq}
        />
      )}

      {/* Send RFQ Modal - supports both SERVICE and MATERIAL types */}
      {sendRfqState.data && sendRfqState.data.type === 'SERVICE' && (
        <SendRfqModal
          type="SERVICE"
          purchaseRequestId={sendRfqState.data.requestId}
          serviceCategoryId={sendRfqState.data.serviceCategoryId}
          isOpen={sendRfqState.isOpen}
          onClose={handleCloseSendRfq}
          onSuccess={handleSendRfqSuccess}
        />
      )}
      {sendRfqState.data && sendRfqState.data.type === 'MATERIAL' && (
        <SendRfqModal
          type="MATERIAL"
          purchaseRequestId={sendRfqState.data.requestId}
          materialId={sendRfqState.data.materialId}
          isOpen={sendRfqState.isOpen}
          onClose={handleCloseSendRfq}
          onSuccess={handleSendRfqSuccess}
        />
      )}
    </div>
  );
}
