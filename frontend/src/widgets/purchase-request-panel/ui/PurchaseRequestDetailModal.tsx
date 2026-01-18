/**
 * Purchase Request Detail Modal.
 *
 * Displays full purchase request details including RFQ items (vendor quotes).
 * Provides actions for RFQ management:
 * - Send RFQ (DRAFT status SERVICE requests)
 * - Record Reply (SENT status RFQ items)
 * - Mark No Response (SENT status RFQ items)
 * - Select Vendor (REPLIED status RFQ items)
 * - Reject Quote (REPLIED status RFQ items)
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  LoadingState,
  Modal,
  ModalActions,
  Button,
  Icon,
  Table,
  ConfirmationModal,
} from '@/shared/ui';
import {
  purchaseRequestQueries,
  purchaseRequestRules,
  PurchaseRequestStatus,
  PurchaseRequestStatusConfig,
  RfqItemStatus,
  RfqItemStatusConfig,
  type RfqItem,
} from '@/entities/purchase-request';
import { useAuth } from '@/entities/auth';
import { formatDate, formatDateTime, formatCurrency } from '@/shared/lib/formatting';
import { useMarkNoResponse, useSelectVendor, useRejectRfq } from '@/features/rfq/manage';
import { RecordReplyModal } from '@/features/rfq/record-reply';

export interface PurchaseRequestDetailModalProps {
  /** ID of the purchase request to display */
  readonly purchaseRequestId: number;
  /** Whether the modal is open */
  readonly isOpen: boolean;
  /** Callback when modal should close */
  readonly onClose: () => void;
  /** Optional callback after successful action (e.g., for refetching parent data) */
  readonly onSuccess?: () => void;
  /** Callback to open send RFQ modal (SERVICE type only) */
  readonly onOpenSendRfq?: (requestId: number, serviceCategoryId: number) => void;
}

/**
 * Type badge component.
 */
function TypeBadge({ dtype }: { readonly dtype: 'SERVICE' | 'MATERIAL' }) {
  return (
    <Badge variant={dtype === 'SERVICE' ? 'info' : 'copper'} size="sm">
      {dtype === 'SERVICE' ? '외주' : '자재'}
    </Badge>
  );
}

/**
 * Status badge component.
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
 * RFQ item status badge.
 */
function RfqItemStatusBadge({ status }: { readonly status: RfqItem['status'] }) {
  const config = RfqItemStatusConfig[status];
  return (
    <Badge variant={config.color} size="sm">
      {config.labelKo}
    </Badge>
  );
}

/**
 * Info field display component.
 */
function InfoField({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm text-steel-400">{label}</div>
      <div className="mt-1 text-white">{children}</div>
    </div>
  );
}

export function PurchaseRequestDetailModal({
  purchaseRequestId,
  isOpen,
  onClose,
  onSuccess,
  onOpenSendRfq,
}: PurchaseRequestDetailModalProps) {
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();

  // Modal states for RFQ actions
  const [recordReplyItem, setRecordReplyItem] = useState<RfqItem | null>(null);
  const [selectVendorItem, setSelectVendorItem] = useState<RfqItem | null>(null);
  const [showPoPrompt, setShowPoPrompt] = useState(false);
  const [selectedVendorForPo, setSelectedVendorForPo] = useState<RfqItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch purchase request detail
  const {
    data: request,
    isLoading,
    error: fetchError,
  } = useQuery({
    ...purchaseRequestQueries.detail(purchaseRequestId),
    enabled: isOpen && purchaseRequestId > 0,
  });

  // Check if user can manage RFQ (ADMIN, FINANCE only)
  const canManageRfq = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Check if RFQ can be sent for this request
  const canSendRfqForRequest =
    request &&
    request.status === PurchaseRequestStatus.DRAFT &&
    request.dtype === 'SERVICE' &&
    request.serviceCategoryId !== null;

  // Check if RFQ status allows management
  const canManageRfqItems = request && request.status === PurchaseRequestStatus.RFQ_SENT;

  // Mutation hooks
  const { mutate: markNoResponse, isPending: isMarkingNoResponse } = useMarkNoResponse({
    onSuccess: () => {
      setActionError(null);
      onSuccess?.();
    },
    onError: (error) => setActionError(error.message),
  });

  const { mutate: selectVendor, isPending: isSelecting } = useSelectVendor({
    onSuccess: () => {
      setActionError(null);
      setSelectVendorItem(null);
      // Show PO prompt - vendor was stored in handleConfirmSelectVendor before mutation
      setShowPoPrompt(true);
      onSuccess?.();
    },
    onError: (error) => {
      // Clear stored vendor on error since selection failed
      setSelectedVendorForPo(null);
      setActionError(error.message);
    },
  });

  const { mutate: rejectRfq, isPending: isRejecting } = useRejectRfq({
    onSuccess: () => {
      setActionError(null);
      onSuccess?.();
    },
    onError: (error) => setActionError(error.message),
  });

  const isActing = isMarkingNoResponse || isSelecting || isRejecting;

  // Handlers
  const handleOpenSendRfq = useCallback(() => {
    if (request && request.serviceCategoryId && onOpenSendRfq) {
      onOpenSendRfq(request.id, request.serviceCategoryId);
    }
  }, [request, onOpenSendRfq]);

  const handleRecordReply = useCallback((item: RfqItem) => {
    setActionError(null);
    setRecordReplyItem(item);
  }, []);

  const handleMarkNoResponse = useCallback((item: RfqItem) => {
    setActionError(null);
    markNoResponse({ purchaseRequestId, itemId: item.itemId });
  }, [purchaseRequestId, markNoResponse]);

  const handleSelectVendor = useCallback((item: RfqItem) => {
    setActionError(null);
    setSelectVendorItem(item);
  }, []);

  const handleConfirmSelectVendor = useCallback(() => {
    if (selectVendorItem) {
      // Store vendor BEFORE mutation so onSuccess has access (avoids stale closure)
      setSelectedVendorForPo(selectVendorItem);
      selectVendor({ purchaseRequestId, itemId: selectVendorItem.itemId });
    }
  }, [purchaseRequestId, selectVendorItem, selectVendor]);

  const handleRejectRfq = useCallback((item: RfqItem) => {
    setActionError(null);
    rejectRfq({ purchaseRequestId, itemId: item.itemId });
  }, [purchaseRequestId, rejectRfq]);

  const handleRecordReplySuccess = useCallback(() => {
    setRecordReplyItem(null);
    onSuccess?.();
  }, [onSuccess]);

  const handleCreatePo = useCallback(() => {
    if (selectedVendorForPo) {
      setShowPoPrompt(false);
      // Navigate to PO creation with pre-filled data
      navigate(`/procurement/purchase-orders/create?requestId=${purchaseRequestId}&rfqItemId=${selectedVendorForPo.itemId}`);
    }
  }, [selectedVendorForPo, purchaseRequestId, navigate]);

  const handleSkipCreatePo = useCallback(() => {
    setShowPoPrompt(false);
    setSelectedVendorForPo(null);
  }, []);

  const modalTitle = request
    ? `구매 요청: ${request.requestNumber}`
    : '구매 요청 상세';

  /**
   * Render action buttons for RFQ item based on status.
   */
  const renderRfqItemActions = (item: RfqItem) => {
    if (!canManageRfq || !canManageRfqItems) {
      return <span className="text-steel-500">-</span>;
    }

    // SENT status: Record Reply, Mark No Response
    if (item.status === RfqItemStatus.SENT) {
      return (
        <div className="flex gap-1">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleRecordReply(item)}
            disabled={isActing}
          >
            <Icon name="pencil" className="mr-1 h-3 w-3" />
            견적 입력
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleMarkNoResponse(item)}
            disabled={isActing}
          >
            무응답
          </Button>
        </div>
      );
    }

    // REPLIED status: Select, Reject
    if (item.status === RfqItemStatus.REPLIED) {
      return (
        <div className="flex gap-1">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSelectVendor(item)}
            disabled={isActing}
          >
            <Icon name="check" className="mr-1 h-3 w-3" />
            선정
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRejectRfq(item)}
            disabled={isActing}
          >
            미선정
          </Button>
        </div>
      );
    }

    // Terminal states: show status indicator
    if (item.status === RfqItemStatus.SELECTED) {
      return <Badge variant="success" size="sm">선정완료</Badge>;
    }

    return <span className="text-steel-500">-</span>;
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
        {/* Loading State */}
        {isLoading && (
          <div className="py-12">
            <LoadingState message="Loading purchase request details..." />
          </div>
        )}

        {/* Fetch Error */}
        {fetchError && !isLoading && (
          <Alert variant="error">
            Failed to load purchase request: {fetchError.message}
          </Alert>
        )}

        {/* Content */}
        {request && !isLoading && (
          <div className="space-y-6">
            {/* Action Error */}
            {actionError && (
              <Alert variant="error" onClose={() => setActionError(null)}>
                {actionError}
              </Alert>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <InfoField label="요청번호">
                <span className="font-medium text-copper-400">{request.requestNumber}</span>
              </InfoField>
              <InfoField label="유형">
                <TypeBadge dtype={request.dtype} />
              </InfoField>
              <InfoField label="상태">
                <StatusBadge status={request.status} />
              </InfoField>
              <InfoField label="프로젝트">
                {request.jobCode || request.projectName || '-'}
              </InfoField>
            </div>

            {/* Item Info */}
            <div className="border-t border-steel-700 pt-4">
              <h3 className="mb-3 text-base font-semibold text-white">요청 품목</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <InfoField label="품목명">{request.itemName}</InfoField>
                <InfoField label="수량">
                  {request.quantity} {request.uom}
                </InfoField>
                <InfoField label="납기일">
                  <span
                    className={
                      purchaseRequestRules.isOverdue(request) ? 'text-red-400' : ''
                    }
                  >
                    {formatDate(request.requiredDate)}
                  </span>
                </InfoField>
                {request.dtype === 'MATERIAL' && request.materialSku && (
                  <InfoField label="SKU">
                    <span className="font-mono text-sm">{request.materialSku}</span>
                  </InfoField>
                )}
                {request.dtype === 'MATERIAL' && request.materialStandardPrice && (
                  <InfoField label="기준가">
                    {formatCurrency(request.materialStandardPrice)}
                  </InfoField>
                )}
              </div>
            </div>

            {/* Description */}
            {request.description && (
              <div className="border-t border-steel-700 pt-4">
                <h3 className="mb-2 text-base font-semibold text-white">요청 내용</h3>
                <p className="text-steel-300">{request.description}</p>
              </div>
            )}

            {/* RFQ Items Table */}
            {request.rfqItems.length > 0 && (
              <div className="border-t border-steel-700 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">견적 요청 현황</h3>
                  <span className="text-sm text-steel-400">
                    {request.rfqItems.length}개 업체
                  </span>
                </div>
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>업체</Table.HeaderCell>
                      <Table.HeaderCell>상태</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">견적가</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">납기</Table.HeaderCell>
                      <Table.HeaderCell>비고</Table.HeaderCell>
                      {canManageRfq && canManageRfqItems && (
                        <Table.HeaderCell>작업</Table.HeaderCell>
                      )}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {request.rfqItems.map((item: RfqItem) => (
                      <Table.Row key={item.itemId}>
                        <Table.Cell className="font-medium text-white">
                          {item.vendorName}
                        </Table.Cell>
                        <Table.Cell>
                          <RfqItemStatusBadge status={item.status} />
                        </Table.Cell>
                        <Table.Cell className="text-right font-medium text-copper-400">
                          {item.quotedPrice ? formatCurrency(item.quotedPrice) : '-'}
                        </Table.Cell>
                        <Table.Cell className="text-right text-steel-300">
                          {item.quotedLeadTime ? `${item.quotedLeadTime}일` : '-'}
                        </Table.Cell>
                        <Table.Cell className="max-w-xs truncate text-steel-400">
                          {item.notes ?? '-'}
                        </Table.Cell>
                        {canManageRfq && canManageRfqItems && (
                          <Table.Cell>
                            {renderRfqItemActions(item)}
                          </Table.Cell>
                        )}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-steel-700 pt-4 text-xs text-steel-500">
              요청자: {request.createdByName} | 생성일: {formatDateTime(request.createdAt)} |
              수정일: {formatDateTime(request.updatedAt)}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        {request && !isLoading && (
          <ModalActions align="between">
            <Button variant="ghost" onClick={onClose}>
              닫기
            </Button>
            <div className="flex items-center gap-2">
              {canManageRfq && canSendRfqForRequest && onOpenSendRfq && (
                <Button variant="primary" onClick={handleOpenSendRfq}>
                  <Icon name="paper-airplane" className="mr-2 h-4 w-4" />
                  RFQ 발송
                </Button>
              )}
              {request.dtype === 'MATERIAL' && request.status === PurchaseRequestStatus.DRAFT && (
                <span className="text-sm text-steel-500">
                  자재 RFQ 기능은 개발 예정입니다
                </span>
              )}
            </div>
          </ModalActions>
        )}
      </Modal>

      {/* Record Reply Modal - key resets form state when item changes */}
      {recordReplyItem && (
        <RecordReplyModal
          key={recordReplyItem.itemId}
          isOpen={Boolean(recordReplyItem)}
          purchaseRequestId={purchaseRequestId}
          rfqItem={recordReplyItem}
          onClose={() => setRecordReplyItem(null)}
          onSuccess={handleRecordReplySuccess}
        />
      )}

      {/* Select Vendor Confirmation Modal */}
      {selectVendorItem && (
        <ConfirmationModal
          isOpen={Boolean(selectVendorItem)}
          onClose={() => setSelectVendorItem(null)}
          onConfirm={handleConfirmSelectVendor}
          title="업체 선정"
          message={`${selectVendorItem.vendorName}을(를) 선정하시겠습니까? 다른 응답 업체는 자동으로 미선정 처리됩니다.`}
          variant="warning"
          confirmLabel="선정"
          cancelLabel="취소"
        />
      )}

      {/* Create PO Prompt */}
      {showPoPrompt && selectedVendorForPo && (
        <ConfirmationModal
          isOpen={showPoPrompt}
          onClose={handleSkipCreatePo}
          onConfirm={handleCreatePo}
          title="발주서 생성"
          message={`${selectedVendorForPo.vendorName}가 선정되었습니다. 지금 발주서를 생성하시겠습니까?`}
          variant="warning"
          confirmLabel="발주서 생성"
          cancelLabel="나중에"
        />
      )}
    </>
  );
}
