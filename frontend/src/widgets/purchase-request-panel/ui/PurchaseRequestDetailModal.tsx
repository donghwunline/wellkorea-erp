/**
 * Purchase Request Detail Modal.
 *
 * Displays full purchase request details including RFQ items (vendor quotes).
 * Provides action button to send RFQ for DRAFT status SERVICE requests.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  LoadingState,
  Modal,
  ModalActions,
  Button,
  Icon,
  Table,
} from '@/shared/ui';
import {
  purchaseRequestQueries,
  purchaseRequestRules,
  PurchaseRequestStatus,
  PurchaseRequestStatusConfig,
  RfqItemStatusConfig,
  type RfqItem,
} from '@/entities/purchase-request';
import { useAuth } from '@/entities/auth';
import { formatDate, formatDateTime, formatCurrency } from '@/shared/lib/formatting';

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
  onOpenSendRfq,
}: PurchaseRequestDetailModalProps) {
  const { hasAnyRole } = useAuth();

  // Fetch purchase request detail
  const {
    data: request,
    isLoading,
    error: fetchError,
  } = useQuery({
    ...purchaseRequestQueries.detail(purchaseRequestId),
    enabled: isOpen && purchaseRequestId > 0,
  });

  // Check if user can send RFQ (ADMIN, FINANCE only)
  const canSendRfq = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Check if RFQ can be sent for this request
  const canSendRfqForRequest =
    request &&
    request.status === PurchaseRequestStatus.DRAFT &&
    request.dtype === 'SERVICE' &&
    request.serviceCategoryId !== null;

  const handleOpenSendRfq = () => {
    if (request && request.serviceCategoryId && onOpenSendRfq) {
      onOpenSendRfq(request.id, request.serviceCategoryId);
    }
  };

  const modalTitle = request
    ? `구매 요청: ${request.requestNumber}`
    : '구매 요청 상세';

  return (
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
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {request.rfqItems.map((item: RfqItem) => (
                    <Table.Row key={item.id}>
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
            {canSendRfq && canSendRfqForRequest && onOpenSendRfq && (
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
  );
}
