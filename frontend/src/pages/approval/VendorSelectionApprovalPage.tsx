/**
 * Vendor Selection Approval Page.
 *
 * Dedicated approval page for PurchaseRequest vendor selection.
 * Displays vendor quote comparison alongside approval workflow actions.
 *
 * Route: /approvals/vendor-selection/:id
 * URL params: id (purchaseRequestId - the entity being approved)
 *
 * FSD Architecture:
 * - Page layer: URL params + layout assembly
 * - Uses entities/purchase-request for query hooks and types
 * - Uses entities/approval for approval UI
 * - Uses features/approval for mutations
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Icon, PageHeader, Spinner, Table } from '@/shared/ui';
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/formatting';
import { useAuth } from '@/entities/auth';
import {
  purchaseRequestQueries,
  purchaseRequestRules,
  PurchaseRequestStatusBadge,
  type RfqItem,
  RfqItemStatusBadge,
} from '@/entities/purchase-request';
import {
  approvalQueries,
  ApprovalRequestCard,
  approvalRules,
} from '@/entities/approval';
import { useApproveApproval } from '@/features/approval/approve';
import { RejectModal, useRejectApproval } from '@/features/approval/reject';

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

export function VendorSelectionApprovalPage() {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const purchaseRequestId = id ? parseInt(id, 10) : null;
  const { user } = useAuth();

  // State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch purchase request detail
  const {
    data: request,
    isLoading: isLoadingRequest,
    error: requestError,
    refetch: refetchRequest,
  } = useQuery({
    ...purchaseRequestQueries.detail(purchaseRequestId!),
    enabled: purchaseRequestId !== null && purchaseRequestId > 0,
  });

  // Step 1: Fetch approvals list to find the approval for this purchase request
  const approvalsQuery = useQuery({
    ...approvalQueries.list({
      entityType: 'VENDOR_SELECTION',
      status: 'PENDING',
      page: 0,
      size: 50,
    }),
    enabled: !!request && purchaseRequestRules.isPendingVendorApproval(request),
  });
  const approvalsData = approvalsQuery.data;
  const isLoadingApprovalsList = approvalsQuery.isLoading;

  // Find approval ID for this purchase request from the list
  const approvalSummary = approvalsData?.data.find(a => a.entityId === purchaseRequestId);
  const approvalId = approvalSummary?.id;

  // Step 2: Fetch full approval details (with levels) using the found ID
  const {
    data: approval,
    isLoading: isLoadingApprovalDetail,
    refetch: refetchApproval,
  } = useQuery({
    ...approvalQueries.detail(approvalId ?? 0),
    enabled: approvalId !== undefined && approvalId > 0,
  });

  // Combined loading state for approvals
  const isLoadingApprovals =
    isLoadingApprovalsList || (approvalId !== undefined && isLoadingApprovalDetail);

  // Mutation hooks
  const {
    mutate: approveApproval,
    isPending: isApproving,
    error: approveError,
  } = useApproveApproval({
    entityId: purchaseRequestId ?? undefined,
    onSuccess: () => {
      showSuccess(t('vendorSelectionApproval.messages.approved'));
      refetchRequest();
      refetchApproval();
    },
  });

  const {
    mutate: rejectApproval,
    isPending: isRejecting,
    error: rejectError,
  } = useRejectApproval({
    entityId: purchaseRequestId ?? undefined,
    onSuccess: () => {
      showSuccess(t('vendorSelectionApproval.messages.rejected'));
      setShowRejectModal(false);
      refetchRequest();
      refetchApproval();
    },
  });

  const isActing = isApproving || isRejecting;
  const isLoading = isLoadingRequest || isLoadingApprovals;

  // Collect all errors
  const error =
    requestError?.message ||
    approveError?.message ||
    rejectError?.message ||
    null;

  // Clear messages after delay
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Navigate back to approval list
  const navigateBack = useCallback(() => {
    navigate('/approvals');
  }, [navigate]);

  // Handle approve
  const handleApprove = useCallback(() => {
    if (!approval) return;
    approveApproval({ id: approval.id });
  }, [approval, approveApproval]);

  // Handle reject
  const handleReject = useCallback(
    (reason: string) => {
      if (!approval) return;
      rejectApproval({ id: approval.id, reason });
    },
    [approval, rejectApproval]
  );

  // Check if current user can approve/reject
  const canApproveOrReject = approval && user ? approvalRules.canAct(approval, user.id) : false;

  // Get the pending selected RFQ item
  const pendingRfqItem = request ? purchaseRequestRules.getPendingRfqItem(request) : null;

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card className="p-12 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-steel-400">{t('vendorSelectionApproval.loading')}</p>
        </Card>
      </div>
    );
  }

  // Render error/not found state
  if (requestError || !request) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title
            title={t('vendorSelectionApproval.title')}
            description={t('vendorSelectionApproval.notFound')}
          />
          <PageHeader.Actions>
            <button
              onClick={navigateBack}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              {t('vendorSelectionApproval.backToApprovals')}
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="error" className="mt-6">
          {requestError?.message || t('vendorSelectionApproval.notFound')}
        </Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={navigateBack}>
            {t('vendorSelectionApproval.backToApprovals')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title={`${t('vendorSelectionApproval.title')}: ${request.requestNumber}`}
          description={request.itemName}
        />
        <PageHeader.Actions>
          <button
            onClick={navigateBack}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            {t('vendorSelectionApproval.backToApprovals')}
          </button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" className="mb-6" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content - Left side */}
        <div className="space-y-6 lg:col-span-2">
          {/* Purchase Request Info Card */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-medium text-white">
              {t('vendorSelectionApproval.sections.requestInfo')}
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <InfoField label={t('vendorSelectionApproval.fields.requestNumber')}>
                <span className="font-medium text-copper-400">{request.requestNumber}</span>
              </InfoField>
              <InfoField label={t('vendorSelectionApproval.fields.item')}>
                {request.itemName}
              </InfoField>
              <InfoField label={t('vendorSelectionApproval.fields.quantity')}>
                {request.quantity} {request.uom}
              </InfoField>
              <InfoField label={t('vendorSelectionApproval.fields.requiredDate')}>
                <span
                  className={purchaseRequestRules.isOverdue(request) ? 'text-red-400' : ''}
                >
                  {formatDate(request.requiredDate)}
                </span>
              </InfoField>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <InfoField label={t('vendorSelectionApproval.fields.project')}>
                {request.jobCode || request.projectName || '-'}
              </InfoField>
              <InfoField label={t('vendorSelectionApproval.fields.status')}>
                <PurchaseRequestStatusBadge status={request.status} dot />
              </InfoField>
            </div>
          </Card>

          {/* Selected Vendor Highlight */}
          {pendingRfqItem && (
            <Card className="border-2 border-copper-500/50 bg-copper-500/10 p-6">
              <div className="flex items-center gap-3">
                <Icon name="check-circle" className="h-6 w-6 text-copper-400" />
                <h3 className="text-lg font-medium text-white">
                  {t('vendorSelectionApproval.sections.selectedVendor')}
                </h3>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <InfoField label={t('vendorSelectionApproval.table.vendor')}>
                  <span className="font-medium text-copper-400">{pendingRfqItem.vendorName}</span>
                </InfoField>
                <InfoField label={t('vendorSelectionApproval.table.quotedPrice')}>
                  {pendingRfqItem.quotedPrice
                    ? formatCurrency(pendingRfqItem.quotedPrice)
                    : '-'}
                </InfoField>
                <InfoField label={t('vendorSelectionApproval.table.leadTime')}>
                  {pendingRfqItem.quotedLeadTime
                    ? `${pendingRfqItem.quotedLeadTime}일`
                    : '-'}
                </InfoField>
                <InfoField label={t('vendorSelectionApproval.table.notes')}>
                  {pendingRfqItem.notes || '-'}
                </InfoField>
              </div>
            </Card>
          )}

          {/* Vendor Quotes Comparison Table */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">
                {t('vendorSelectionApproval.sections.vendorComparison')}
              </h3>
              <span className="text-sm text-steel-400">
                {request.rfqItems.length}개 업체
              </span>
            </div>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t('vendorSelectionApproval.table.vendor')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('vendorSelectionApproval.table.status')}</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">
                    {t('vendorSelectionApproval.table.quotedPrice')}
                  </Table.HeaderCell>
                  <Table.HeaderCell className="text-right">
                    {t('vendorSelectionApproval.table.leadTime')}
                  </Table.HeaderCell>
                  <Table.HeaderCell>{t('vendorSelectionApproval.table.notes')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {request.rfqItems.map((item: RfqItem) => {
                  const isSelected = item.itemId === request.pendingSelectedRfqItemId;
                  return (
                    <Table.Row
                      key={item.itemId}
                      className={isSelected ? 'bg-copper-500/10' : ''}
                    >
                      <Table.Cell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Icon name="check-circle" className="h-4 w-4 text-copper-400" />
                          )}
                          {item.vendorName}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <RfqItemStatusBadge status={item.status} size="sm" />
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
                  );
                })}
              </Table.Body>
            </Table>
          </Card>

          {/* Metadata */}
          <div className="text-xs text-steel-500">
            요청자: {request.createdByName} | 등록: {formatDateTime(request.createdAt)} | 수정: {formatDateTime(request.updatedAt)}
          </div>
        </div>

        {/* Sidebar - Approval Info */}
        <div className="space-y-6">
          {/* Multi-Level Approval Progress - FSD ApprovalRequestCard */}
          {approval && (
            <ApprovalRequestCard
              approval={approval}
              canAct={canApproveOrReject}
              isActing={isActing}
              onApprove={handleApprove}
              onReject={() => setShowRejectModal(true)}
            />
          )}

          {/* Loading state for approval */}
          {!approval && request && purchaseRequestRules.isPendingVendorApproval(request) && isLoadingApprovals && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-white">
                결재 상태
              </h3>
              <div className="flex items-center gap-3">
                <Spinner className="h-5 w-5" />
                <span className="text-steel-400">결재 정보 불러오는 중...</span>
              </div>
            </Card>
          )}

          {/* Fallback when approval not found */}
          {!approval && request && purchaseRequestRules.isPendingVendorApproval(request) && !isLoadingApprovals && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-white">
                결재 상태
              </h3>
              <div className="flex items-center gap-2 text-yellow-400">
                <Icon name="clock" className="h-5 w-5" />
                <span className="font-medium">결재 대기</span>
              </div>
              <p className="mt-2 text-sm text-steel-400">
                결재 프로세스가 시작되었습니다. 결재 처리를 기다려 주세요.
              </p>
            </Card>
          )}

          {/* Status when not pending vendor approval */}
          {!purchaseRequestRules.isPendingVendorApproval(request) && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-white">
                상태
              </h3>
              <PurchaseRequestStatusBadge status={request.status} dot />
            </Card>
          )}
        </div>
      </div>

      {/* Reject Modal - FSD Feature Component */}
      <RejectModal
        isOpen={showRejectModal}
        entityRef={`${request.requestNumber} - ${request.itemName}`}
        isSubmitting={isRejecting}
        error={rejectError?.message}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
      />
    </div>
  );
}
