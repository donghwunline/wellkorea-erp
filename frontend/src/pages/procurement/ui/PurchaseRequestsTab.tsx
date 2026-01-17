/**
 * Purchase Requests Tab - Displays all purchase requests.
 *
 * Shows both SERVICE (outsourcing) and MATERIAL purchase requests.
 * Provides filtering by status and type.
 * Click on row to open detail modal with RFQ management.
 */

import { useCallback, useState } from 'react';
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
} from '@/widgets/purchase-request-panel';

const PAGE_SIZE = 20;

/**
 * Status badge for purchase request.
 */
function StatusBadge({ status }: { readonly status: PurchaseRequestStatus }) {
  const config = PurchaseRequestStatusConfig[status];
  return (
    <Badge variant={config.color} dot>
      {config.labelKo}
    </Badge>
  );
}

/**
 * Type badge for purchase request.
 */
function TypeBadge({ dtype }: { readonly dtype: 'SERVICE' | 'MATERIAL' }) {
  return (
    <Badge variant={dtype === 'SERVICE' ? 'info' : 'copper'} size="sm">
      {dtype === 'SERVICE' ? '외주' : '자재'}
    </Badge>
  );
}

/**
 * Purchase requests tab content.
 */
export function PurchaseRequestsTab() {
  // Local state for filters and pagination
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<'SERVICE' | 'MATERIAL' | null>(null);

  // Modal state
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [sendRfqState, setSendRfqState] = useState<{
    isOpen: boolean;
    requestId: number | null;
    serviceCategoryId: number | null;
  }>({ isOpen: false, requestId: null, serviceCategoryId: null });

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

  // Open send RFQ modal
  const handleOpenSendRfq = useCallback((requestId: number, serviceCategoryId: number) => {
    setDetailModalOpen(false); // Close detail modal first
    setSendRfqState({ isOpen: true, requestId, serviceCategoryId });
  }, []);

  // Close send RFQ modal
  const handleCloseSendRfq = useCallback(() => {
    setSendRfqState({ isOpen: false, requestId: null, serviceCategoryId: null });
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
          <option value="">전체 상태</option>
          {Object.entries(PurchaseRequestStatusConfig).map(([status, config]) => (
            <option key={status} value={status}>
              {config.labelKo}
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
          <option value="">전체 유형</option>
          <option value="SERVICE">외주</option>
          <option value="MATERIAL">자재</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <Card variant="table" className="p-8 text-center">
          <p className="text-red-400">Failed to load purchase requests</p>
          <button onClick={() => refetch()} className="mt-4 text-sm text-copper-500 hover:underline">
            Retry
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
                  <Table.HeaderCell>요청번호</Table.HeaderCell>
                  <Table.HeaderCell>유형</Table.HeaderCell>
                  <Table.HeaderCell>프로젝트</Table.HeaderCell>
                  <Table.HeaderCell>품목</Table.HeaderCell>
                  <Table.HeaderCell>내용</Table.HeaderCell>
                  <Table.HeaderCell>수량</Table.HeaderCell>
                  <Table.HeaderCell>납기일</Table.HeaderCell>
                  <Table.HeaderCell>상태</Table.HeaderCell>
                  <Table.HeaderCell>요청자</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {requests.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={9} className="py-12 text-center text-steel-400">
                      조달 요청이 없습니다.
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
              itemLabel="requests"
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

      {/* Send RFQ Modal */}
      {sendRfqState.requestId !== null && sendRfqState.serviceCategoryId !== null && (
        <SendRfqModal
          purchaseRequestId={sendRfqState.requestId}
          serviceCategoryId={sendRfqState.serviceCategoryId}
          isOpen={sendRfqState.isOpen}
          onClose={handleCloseSendRfq}
          onSuccess={handleSendRfqSuccess}
        />
      )}
    </div>
  );
}
