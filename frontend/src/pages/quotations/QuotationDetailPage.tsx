/**
 * Quotation Detail Page (FSD Version).
 *
 * Displays full quotation details with approval workflow.
 * Uses FSD architecture with separated concerns.
 *
 * Routes:
 * - /quotations/:id (standalone)
 * - /projects/:projectId/quotations/:id (project context)
 *
 * Pages Layer: Route-level assembly only
 * - URL params handling
 * - Layout composition
 * - Feature delegation
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, ConfirmationModal, Icon, PageHeader, Spinner } from '@/shared/ui';
import { useAuth } from '@/entities/auth';
import { formatDate } from '@/shared/lib/formatting/date';

// FSD imports - Entities (domain models, business rules, read-only UI)
import { useQuery } from '@tanstack/react-query';
import { QuotationCard, quotationQueries, quotationRules } from '@/entities/quotation';
import { ApprovalRequestCard, approvalQueries, approvalRules } from '@/entities/approval';
// FSD imports - Features (user actions, mutations)
import { useSubmitQuotation } from '@/features/quotation/submit';
import { useCreateVersion } from '@/features/quotation/version';
import { useDownloadPdf } from '@/features/quotation/download-pdf';
import { useAcceptQuotation } from '@/features/quotation/accept';
import { useApproveApproval } from '@/features/approval/approve';
import { RejectModal, useRejectApproval } from '@/features/approval/reject';

export function QuotationDetailPage() {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const { id, projectId } = useParams<{ id: string; projectId?: string }>();
  const quotationId = id ? parseInt(id, 10) : null;
  const { user } = useAuth();

  // State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [versionConfirm, setVersionConfirm] = useState(false);
  const [acceptConfirm, setAcceptConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Query hooks
  const {
    data: quotation,
    isLoading: isLoadingQuotation,
    error: quotationError,
    refetch: refetchQuotation,
  } = useQuery({
    ...quotationQueries.detail(quotationId!),
    enabled: quotationId !== null,
  });

  // Step 1: Fetch approvals list to find the approval for this quotation
  // Note: List endpoint returns ApprovalSummaryView (without levels)
  const approvalsQuery = useQuery({
    ...approvalQueries.list({
      entityType: 'QUOTATION',
      status: 'PENDING',
      page: 0,
      size: 20,
    }),
    enabled: quotation?.status === 'PENDING',
  });
  const approvalsData = approvalsQuery.data;
  const isLoadingApprovalsList = approvalsQuery.isLoading;

  // Find approval ID for this quotation from the list
  const approvalSummary = approvalsData?.data.find(a => a.entityId === quotationId);
  const approvalId = approvalSummary?.id;

  // Step 2: Fetch full approval details (with levels) using the found ID
  // Note: Detail endpoint returns ApprovalDetailView (with levels)
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
    mutate: submitForApproval,
    isPending: isSubmitting,
    error: submitError,
  } = useSubmitQuotation({
    onSuccess: () => {
      showSuccess(t('quotationDetail.messages.submittedForApproval'));
      setSubmitConfirm(false);
      refetchQuotation();
    },
  });

  const {
    mutate: createVersion,
    isPending: isCreatingVersion,
    error: versionError,
  } = useCreateVersion({
    onSuccess: result => {
      showSuccess(t('quotationDetail.messages.newVersionCreated'));
      setVersionConfirm(false);
      // Navigate to edit the new version
      if (projectId) {
        navigate(`/projects/${projectId}/quotations/${result.id}/edit`);
      } else {
        navigate(`/quotations/${result.id}/edit`);
      }
    },
  });

  const {
    mutate: downloadPdf,
    isPending: isDownloading,
    error: downloadError,
  } = useDownloadPdf({});

  const {
    mutate: approveApproval,
    isPending: isApproving,
    error: approveError,
  } = useApproveApproval({
    entityId: quotationId ?? undefined,
    onSuccess: () => {
      showSuccess(t('quotationDetail.messages.approved'));
      refetchQuotation();
      refetchApproval();
    },
  });

  const {
    mutate: rejectApproval,
    isPending: isRejecting,
    error: rejectError,
  } = useRejectApproval({
    entityId: quotationId ?? undefined,
    onSuccess: () => {
      showSuccess(t('quotationDetail.messages.rejected'));
      setShowRejectModal(false);
      refetchQuotation();
      refetchApproval();
    },
  });

  const {
    mutate: acceptQuotation,
    isPending: isAccepting,
    error: acceptError,
  } = useAcceptQuotation({
    onSuccess: () => {
      showSuccess(t('quotationDetail.messages.acceptedByCustomer'));
      setAcceptConfirm(false);
      refetchQuotation();
    },
  });

  const isActing = isSubmitting || isCreatingVersion || isDownloading || isApproving || isRejecting || isAccepting;
  const isLoading = isLoadingQuotation || isLoadingApprovals;

  // Collect all errors
  const error =
    quotationError?.message ||
    submitError?.message ||
    versionError?.message ||
    downloadError?.message ||
    approveError?.message ||
    rejectError?.message ||
    acceptError?.message ||
    null;

  // Clear messages after delay
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Navigate back
  const navigateBack = useCallback(() => {
    if (projectId) {
      navigate(`/projects/${projectId}/quotation`);
    } else {
      navigate('/quotations');
    }
  }, [navigate, projectId]);

  // Handle edit
  const handleEdit = useCallback(() => {
    if (projectId) {
      navigate(`/projects/${projectId}/quotations/${quotationId}/edit`);
    } else {
      navigate(`/quotations/${quotationId}/edit`);
    }
  }, [navigate, projectId, quotationId]);

  // Handle submit for approval
  const handleSubmitConfirm = useCallback(() => {
    if (!quotationId) return;
    submitForApproval(quotationId);
  }, [quotationId, submitForApproval]);

  // Handle create new version
  const handleVersionConfirm = useCallback(() => {
    if (!quotationId) return;
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

  // Handle accept quotation
  const handleAcceptConfirm = useCallback(() => {
    if (!quotationId) return;
    acceptQuotation(quotationId);
  }, [quotationId, acceptQuotation]);

  // Check if current user can approve/reject
  const canApproveOrReject = approval && user ? approvalRules.canAct(approval, user.id) : false;

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card className="p-12 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-steel-400">{t('quotationDetail.loadingQuotation')}</p>
        </Card>
      </div>
    );
  }

  // Render error state
  if (quotationError || !quotation) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title={t('quotationDetail.title')} description={t('quotationDetail.unableToLoad')} />
          <PageHeader.Actions>
            <button
              onClick={navigateBack}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              {t('quotationDetail.back')}
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="error" className="mt-6">
          {quotationError?.message || t('quotationDetail.notFound')}
        </Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={navigateBack}>
            {t('quotationDetail.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = quotationRules.canEdit(quotation);
  const canSubmit = quotationRules.canSubmit(quotation);
  const canCreateVersion = quotationRules.canCreateNewVersion(quotation);
  const canDownloadPdf = quotationRules.canGeneratePdf(quotation);
  const canAccept = quotationRules.canAccept(quotation);

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title={`${t('quotationDetail.title')}: ${quotation.jobCode}`}
          description={t('quotationDetail.description', { version: quotation.version, projectName: quotation.projectName })}
        />
        <PageHeader.Actions>
          <button
            onClick={navigateBack}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            {t('quotationDetail.backToQuotations')}
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
        {/* Main Content - FSD QuotationCard */}
        <div className="lg:col-span-2">
          <QuotationCard quotation={quotation} includeTimeInDates />
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

          {/* Loading state for PENDING approvals - show while fetching */}
          {!approval && quotation.status === 'PENDING' && isLoadingApprovals && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-white">{t('quotationDetail.approvalStatus')}</h3>
              <div className="flex items-center gap-3">
                <Spinner className="h-5 w-5" />
                <span className="text-steel-400">{t('quotationDetail.loadingApproval')}</span>
              </div>
            </Card>
          )}

          {/* Fallback when approval not found for PENDING status */}
          {!approval && quotation.status === 'PENDING' && !isLoadingApprovals && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-white">{t('quotationDetail.approvalStatus')}</h3>
              <div className="flex items-center gap-2 text-yellow-400">
                <Icon name="clock" className="h-5 w-5" />
                <span className="font-medium">{t('quotationDetail.pendingApproval')}</span>
              </div>
              <p className="mt-2 text-sm text-steel-400">
                {t('quotationDetail.pendingApprovalDescription')}
              </p>
            </Card>
          )}

          {/* Approval Status for non-pending (PENDING is handled by ApprovalRequestCard above) */}
          {!approval && quotation.status !== 'DRAFT' && quotation.status !== 'PENDING' && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-white">{t('quotationDetail.approvalStatus')}</h3>

              {quotation.status === 'APPROVED' && (
                <div className="space-y-3">
                  {quotation.approvedByName && (
                    <div className="text-sm text-steel-400">
                      <span>{t('quotationDetail.approvedBy')}: </span>
                      <span className="text-white">{quotation.approvedByName}</span>
                    </div>
                  )}
                  {quotation.approvedAt && (
                    <div className="text-sm text-steel-400">
                      <span>{t('quotationDetail.approvedAt')}: </span>
                      <span className="text-white">
                        {formatDate(quotation.approvedAt, 'YYYY-MM-DD HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {quotation.status === 'REJECTED' && (
                <div className="space-y-3">
                  {quotation.rejectionReason && (
                    <Alert variant="error" title={t('quotationDetail.reason')}>
                      {quotation.rejectionReason}
                    </Alert>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-medium text-white">{t('quotationDetail.quickActions')}</h3>
            <div className="space-y-2">
              {canEdit && (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={handleEdit}
                  disabled={isActing}
                >
                  <Icon name="pencil" className="mr-2 h-4 w-4" />
                  {t('quotationDetail.editQuotation')}
                </Button>
              )}

              {canSubmit && (
                <Button
                  className="w-full justify-start"
                  onClick={() => setSubmitConfirm(true)}
                  disabled={isActing}
                >
                  <Icon name="paper-airplane" className="mr-2 h-4 w-4" />
                  {t('quotationDetail.submitForApproval')}
                </Button>
              )}

              {canAccept && (
                <Button
                  className="w-full justify-start bg-success-600 hover:bg-success-700"
                  onClick={() => setAcceptConfirm(true)}
                  disabled={isActing}
                >
                  <Icon name="check-circle" className="mr-2 h-4 w-4" />
                  {t('quotationDetail.acceptQuotation')}
                </Button>
              )}

              {canDownloadPdf && (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={handleDownloadPdf}
                  disabled={isActing}
                >
                  <Icon name="document-arrow-down" className="mr-2 h-4 w-4" />
                  {t('quotationDetail.downloadPdf')}
                </Button>
              )}

              {canCreateVersion && (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setVersionConfirm(true)}
                  disabled={isActing}
                >
                  <Icon name="document-duplicate" className="mr-2 h-4 w-4" />
                  {t('quotationDetail.createNewVersion')}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={submitConfirm}
        title={t('quotationDetail.confirmSubmit.title')}
        message={t('quotationDetail.confirmSubmit.message', { jobCode: quotation.jobCode })}
        confirmLabel={t('quotationDetail.confirmSubmit.confirm')}
        onConfirm={handleSubmitConfirm}
        onClose={() => setSubmitConfirm(false)}
      />

      {/* Create Version Confirmation Modal */}
      <ConfirmationModal
        isOpen={versionConfirm}
        title={t('quotationDetail.confirmVersion.title')}
        message={t('quotationDetail.confirmVersion.message', { jobCode: quotation.jobCode, version: quotation.version })}
        confirmLabel={t('quotationDetail.confirmVersion.confirm')}
        onConfirm={handleVersionConfirm}
        onClose={() => setVersionConfirm(false)}
      />

      {/* Accept Quotation Confirmation Modal */}
      <ConfirmationModal
        isOpen={acceptConfirm}
        title={t('quotationDetail.confirmAccept.title')}
        message={t('quotationDetail.confirmAccept.message', { jobCode: quotation.jobCode, version: quotation.version })}
        confirmLabel={t('quotationDetail.confirmAccept.confirm')}
        onConfirm={handleAcceptConfirm}
        onClose={() => setAcceptConfirm(false)}
      />

      {/* Reject Modal - FSD Feature Component */}
      <RejectModal
        isOpen={showRejectModal}
        entityRef={`${quotation.jobCode} v${quotation.version}`}
        isSubmitting={isRejecting}
        error={rejectError?.message}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
      />
    </div>
  );
}
