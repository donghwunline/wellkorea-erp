/**
 * RFQ Tab - Displays purchase requests in RFQ stage.
 *
 * Shows requests that have been sent for quotes or are awaiting vendor selection.
 * RFQ (Request for Quotation) stage includes RFQ_SENT and VENDOR_SELECTED statuses.
 * Click on row to open detail modal to view vendor quotes.
 */

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  type PurchaseRequestListItem,
  purchaseRequestQueries,
  purchaseRequestRules,
  PurchaseRequestStatus,
  PurchaseRequestStatusConfig,
} from '@/entities/purchase-request';
import { Badge, Card, Icon, Pagination, Spinner, Table } from '@/shared/ui';
import { formatDate } from '@/shared/lib/formatting';
import {
  PurchaseRequestDetailModal,
  SendRfqModal,
  type SendRfqData,
} from '@/widgets/purchase-request-panel';

const PAGE_SIZE = 20;

/**
 * Status badge for RFQ-stage requests.
 */
function RfqStatusBadge({ status }: { readonly status: PurchaseRequestStatus }) {
  const config = PurchaseRequestStatusConfig[status];
  return (
    <Badge variant={config.color} dot>
      {config.labelKo}
    </Badge>
  );
}

/**
 * RFQ tab content.
 */
export function RfqTab() {
  const [page, setPage] = useState(0);

  // Modal state
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [sendRfqState, setSendRfqState] = useState<{
    isOpen: boolean;
    data: SendRfqData | null;
  }>({ isOpen: false, data: null });

  // Fetch RFQ_SENT requests (primary RFQ stage)
  const {
    data: rfqSentData,
    isLoading: rfqSentLoading,
    error: rfqSentError,
    refetch: refetchRfqSent,
  } = useQuery(
    purchaseRequestQueries.list({
      page,
      size: PAGE_SIZE,
      status: PurchaseRequestStatus.RFQ_SENT,
      projectId: null,
      dtype: null,
    })
  );

  // Also fetch VENDOR_SELECTED for pending PO creation
  const {
    data: vendorSelectedData,
    isLoading: vendorSelectedLoading,
    refetch: refetchVendorSelected,
  } = useQuery(
    purchaseRequestQueries.list({
      page: 0,
      size: 100,
      status: PurchaseRequestStatus.VENDOR_SELECTED,
      projectId: null,
      dtype: null,
    })
  );

  const rfqSentRequests = rfqSentData?.data ?? [];
  const vendorSelectedRequests = vendorSelectedData?.data ?? [];
  const pagination = rfqSentData?.pagination;
  const isLoading = rfqSentLoading || vendorSelectedLoading;

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

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchRfqSent();
    refetchVendorSelected();
  }, [refetchRfqSent, refetchVendorSelected]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm text-steel-400">RFQ 발송 완료</div>
          <div className="mt-1 text-2xl font-bold text-blue-400">
            {rfqSentData?.pagination?.totalElements ?? 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-steel-400">업체 선정 완료</div>
          <div className="mt-1 text-2xl font-bold text-orange-400">
            {vendorSelectedData?.pagination?.totalElements ?? 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-steel-400">PO 생성 대기</div>
          <div className="mt-1 text-2xl font-bold text-copper-400">{vendorSelectedRequests.length}</div>
        </Card>
      </div>

      {/* Error */}
      {rfqSentError && (
        <Card variant="table" className="p-8 text-center">
          <p className="text-red-400">Failed to load RFQ requests</p>
          <button onClick={() => refetchRfqSent()} className="mt-4 text-sm text-copper-500 hover:underline">
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

      {/* RFQ Sent Section */}
      {!isLoading && !rfqSentError && (
        <>
          <div className="flex items-center gap-2">
            <Icon name="paper-airplane" className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">RFQ 발송 완료</h3>
            <span className="text-sm text-steel-400">
              ({rfqSentData?.pagination?.totalElements ?? 0}건)
            </span>
          </div>

          <Card className="overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>요청번호</Table.HeaderCell>
                  <Table.HeaderCell>유형</Table.HeaderCell>
                  <Table.HeaderCell>프로젝트</Table.HeaderCell>
                  <Table.HeaderCell>품목</Table.HeaderCell>
                  <Table.HeaderCell>수량</Table.HeaderCell>
                  <Table.HeaderCell>납기일</Table.HeaderCell>
                  <Table.HeaderCell>상태</Table.HeaderCell>
                  <Table.HeaderCell>요청자</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rfqSentRequests.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={8} className="py-12 text-center text-steel-400">
                      RFQ 발송된 요청이 없습니다.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  rfqSentRequests.map((request: PurchaseRequestListItem) => {
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
                          <Badge variant={request.dtype === 'SERVICE' ? 'info' : 'copper'} size="sm">
                            {request.dtype === 'SERVICE' ? '외주' : '자재'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell className="text-steel-300">{request.jobCode ?? '-'}</Table.Cell>
                        <Table.Cell className="text-steel-300">{request.itemName}</Table.Cell>
                        <Table.Cell className="text-steel-300">
                          {request.quantity} {request.uom}
                        </Table.Cell>
                        <Table.Cell className={isOverdue ? 'text-red-400' : 'text-steel-300'}>
                          {formatDate(request.requiredDate)}
                        </Table.Cell>
                        <Table.Cell>
                          <RfqStatusBadge status={request.status} />
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

      {/* Vendor Selected Section (needs PO creation) */}
      {!isLoading && vendorSelectedRequests.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <Icon name="check-circle" className="h-5 w-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">업체 선정 완료 - PO 생성 대기</h3>
            <span className="text-sm text-steel-400">({vendorSelectedRequests.length}건)</span>
          </div>

          <Card className="overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>요청번호</Table.HeaderCell>
                  <Table.HeaderCell>유형</Table.HeaderCell>
                  <Table.HeaderCell>프로젝트</Table.HeaderCell>
                  <Table.HeaderCell>품목</Table.HeaderCell>
                  <Table.HeaderCell>수량</Table.HeaderCell>
                  <Table.HeaderCell>납기일</Table.HeaderCell>
                  <Table.HeaderCell>상태</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {vendorSelectedRequests.map((request: PurchaseRequestListItem) => {
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
                        <Badge variant={request.dtype === 'SERVICE' ? 'info' : 'copper'} size="sm">
                          {request.dtype === 'SERVICE' ? '외주' : '자재'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="text-steel-300">{request.jobCode ?? '-'}</Table.Cell>
                      <Table.Cell className="text-steel-300">{request.itemName}</Table.Cell>
                      <Table.Cell className="text-steel-300">
                        {request.quantity} {request.uom}
                      </Table.Cell>
                      <Table.Cell className={isOverdue ? 'text-red-400' : 'text-steel-300'}>
                        {formatDate(request.requiredDate)}
                      </Table.Cell>
                      <Table.Cell>
                        <RfqStatusBadge status={request.status} />
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </Card>
        </>
      )}

      {/* Detail Modal */}
      {selectedRequestId !== null && (
        <PurchaseRequestDetailModal
          purchaseRequestId={selectedRequestId}
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          onSuccess={refetchAll}
          onOpenSendRfq={handleOpenSendRfq}
        />
      )}

      {/* Send RFQ Modal - supports both SERVICE and MATERIAL types */}
      {sendRfqState.data && (
        <SendRfqModal
          type={sendRfqState.data.type}
          purchaseRequestId={sendRfqState.data.requestId}
          {...(sendRfqState.data.type === 'SERVICE'
            ? { serviceCategoryId: sendRfqState.data.serviceCategoryId }
            : { materialId: sendRfqState.data.materialId })}
          isOpen={sendRfqState.isOpen}
          onClose={handleCloseSendRfq}
          onSuccess={refetchAll}
        />
      )}
    </div>
  );
}
