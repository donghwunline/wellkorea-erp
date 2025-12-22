/**
 * Quotation Detail Page
 *
 * Displays full quotation details with approval history.
 * Supports approve/reject actions for users with appropriate permissions.
 *
 * Routes:
 * - /quotations/:id (standalone)
 * - /projects/:projectId/quotations/:id (project context)
 *
 * Features:
 * - View quotation details and line items
 * - Multi-level approval progress display (T095c)
 * - Approval history
 * - PDF download
 * - Actions: edit, submit for approval, create new version
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, ConfirmationModal, Icon, PageHeader, Spinner } from '@/components/ui';
import {
  formatQuotationDate,
  QUOTATION_STATUS_LABELS,
  QuotationInfoCard,
  useQuotationActions,
} from '@/components/features/quotations';
import {
  ApprovalRejectModal,
  ApprovalRequestCard,
  useApprovalActions,
} from '@/components/features/approval';
import { useAuth } from '@/shared/hooks';
import type { ApprovalDetails, QuotationDetails } from '@/services';

export function QuotationDetailPage() {
  const navigate = useNavigate();
  const { id, projectId } = useParams<{ id: string; projectId?: string }>();
  const quotationId = id ? parseInt(id, 10) : null;
  const { user } = useAuth();

  // State
  const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
  const [approval, setApproval] = useState<ApprovalDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [versionConfirm, setVersionConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Hooks
  const {
    isLoading: isActingQuotation,
    error: quotationError,
    getQuotation,
    submitForApproval,
    createNewVersion,
    downloadPdf,
    clearError: clearQuotationError,
  } = useQuotationActions();

  const {
    isLoading: isActingApproval,
    error: approvalError,
    getApprovals,
    getApproval,
    approve,
    reject,
    clearError: clearApprovalError,
  } = useApprovalActions();

  const isActing = isActingQuotation || isActingApproval;
  const error = quotationError || approvalError;

  // Clear messages after delay
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Load quotation and approval data
  const loadData = useCallback(async () => {
    if (!quotationId) {
      setLoadError('Invalid quotation ID');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const quotationData = await getQuotation(quotationId);
      setQuotation(quotationData);

      // If quotation is pending approval, fetch approval details
      if (quotationData.status === 'PENDING') {
        try {
          // Fetch approvals for this entity
          const approvalsResult = await getApprovals({
            entityType: 'QUOTATION',
            page: 0,
            size: 10,
          });

          // Find approval for this quotation
          const foundApproval = approvalsResult.data.find(a => a.entityId === quotationId);

          if (foundApproval) {
            // Fetch full details
            const approvalDetails = await getApproval(foundApproval.id);
            setApproval(approvalDetails);
          }
        } catch {
          // Approval not found or error - that's okay
          console.warn('Could not fetch approval details');
        }
      } else {
        setApproval(null);
      }
    } catch {
      setLoadError('Failed to load quotation');
    } finally {
      setIsLoading(false);
    }
  }, [quotationId, getQuotation, getApprovals, getApproval]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

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
  const handleSubmitConfirm = useCallback(async () => {
    if (!quotationId) return;

    try {
      await submitForApproval(quotationId);
      showSuccess('Quotation submitted for approval');
      setSubmitConfirm(false);
      await loadData(); // Refresh data
    } catch {
      // Error handled by hook
    }
  }, [quotationId, submitForApproval, showSuccess, loadData]);

  // Handle create new version
  const handleVersionConfirm = useCallback(async () => {
    if (!quotationId) return;

    try {
      const result = await createNewVersion(quotationId);
      showSuccess('New version created');
      setVersionConfirm(false);
      // Navigate to edit the new version
      if (projectId) {
        navigate(`/projects/${projectId}/quotations/${result.id}/edit`);
      } else {
        navigate(`/quotations/${result.id}/edit`);
      }
    } catch {
      // Error handled by hook
    }
  }, [quotationId, createNewVersion, showSuccess, projectId, navigate]);

  // Handle download PDF
  const handleDownloadPdf = useCallback(async () => {
    if (!quotation) return;

    try {
      await downloadPdf(quotation.id, `${quotation.jobCode}_v${quotation.version}.pdf`);
    } catch {
      // Error handled by hook
    }
  }, [quotation, downloadPdf]);

  // Handle approve
  const handleApprove = useCallback(async () => {
    if (!approval) return;

    try {
      await approve(approval.id);
      showSuccess('Quotation approved');
      await loadData(); // Refresh data
    } catch {
      // Error handled by hook
    }
  }, [approval, approve, showSuccess, loadData]);

  // Handle reject
  const handleReject = useCallback(
    async (reason: string) => {
      if (!approval) return;

      try {
        await reject(approval.id, reason);
        showSuccess('Quotation rejected');
        setShowRejectModal(false);
        await loadData(); // Refresh data
      } catch {
        // Error handled by hook
      }
    },
    [approval, reject, showSuccess, loadData]
  );

  // Check if current user can approve/reject
  const canApproveOrReject = useCallback(() => {
    if (!approval || !user) return false;
    if (approval.status !== 'PENDING') return false;

    // Find current level decision
    const currentLevel = approval.levels?.find(l => l.levelOrder === approval.currentLevel);

    // Check if current user is the expected approver for this level
    return currentLevel?.expectedApproverId === user.id;
  }, [approval, user]);

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
  if (loadError || !quotation) {
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
          {loadError || 'Quotation not found'}
        </Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={navigateBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = quotation.status === 'DRAFT';
  const canSubmit = quotation.status === 'DRAFT';
  const canCreateVersion = ['APPROVED', 'SENT', 'ACCEPTED'].includes(quotation.status);
  const canDownloadPdf = quotation.status !== 'DRAFT';

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

          {/*{canEdit && (*/}
          {/*  <Button variant="secondary" onClick={handleEdit} disabled={isActing}>*/}
          {/*    <Icon name="pencil" className="mr-2 h-4 w-4" />*/}
          {/*    Edit*/}
          {/*  </Button>*/}
          {/*)}*/}

          {/*{canSubmit && (*/}
          {/*  <Button onClick={() => setSubmitConfirm(true)} disabled={isActing}>*/}
          {/*    <Icon name="paper-airplane" className="mr-2 h-4 w-4" />*/}
          {/*    Submit for Approval*/}
          {/*  </Button>*/}
          {/*)}*/}

          {/*{canDownloadPdf && (*/}
          {/*  <Button variant="secondary" onClick={handleDownloadPdf} disabled={isActing}>*/}
          {/*    <Icon name="document-arrow-down" className="mr-2 h-4 w-4" />*/}
          {/*    Download PDF*/}
          {/*  </Button>*/}
          {/*)}*/}

          {/*{canCreateVersion && (*/}
          {/*  <Button variant="secondary" onClick={() => setVersionConfirm(true)} disabled={isActing}>*/}
          {/*    <Icon name="document-duplicate" className="mr-2 h-4 w-4" />*/}
          {/*    Create New Version*/}
          {/*  </Button>*/}
          {/*)}*/}
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
        <Alert
          variant="error"
          className="mb-6"
          onClose={() => {
            clearQuotationError();
            clearApprovalError();
          }}
        >
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <QuotationInfoCard quotation={quotation} includeTimeInDates />
        </div>

        {/* Sidebar - Approval Info */}
        <div className="space-y-6">
          {/* Multi-Level Approval Progress (T095c) */}
          {approval && (
            <ApprovalRequestCard
              approval={approval}
              canAct={canApproveOrReject()}
              isActing={isActing}
              onApprove={() => handleApprove()}
              onReject={() => setShowRejectModal(true)}
            />
          )}

          {/* Approval Status for non-pending */}
          {!approval && quotation.status !== 'DRAFT' && (
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
                        {formatQuotationDate(quotation.approvedAt, true)}
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
                  <span className="font-medium">{QUOTATION_STATUS_LABELS[quotation.status]}</span>
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

      {/* Reject Modal */}
      <ApprovalRejectModal
        isOpen={showRejectModal}
        entityRef={`${quotation.jobCode} v${quotation.version}`}
        isSubmitting={isActing}
        error={approvalError}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
      />
    </div>
  );
}
