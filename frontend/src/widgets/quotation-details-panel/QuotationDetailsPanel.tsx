/**
 * Quotation Details Panel Widget.
 *
 * Composite component for displaying quotation details within a project tab.
 * Shows the latest quotation with version navigation arrows and all actions.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 *
 * Features:
 * - Display quotation details and line items
 * - Navigate between quotation versions
 * - Actions: edit, submit for approval, download PDF, send email, create new version
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, ConfirmationModal, Icon, Spinner } from '@/components/ui';

// Entity imports
import {
  QuotationCard,
  QuotationStatusBadge,
  quotationRules,
  useQuotation,
  useQuotations,
  type Quotation,
} from '@/entities/quotation';

// Feature imports
import {
  useSubmitQuotation,
  useCreateVersion,
  useDownloadPdf,
  useSendNotification,
  EmailNotificationModal,
} from '@/features/quotation';

export interface QuotationDetailsPanelProps {
  /** Project ID to fetch quotations for */
  readonly projectId: number;
  /** Callback when quotation data changes (for KPI refresh) */
  readonly onDataChange?: () => void;
  /** Callback for errors */
  readonly onError?: (error: string) => void;
}

/**
 * Inline quotation details panel with version navigation.
 */
export function QuotationDetailsPanel({
  projectId,
  onDataChange,
  onError,
}: QuotationDetailsPanelProps) {
  const navigate = useNavigate();

  // Version navigation state
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // Fetch all quotations for this project (all versions)
  const {
    data: quotationsData,
    isLoading: isLoadingList,
    error: listError,
    refetch: refetchList,
  } = useQuotations({
    projectId,
    size: 100, // Get all versions
  });

  // Sort by version descending (latest first)
  const quotations = useMemo(() => {
    if (!quotationsData?.data) return [];
    return [...quotationsData.data].sort((a, b) => b.version - a.version);
  }, [quotationsData]);

  // Get current quotation from list for navigation info
  const quotationFromList = quotations[currentIndex] ?? null;

  // Fetch full quotation details (with line items)
  const {
    data: quotation,
    isLoading: isLoadingDetails,
    refetch: refetchDetails,
  } = useQuotation({
    id: quotationFromList?.id ?? 0,
    enabled: quotationFromList !== null,
  });

  // Feature mutation hooks
  const submitMutation = useSubmitQuotation({
    onSuccess: () => {
      showSuccess('Quotation submitted for approval');
      setSubmitConfirm(false);
      void refetchList();
      void refetchDetails();
      onDataChange?.();
    },
    onError: (err) => onError?.(err.message),
  });

  const versionMutation = useCreateVersion({
    onSuccess: (result) => {
      showSuccess('New version created');
      setVersionConfirm(false);
      navigate(`/projects/${projectId}/quotations/${result.id}/edit`);
    },
    onError: (err) => onError?.(err.message),
  });

  const pdfMutation = useDownloadPdf({
    onError: (err) => onError?.(err.message),
  });

  const notifyMutation = useSendNotification({
    onSuccess: () => {
      setShowEmailModal(false);
      void refetchList();
      void refetchDetails();
      onDataChange?.();
      showSuccess('Email notification sent successfully');
    },
    onError: (err) => onError?.(err.message),
  });

  const isActing =
    submitMutation.isPending ||
    versionMutation.isPending ||
    pdfMutation.isPending ||
    notifyMutation.isPending;

  // Show success message with auto-dismiss
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
  const handleSubmitConfirm = useCallback(() => {
    if (!quotation) return;
    submitMutation.mutate(quotation.id);
  }, [quotation, submitMutation]);

  // Handle create new version
  const handleVersionConfirm = useCallback(() => {
    if (!quotation) return;
    versionMutation.mutate(quotation.id);
  }, [quotation, versionMutation]);

  // Handle download PDF
  const handleDownloadPdf = useCallback(() => {
    if (!quotation) return;
    pdfMutation.mutate({
      quotationId: quotation.id,
      filename: `${quotation.jobCode}_v${quotation.version}.pdf`,
    });
  }, [quotation, pdfMutation]);

  // Handle send email
  const handleSendEmail = useCallback(() => {
    if (!quotation) return;
    notifyMutation.mutate(quotation.id);
  }, [quotation, notifyMutation]);

  // Handle create new quotation
  const handleCreate = useCallback(() => {
    navigate(`/projects/${projectId}/quotations/create`);
  }, [navigate, projectId]);

  // Loading state
  if (isLoadingList) {
    return (
      <Card className="p-12 text-center">
        <Spinner className="mx-auto h-8 w-8" />
        <p className="mt-4 text-steel-400">Loading quotations...</p>
      </Card>
    );
  }

  // Error state
  if (listError) {
    return (
      <Alert variant="error">
        {listError.message}
        <Button
          variant="secondary"
          size="sm"
          className="ml-4"
          onClick={() => void refetchList()}
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
  const canEdit = quotation ? quotationRules.canEdit(quotation) : false;
  const canSubmit = quotation ? quotationRules.canSubmit(quotation) : false;
  const canCreateVersion = quotation ? quotationRules.canCreateNewVersion(quotation) : false;
  const canDownloadPdf = quotation ? quotationRules.canGeneratePdf(quotation) : false;
  const canSendEmail = quotation
    ? ['APPROVED', 'SENT', 'ACCEPTED'].includes(quotation.status)
    : false;

  const hasPrevVersion = currentIndex < quotations.length - 1;
  const hasNextVersion = currentIndex > 0;

  // Mutation errors
  const mutationError =
    submitMutation.error?.message ||
    versionMutation.error?.message ||
    pdfMutation.error?.message ||
    notifyMutation.error?.message;

  const clearMutationError = () => {
    submitMutation.reset();
    versionMutation.reset();
    pdfMutation.reset();
    notifyMutation.reset();
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {mutationError && (
        <Alert variant="error" onClose={clearMutationError}>
          {mutationError}
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
                v{quotation?.version ?? quotationFromList?.version}
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
          {quotation && <QuotationStatusBadge status={quotation.status} korean />}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="secondary" onClick={handleEdit} disabled={isActing} size="sm">
              <Icon name="pencil" className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}

          {canSubmit && (
            <Button onClick={() => setSubmitConfirm(true)} disabled={isActing} size="sm">
              <Icon name="paper-airplane" className="mr-2 h-4 w-4" />
              Submit
            </Button>
          )}

          {canDownloadPdf && (
            <Button variant="secondary" onClick={handleDownloadPdf} disabled={isActing} size="sm">
              <Icon name="document-arrow-down" className="mr-2 h-4 w-4" />
              PDF
            </Button>
          )}

          {canSendEmail && (
            <Button
              variant="secondary"
              onClick={() => setShowEmailModal(true)}
              disabled={isActing}
              size="sm"
            >
              <Icon name="envelope" className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          )}

          {canCreateVersion && (
            <Button
              variant="secondary"
              onClick={() => setVersionConfirm(true)}
              disabled={isActing}
              size="sm"
            >
              <Icon name="document-duplicate" className="mr-2 h-4 w-4" />
              New Version
            </Button>
          )}

          <Button onClick={handleCreate} size="sm">
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
        <QuotationCard quotation={quotation} showStatusBadge={false} />
      ) : null}

      {/* Modals */}
      <ConfirmationModal
        isOpen={submitConfirm}
        title="Submit for Approval"
        message={`Are you sure you want to submit "${quotation?.jobCode}" for approval? This will start the approval workflow.`}
        confirmLabel="Submit"
        onConfirm={handleSubmitConfirm}
        onClose={() => setSubmitConfirm(false)}
        variant="warning"
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
        isLoading={notifyMutation.isPending}
      />
    </div>
  );
}
