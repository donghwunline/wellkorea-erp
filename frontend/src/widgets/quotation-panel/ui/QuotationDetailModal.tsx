/**
 * Quotation Detail Modal
 *
 * Modal for viewing quotation details with approval workflow.
 * Preserves user context by staying on the project page.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  ConfirmationModal,
  Icon,
  LoadingState,
  Modal,
  ModalActions,
  Spinner,
} from '@/shared/ui';
import { useAuth } from '@/entities/auth';
import { formatDate } from '@/shared/lib/formatting/date';
import { QuotationCard, quotationQueries, quotationRules } from '@/entities/quotation';
import { ApprovalRequestCard, approvalQueries, approvalRules } from '@/entities/approval';
import { useSubmitQuotation } from '@/features/quotation/submit';
import { useCreateVersion } from '@/features/quotation/version';
import { useDownloadPdf } from '@/features/quotation/download-pdf';
import { useApproveApproval } from '@/features/approval/approve';
import { RejectModal, useRejectApproval } from '@/features/approval/reject';

export interface QuotationDetailModalProps {
  /** Quotation ID to display */
  readonly quotationId: number;
  /** Whether modal is open */
  readonly isOpen: boolean;
  /** Callback when modal should close */
  readonly onClose: () => void;
  /** Optional callback after successful action (submit, approve, reject, etc.) */
  readonly onSuccess?: () => void;
  /** Optional callback to open edit modal */
  readonly onEdit?: (quotationId: number) => void;
}

export function QuotationDetailModal({
  quotationId,
  isOpen,
  onClose,
  onSuccess,
  onEdit,
}: QuotationDetailModalProps) {
  const { t } = useTranslation('widgets');
  const { user } = useAuth();

  // Success message state with auto-dismiss
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal states
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [versionConfirm, setVersionConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const showSuccess = useCallback((message: string) => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    setSuccessMessage(message);
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
      successTimeoutRef.current = null;
    }, 3000);
  }, []);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch quotation details
  const {
    data: quotation,
    isLoading: isLoadingQuotation,
    error: quotationError,
    refetch: refetchQuotation,
  } = useQuery({
    ...quotationQueries.detail(quotationId),
    enabled: isOpen && quotationId > 0,
  });

  // Step 1: Fetch approvals list to find the approval for this quotation
  const approvalsQuery = useQuery({
    ...approvalQueries.list({
      entityType: 'QUOTATION',
      status: 'PENDING',
      page: 0,
      size: 20,
    }),
    enabled: isOpen && quotation?.status === 'PENDING',
  });
  const approvalsData = approvalsQuery.data;
  const isLoadingApprovalsList = approvalsQuery.isLoading;

  // Find approval ID for this quotation from the list
  const approvalSummary = approvalsData?.data.find(a => a.entityId === quotationId);
  const approvalId = approvalSummary?.id;

  // Step 2: Fetch full approval details (with levels) using the found ID
  const {
    data: approval,
    isLoading: isLoadingApprovalDetail,
    refetch: refetchApproval,
  } = useQuery({
    ...approvalQueries.detail(approvalId ?? 0),
    enabled: isOpen && approvalId !== undefined && approvalId > 0,
  });

  // Combined loading state for approvals
  const isLoadingApprovals =
    isLoadingApprovalsList || (approvalId !== undefined && isLoadingApprovalDetail);

  // Mutation hooks
  const { mutate: submitForApproval, isPending: isSubmitting } = useSubmitQuotation({
    onSuccess: () => {
      showSuccess(t('quotationDetailModal.successMessages.submitted'));
      setSubmitConfirm(false);
      refetchQuotation();
      onSuccess?.();
    },
    onError: (err) => setError(err.message),
  });

  const { mutate: createVersion, isPending: isCreatingVersion } = useCreateVersion({
    onSuccess: (result) => {
      showSuccess(t('quotationDetailModal.successMessages.versionCreated'));
      setVersionConfirm(false);
      onSuccess?.();
      // Open edit modal for the new version
      onEdit?.(result.id);
    },
    onError: (err) => setError(err.message),
  });

  const { mutate: downloadPdf, isPending: isDownloading } = useDownloadPdf({
    onError: (err) => setError(err.message),
  });

  const { mutate: approveApproval, isPending: isApproving } = useApproveApproval({
    entityId: quotationId,
    onSuccess: () => {
      showSuccess(t('quotationDetailModal.successMessages.approved'));
      refetchQuotation();
      refetchApproval();
      onSuccess?.();
    },
    onError: (err) => setError(err.message),
  });

  const { mutate: rejectApproval, isPending: isRejecting } = useRejectApproval({
    entityId: quotationId,
    onSuccess: () => {
      showSuccess(t('quotationDetailModal.successMessages.rejected'));
      setShowRejectModal(false);
      refetchQuotation();
      refetchApproval();
      onSuccess?.();
    },
    onError: (err) => setError(err.message),
  });

  const isActing = isSubmitting || isCreatingVersion || isDownloading || isApproving || isRejecting;

  // Handle edit
  const handleEdit = useCallback(() => {
    if (quotationId && onEdit) {
      onEdit(quotationId);
    }
  }, [quotationId, onEdit]);

  // Handle submit for approval
  const handleSubmitConfirm = useCallback(() => {
    submitForApproval(quotationId);
  }, [quotationId, submitForApproval]);

  // Handle create new version
  const handleVersionConfirm = useCallback(() => {
    createVersion(quotationId);
  }, [quotationId, createVersion]);

  // Handle download PDF
  const handleDownloadPdf = useCallback(() => {
    if (!quotation) return;
    downloadPdf({
      quotationId: quotation.id,
      filename: `${quotation.jobCode}_v${quotation.version}.pdf`,
    });
  }, [quotation, downloadPdf]);

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

  // Loading state
  if (isLoadingQuotation) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('quotationDetailModal.title')} size="lg">
        <LoadingState message={t('quotationDetailModal.loading')} />
      </Modal>
    );
  }

  // Error state
  if (quotationError || !quotation) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('quotationDetailModal.title')} size="lg">
        <Alert variant="error">
          {quotationError?.message || t('quotationDetailModal.notFound')}
        </Alert>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            {t('quotationDetailModal.close')}
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  const canEdit = quotationRules.canEdit(quotation);
  const canSubmit = quotationRules.canSubmit(quotation);
  const canCreateVersionAction = quotationRules.canCreateNewVersion(quotation);
  const canDownloadPdfAction = quotationRules.canGeneratePdf(quotation);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('quotationDetailModal.titleWithVersion', { jobCode: quotation.jobCode, version: quotation.version })}
        size="lg"
      >
        {/* Success Message */}
        {successMessage && (
          <Alert variant="success" className="mb-4" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <QuotationCard quotation={quotation} includeTimeInDates />
          </div>

          {/* Sidebar - Approval Info */}
          <div className="space-y-6">
            {/* Multi-Level Approval Progress */}
            {approval && (
              <ApprovalRequestCard
                approval={approval}
                canAct={canApproveOrReject}
                isActing={isActing}
                onApprove={handleApprove}
                onReject={() => setShowRejectModal(true)}
              />
            )}

            {/* Loading state for PENDING approvals */}
            {!approval && quotation.status === 'PENDING' && isLoadingApprovals && (
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-medium text-white">{t('quotationDetailModal.approval.title')}</h3>
                <div className="flex items-center gap-3">
                  <Spinner className="h-5 w-5" />
                  <span className="text-steel-400">{t('quotationDetailModal.approval.loading')}</span>
                </div>
              </Card>
            )}

            {/* Fallback when approval not found for PENDING status */}
            {!approval && quotation.status === 'PENDING' && !isLoadingApprovals && (
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-medium text-white">{t('quotationDetailModal.approval.title')}</h3>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Icon name="clock" className="h-5 w-5" />
                  <span className="font-medium">{t('quotationDetailModal.approval.pending')}</span>
                </div>
                <p className="mt-2 text-sm text-steel-400">
                  {t('quotationDetailModal.approval.pendingDescription')}
                </p>
              </Card>
            )}

            {/* Approval Status for non-pending */}
            {!approval && quotation.status !== 'DRAFT' && quotation.status !== 'PENDING' && (
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-medium text-white">{t('quotationDetailModal.approval.title')}</h3>

                {quotation.status === 'APPROVED' && (
                  <div className="space-y-3">
                    {quotation.approvedByName && (
                      <div className="text-sm text-steel-400">
                        {t('quotationDetailModal.approval.approvedBy', { name: quotation.approvedByName })}
                      </div>
                    )}
                    {quotation.approvedAt && (
                      <div className="text-sm text-steel-400">
                        {t('quotationDetailModal.approval.approvedAt', { date: formatDate(quotation.approvedAt, 'YYYY-MM-DD HH:mm') })}
                      </div>
                    )}
                  </div>
                )}

                {quotation.status === 'REJECTED' && (
                  <div className="space-y-3">
                    {quotation.rejectionReason && (
                      <Alert variant="error" title={t('quotationDetailModal.approval.reason')}>
                        {quotation.rejectionReason}
                      </Alert>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-white">{t('quotationDetailModal.actions.title')}</h3>
              <div className="space-y-2">
                {canEdit && onEdit && (
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={handleEdit}
                    disabled={isActing}
                  >
                    <Icon name="pencil" className="mr-2 h-4 w-4" />
                    {t('quotationDetailModal.actions.edit')}
                  </Button>
                )}

                {canSubmit && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => setSubmitConfirm(true)}
                    disabled={isActing}
                  >
                    <Icon name="paper-airplane" className="mr-2 h-4 w-4" />
                    {t('quotationDetailModal.actions.submit')}
                  </Button>
                )}

                {canDownloadPdfAction && (
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={handleDownloadPdf}
                    disabled={isActing}
                  >
                    <Icon name="document-arrow-down" className="mr-2 h-4 w-4" />
                    {t('quotationDetailModal.actions.downloadPdf')}
                  </Button>
                )}

                {canCreateVersionAction && (
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => setVersionConfirm(true)}
                    disabled={isActing}
                  >
                    <Icon name="document-duplicate" className="mr-2 h-4 w-4" />
                    {t('quotationDetailModal.actions.createVersion')}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            {t('quotationDetailModal.close')}
          </Button>
        </ModalActions>
      </Modal>

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={submitConfirm}
        title={t('quotationDetailModal.confirmSubmitModal.title')}
        message={t('quotationDetailModal.confirmSubmitModal.message', { jobCode: quotation.jobCode })}
        confirmLabel={t('quotationDetailModal.confirmSubmitModal.confirm')}
        onConfirm={handleSubmitConfirm}
        onClose={() => setSubmitConfirm(false)}
      />

      {/* Create Version Confirmation Modal */}
      <ConfirmationModal
        isOpen={versionConfirm}
        title={t('quotationDetailModal.confirmVersion.title')}
        message={t('quotationDetailModal.confirmVersion.message', { jobCode: quotation.jobCode, version: quotation.version })}
        confirmLabel={t('quotationDetailModal.confirmVersion.confirm')}
        onConfirm={handleVersionConfirm}
        onClose={() => setVersionConfirm(false)}
      />

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        entityRef={`${quotation.jobCode} v${quotation.version}`}
        isSubmitting={isRejecting}
        error={null}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
      />
    </>
  );
}
