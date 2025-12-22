/**
 * Quotation Details Panel
 *
 * Inline component for displaying quotation details within a tab.
 * Shows the latest quotation with version navigation arrows.
 *
 * Features:
 * - Display quotation details and line items
 * - Navigate between quotation versions
 * - Actions: edit, submit for approval, download PDF, send email, create new version
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, ConfirmationModal, Icon, Spinner } from '@/components/ui';
import { quotationService } from '@/services';
import type { QuotationDetails } from '@/services';
import { EmailNotificationModal } from './EmailNotificationModal';
import { useQuotationActions } from './hooks';
import { QuotationInfoCard } from './QuotationInfoCard';
import { QUOTATION_STATUS_BADGE_VARIANTS, QUOTATION_STATUS_LABELS } from './quotationUtils';

export interface QuotationDetailsPanelProps {
  /** Project ID to fetch quotations for */
  projectId: number;
  /** Callback when quotation data changes (for KPI refresh) */
  onDataChange?: () => void;
  /** Callback for errors */
  onError?: (error: string) => void;
}

/**
 * Inline quotation details panel with version navigation.
 */
export function QuotationDetailsPanel({
  projectId,
  onDataChange,
  onError,
}: Readonly<QuotationDetailsPanelProps>) {
  const navigate = useNavigate();

  // Quotation list and current selection
  const [quotations, setQuotations] = useState<QuotationDetails[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuotation, setCurrentQuotation] = useState<QuotationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal states
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [versionConfirm, setVersionConfirm] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Action hooks
  const {
    isLoading: isActing,
    error: actionError,
    submitForApproval,
    createNewVersion,
    downloadPdf,
    sendRevisionNotification,
    clearError,
  } = useQuotationActions();

  // Get quotation from list (for navigation info)
  const quotationFromList = quotations[currentIndex] ?? null;
  // Use the fully-loaded quotation (with line items) for display
  const quotation = currentQuotation;

  // Show success message with auto-dismiss
  const showSuccess = useCallback((message: string) => {
    // Clear any existing timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    setSuccessMessage(message);
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
      successTimeoutRef.current = null;
    }, 3000);
  }, []);

  // Load all quotations for project
  const loadQuotations = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      // Fetch all quotations for this project (all versions)
      const result = await quotationService.getQuotations({
        projectId,
        size: 100, // Get all versions
      });

      // Sort by version descending (latest first)
      const sorted = [...result.data].sort((a, b) => b.version - a.version);
      setQuotations(sorted);
      setCurrentIndex(0); // Start at latest
    } catch {
      setLoadError('Failed to load quotations');
      onError?.('Failed to load quotations');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, onError]);

  // Load full quotation details (with line items)
  const loadQuotationDetails = useCallback(async (quotationId: number) => {
    setIsLoadingDetails(true);
    try {
      const details = await quotationService.getQuotation(quotationId);
      setCurrentQuotation(details);
    } catch {
      onError?.('Failed to load quotation details');
    } finally {
      setIsLoadingDetails(false);
    }
  }, [onError]);

  // Load on mount and when projectId changes
  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  // Load full details when current quotation changes
  useEffect(() => {
    if (quotationFromList) {
      loadQuotationDetails(quotationFromList.id);
    } else {
      setCurrentQuotation(null);
    }
  }, [quotationFromList, loadQuotationDetails]);

  // Navigate to previous version (older)
  const handlePrevVersion = useCallback(() => {
    if (currentIndex < quotations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, quotations.length]);

  // Navigate to next version (newer)
  const handleNextVersion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Handle edit
  const handleEdit = useCallback(() => {
    if (!quotation) return;
    navigate(`/projects/${projectId}/quotations/${quotation.id}/edit`);
  }, [navigate, projectId, quotation]);

  // Handle submit for approval
  const handleSubmitConfirm = useCallback(async () => {
    if (!quotation) return;

    try {
      await submitForApproval(quotation.id);
      setSubmitConfirm(false);
      await loadQuotations();
      // Reload the current quotation details
      await loadQuotationDetails(quotation.id);
      onDataChange?.();
    } catch {
      onError?.('Failed to submit quotation for approval');
    }
  }, [quotation, submitForApproval, loadQuotations, loadQuotationDetails, onDataChange, onError]);

  // Handle create new version
  const handleVersionConfirm = useCallback(async () => {
    if (!quotation) return;

    try {
      const result = await createNewVersion(quotation.id);
      setVersionConfirm(false);
      // Navigate to edit the new version
      navigate(`/projects/${projectId}/quotations/${result.id}/edit`);
    } catch {
      onError?.('Failed to create new version');
    }
  }, [quotation, createNewVersion, navigate, projectId, onError]);

  // Handle download PDF
  const handleDownloadPdf = useCallback(async () => {
    if (!quotation) return;

    try {
      await downloadPdf(quotation.id, `${quotation.jobCode}_v${quotation.version}.pdf`);
    } catch {
      onError?.('Failed to download PDF');
    }
  }, [quotation, downloadPdf, onError]);

  // Handle send email
  const handleSendEmail = useCallback(async () => {
    if (!quotation) return;

    try {
      // Send notification
      await sendRevisionNotification(quotation.id);
      setShowEmailModal(false);

      // Reload data to reflect status change (APPROVED → SENT)
      await loadQuotations();
      if (quotation.id) {
        await loadQuotationDetails(quotation.id);
      }
      onDataChange?.();

      // Only show success after ALL operations complete
      showSuccess('Email notification sent successfully');
    } catch {
      onError?.('Failed to send email notification');
    }
  }, [quotation, sendRevisionNotification, loadQuotations, loadQuotationDetails, onDataChange, onError, showSuccess]);

  // Handle create new quotation
  const handleCreate = useCallback(() => {
    navigate(`/projects/${projectId}/quotations/create`);
  }, [navigate, projectId]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <Spinner className="mx-auto h-8 w-8" />
        <p className="mt-4 text-steel-400">Loading quotations...</p>
      </Card>
    );
  }

  // Error state
  if (loadError) {
    return (
      <Alert variant="error">
        {loadError}
        <Button
          variant="secondary"
          size="sm"
          className="ml-4"
          onClick={() => void loadQuotations()}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  // Empty state - no quotations yet
  if (quotations.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Icon name="document" className="mx-auto mb-4 h-16 w-16 text-steel-600" />
        <h3 className="mb-2 text-lg font-semibold text-white">No Quotations Yet</h3>
        <p className="mb-6 text-steel-400">Create your first quotation for this project.</p>
        <Button onClick={handleCreate}>
          <Icon name="plus" className="mr-2 h-4 w-4" />
          New Quotation
        </Button>
      </Card>
    );
  }

  // Determine available actions
  const canEdit = quotation?.status === 'DRAFT';
  const canSubmit = quotation?.status === 'DRAFT';
  const canCreateVersion = quotation && ['APPROVED', 'SENT', 'ACCEPTED'].includes(quotation.status);
  const canDownloadPdf = quotation && quotation.status !== 'DRAFT';
  const canSendEmail = quotation && ['APPROVED', 'SENT', 'ACCEPTED'].includes(quotation.status);

  const hasPrevVersion = currentIndex < quotations.length - 1;
  const hasNextVersion = currentIndex > 0;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {actionError && (
        <Alert variant="error" onClose={clearError}>
          {actionError}
        </Alert>
      )}

      {/* Header with Version Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Version Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevVersion}
              disabled={!hasPrevVersion}
              className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              title="Previous version (older)"
            >
              <Icon name="chevron-left" className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="text-lg font-semibold text-white">
                v{quotation?.version}
                <span className="ml-2 text-sm font-normal text-steel-500">
                  ({currentIndex + 1} of {quotations.length})
                </span>
              </div>
            </div>

            <button
              onClick={handleNextVersion}
              disabled={!hasNextVersion}
              className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              title="Next version (newer)"
            >
              <Icon name="chevron-right" className="h-5 w-5" />
            </button>
          </div>

          {/* Status Badge */}
          {quotation && (
            <Badge variant={QUOTATION_STATUS_BADGE_VARIANTS[quotation.status]}>
              {QUOTATION_STATUS_LABELS[quotation.status]}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="secondary" onClick={handleEdit} disabled={isActing} size={'sm'}>
              <Icon name="pencil" className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}

          {canSubmit && (
            <Button onClick={() => setSubmitConfirm(true)} disabled={isActing} size={'sm'}>
              <Icon name="paper-airplane" className="mr-2 h-4 w-4" />
              Submit
            </Button>
          )}

          {canDownloadPdf && (
            <Button variant="secondary" onClick={handleDownloadPdf} disabled={isActing} size={'sm'}>
              <Icon name="document-arrow-down" className="mr-2 h-4 w-4" />
              PDF
            </Button>
          )}

          {canSendEmail && (
            <Button
              variant="secondary"
              onClick={() => setShowEmailModal(true)}
              disabled={isActing}
              size={'sm'}
            >
              <Icon name="paper-airplane" className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          )}

          {canCreateVersion && (
            <Button
              variant="secondary"
              onClick={() => setVersionConfirm(true)}
              disabled={isActing}
              size={'sm'}
            >
              <Icon name="document-duplicate" className="mr-2 h-4 w-4" />
              New Version
            </Button>
          )}

          <Button onClick={handleCreate} size={'sm'}>
            <Icon name="plus" className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {isLoadingDetails ? (
        <Card className="p-12 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-steel-400">Loading quotation details...</p>
        </Card>
      ) : quotation ? (
        <QuotationInfoCard quotation={quotation} showStatusBadge={false} />
      ) : null}

      {/* Modals */}
      <ConfirmationModal
        isOpen={submitConfirm}
        title="Submit for Approval"
        message={`Are you sure you want to submit "${quotation?.jobCode}" for approval? This will start the approval workflow.`}
        confirmLabel="Submit"
        onConfirm={handleSubmitConfirm}
        onClose={() => setSubmitConfirm(false)}
        variant={'warning'}
      />

      <ConfirmationModal
        isOpen={versionConfirm}
        title="Create New Version"
        message={`Create a new version based on "${quotation?.jobCode} v${quotation?.version}"? The new version will be in DRAFT status.`}
        confirmLabel="Create Version"
        onConfirm={handleVersionConfirm}
        onClose={() => setVersionConfirm(false)}
      />

      <EmailNotificationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleSendEmail}
        quotationInfo={
          quotation ? { jobCode: quotation.jobCode, version: quotation.version } : undefined
        }
        isLoading={isActing}
      />
    </div>
  );
}
