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
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, ConfirmationModal, Icon, PageHeader, Spinner } from '@/shared/ui';
import { useAuth } from '@/entities/auth';
import { formatDate } from '@/shared/lib/formatting/date';

// FSD imports - Entities (domain models, business rules, read-only UI)
import { useQuery } from '@tanstack/react-query';
import {
  quotationQueries,
  quotationRules,
  QuotationCard,
  QuotationStatusConfig,
} from '@/entities/quotation';
import {
  useApprovals,
  useApproval,
  approvalRules,
  ApprovalRequestCard,
} from '@/entities/approval';

// FSD imports - Features (user actions, mutations)
import { useSubmitQuotation, useCreateVersion, useDownloadPdf } from '@/features/quotation';
import { useApproveApproval, useRejectApproval, RejectModal } from '@/features/approval';

export function QuotationDetailPageV2() {
  const navigate = useNavigate();
  const { id, projectId } = useParams<{ id: string; projectId?: string }>();
  const quotationId = id ? parseInt(id, 10) : null;
  const { user } = useAuth();

  // State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [versionConfirm, setVersionConfirm] = useState(false);
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
  const approvalsQuery = useApprovals({
    entityType: 'QUOTATION',
    status: 'PENDING',
    page: 0,
    size: 20,
  }, {
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
  } = useApproval({
    id: approvalId ?? 0,
    enabled: approvalId !== undefined && approvalId > 0,
  });

  // Combined loading state for approvals
  const isLoadingApprovals = isLoadingApprovalsList || (approvalId !== undefined && isLoadingApprovalDetail);

  // Mutation hooks
  const { mutate: submitForApproval, isPending: isSubmitting, error: submitError } = useSubmitQuotation({
    onSuccess: () => {
      showSuccess('Quotation submitted for approval');
      setSubmitConfirm(false);
      refetchQuotation();
    },
  });

  const { mutate: createVersion, isPending: isCreatingVersion, error: versionError } = useCreateVersion({
    onSuccess: (result) => {
      showSuccess('New version created');
      setVersionConfirm(false);
      // Navigate to edit the new version
      if (projectId) {
        navigate(`/projects/${projectId}/quotations/${result.id}/edit`);
      } else {
        navigate(`/quotations/${result.id}/edit`);
      }
    },
  });

  const { mutate: downloadPdf, isPending: isDownloading, error: downloadError } = useDownloadPdf({});

  const { mutate: approveApproval, isPending: isApproving, error: approveError } = useApproveApproval({
    entityId: quotationId ?? undefined,
    onSuccess: () => {
      showSuccess('Quotation approved');
      refetchQuotation();
      refetchApproval();
    },
  });

  const { mutate: rejectApproval, isPending: isRejecting, error: rejectError } = useRejectApproval({
    entityId: quotationId ?? undefined,
    onSuccess: () => {
      showSuccess('Quotation rejected');
      setShowRejectModal(false);
      refetchQuotation();
      refetchApproval();
    },
  });

  const isActing = isSubmitting || isCreatingVersion || isDownloading || isApproving || isRejecting;
  const isLoading = isLoadingQuotation || isLoadingApprovals;

  // Collect all errors
  const error = quotationError?.message
    || submitError?.message
    || versionError?.message
    || downloadError?.message
    || approveError?.message
    || rejectError?.message
    || null;

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
    downloadPdf({ quotationId: quotation.id, filename: `${quotation.jobCode}_v${quotation.version}.pdf` });
  }, [quotation, downloadPdf]);

  // Handle approve
  const handleApprove = useCallback(() => {
    if (!approval) return;
    approveApproval({ id: approval.id });
  }, [approval, approveApproval]);

  // Handle reject
  const handleReject = useCallback((reason: string) => {
    if (!approval) return;
    rejectApproval({ id: approval.id, reason });
  }, [approval, rejectApproval]);

  // Check if current user can approve/reject
  const canApproveOrReject = approval && user
    ? approvalRules.canAct(approval, user.id)
    : false;

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card className="p-12 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-steel-400">Loading quotation...</p>
        </Card>
      </div>
    );
  }

  // Render error state
  if (quotationError || !quotation) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title="Quotation Details" description="Unable to load quotation" />
          <PageHeader.Actions>
            <button
              onClick={navigateBack}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              Back
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="error" className="mt-6">
          {quotationError?.message || 'Quotation not found'}
        </Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={navigateBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = quotationRules.canEdit(quotation);
  const canSubmit = quotationRules.canSubmit(quotation);
  const canCreateVersion = quotationRules.canCreateNewVersion(quotation);
  const canDownloadPdf = quotationRules.canGeneratePdf(quotation);

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title={`Quotation: ${quotation.jobCode}`}
          description={`Version ${quotation.version} - ${quotation.projectName}`}
        />
        <PageHeader.Actions>
          <button
            onClick={navigateBack}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            Back to Quotations
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
              <h3 className="mb-4 text-lg font-medium text-white">Approval Status</h3>
              <div className="flex items-center gap-3">
                <Spinner className="h-5 w-5" />
                <span className="text-steel-400">Loading approval details...</span>
              </div>
            </Card>
          )}

          {/* Fallback when approval not found for PENDING status */}
          {!approval && quotation.status === 'PENDING' && !isLoadingApprovals && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-white">Approval Status</h3>
              <div className="flex items-center gap-2 text-yellow-400">
                <Icon name="clock" className="h-5 w-5" />
                <span className="font-medium">Pending Approval</span>
              </div>
              <p className="mt-2 text-sm text-steel-400">
                Approval workflow has been initiated. Please wait for approval processing.
              </p>
            </Card>
          )}

          {/* Approval Status for non-pending (PENDING is handled by ApprovalRequestCard above) */}
          {!approval && quotation.status !== 'DRAFT' && quotation.status !== 'PENDING' && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-white">Approval Status</h3>

              {quotation.status === 'APPROVED' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <Icon name="check-circle" className="h-5 w-5" />
                    <span className="font-medium">Approved</span>
                  </div>
                  {quotation.approvedByName && (
                    <div className="text-sm text-steel-400">
                      <span>Approved by: </span>
                      <span className="text-white">{quotation.approvedByName}</span>
                    </div>
                  )}
                  {quotation.approvedAt && (
                    <div className="text-sm text-steel-400">
                      <span>Approved at: </span>
                      <span className="text-white">
                        {formatDate(quotation.approvedAt, 'YYYY-MM-DD HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {quotation.status === 'REJECTED' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <Icon name="x-circle" className="h-5 w-5" />
                    <span className="font-medium">Rejected</span>
                  </div>
                  {quotation.rejectionReason && (
                    <Alert variant="error" title="Reason">
                      {quotation.rejectionReason}
                    </Alert>
                  )}
                </div>
              )}

              {['SENT', 'ACCEPTED'].includes(quotation.status) && (
                <div className="flex items-center gap-2 text-copper-400">
                  <Icon name="check-circle" className="h-5 w-5" />
                  <span className="font-medium">{QuotationStatusConfig[quotation.status].labelKo}</span>
                </div>
              )}
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-medium text-white">Quick Actions</h3>
            <div className="space-y-2">
              {canEdit && (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={handleEdit}
                  disabled={isActing}
                >
                  <Icon name="pencil" className="mr-2 h-4 w-4" />
                  Edit Quotation
                </Button>
              )}

              {canSubmit && (
                <Button
                  className="w-full justify-start"
                  onClick={() => setSubmitConfirm(true)}
                  disabled={isActing}
                >
                  <Icon name="paper-airplane" className="mr-2 h-4 w-4" />
                  Submit for Approval
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
                  Download PDF
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
                  Create New Version
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={submitConfirm}
        title="Submit for Approval"
        message={`Are you sure you want to submit "${quotation.jobCode}" for approval? This will start the approval workflow.`}
        confirmLabel="Submit"
        onConfirm={handleSubmitConfirm}
        onClose={() => setSubmitConfirm(false)}
      />

      {/* Create Version Confirmation Modal */}
      <ConfirmationModal
        isOpen={versionConfirm}
        title="Create New Version"
        message={`Create a new version based on "${quotation.jobCode} v${quotation.version}"? The new version will be in DRAFT status.`}
        confirmLabel="Create Version"
        onConfirm={handleVersionConfirm}
        onClose={() => setVersionConfirm(false)}
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
