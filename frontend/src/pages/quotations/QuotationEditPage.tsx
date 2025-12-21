/**
 * Quotation Edit Page
 *
 * Form for editing an existing quotation.
 * Only DRAFT quotations can be edited.
 *
 * Routes:
 * - /quotations/:id/edit (standalone)
 * - /projects/:projectId/quotations/:id/edit (project context)
 *
 * Features:
 * - Edit quotation details and line items
 * - Optionally send revision notification email (T093a)
 * - Version management
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Icon, Modal, PageHeader, Spinner } from '@/components/ui';
import {
  QuotationForm,
  useQuotationActions,
} from '@/components/features/quotations';
import type { QuotationDetails, UpdateQuotationRequest } from '@/services';

export function QuotationEditPage() {
  const navigate = useNavigate();
  const { id, projectId } = useParams<{ id: string; projectId?: string }>();
  const quotationId = id ? parseInt(id, 10) : null;

  // State
  const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendEmailOnSave, setSendEmailOnSave] = useState(false);

  // Hooks
  const {
    isLoading: isSubmitting,
    error,
    getQuotation,
    updateQuotation,
    sendRevisionNotification,
  } = useQuotationActions();

  // Load quotation on mount
  useEffect(() => {
    async function loadQuotation() {
      if (!quotationId) {
        setLoadError('Invalid quotation ID');
        setIsLoadingQuotation(false);
        return;
      }

      try {
        const data = await getQuotation(quotationId);

        // Check if quotation is editable (DRAFT only)
        if (data.status !== 'DRAFT') {
          setLoadError(`Cannot edit quotation in ${data.status} status. Only DRAFT quotations can be edited.`);
          setQuotation(null);
        } else {
          setQuotation(data);
          setLoadError(null);
        }
      } catch {
        setLoadError('Failed to load quotation');
      } finally {
        setIsLoadingQuotation(false);
      }
    }

    loadQuotation();
  }, [quotationId, getQuotation]);

  // Handle form submission
  const handleSubmit = useCallback(async (data: UpdateQuotationRequest) => {
    if (!quotationId) return;

    try {
      await updateQuotation(quotationId, data);

      // Show email modal if this is a new version (version > 1)
      if (quotation && quotation.version > 1) {
        setShowEmailModal(true);
      } else {
        // Navigate back
        navigateBack();
      }
    } catch {
      // Error is handled by the hook
    }
  }, [quotationId, quotation, updateQuotation]);

  // Handle email modal confirmation
  const handleEmailModalConfirm = useCallback(async () => {
    if (sendEmailOnSave && quotationId) {
      try {
        await sendRevisionNotification(quotationId);
      } catch {
        // Log error but continue - email failure shouldn't block navigation
        console.error('Failed to send revision notification');
      }
    }
    navigateBack();
  }, [sendEmailOnSave, quotationId, sendRevisionNotification]);

  // Navigate back to appropriate page
  const navigateBack = useCallback(() => {
    if (projectId) {
      navigate(`/projects/${projectId}/quotation`);
    } else {
      navigate('/quotations');
    }
  }, [navigate, projectId]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigateBack();
  }, [navigateBack]);

  // Render loading state
  if (isLoadingQuotation) {
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
  if (loadError) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title
            title="Edit Quotation"
            description="Unable to edit quotation"
          />
          <PageHeader.Actions>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              Back
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="error" className="mt-6">
          {loadError}
        </Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={handleCancel}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Render form
  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="Edit Quotation"
          description={`${quotation?.jobCode} v${quotation?.version}`}
        />
        <PageHeader.Actions>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            Back
          </button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Form */}
      {quotation && (
        <QuotationForm
          key={quotation.id}
          quotation={quotation}
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* Email Notification Modal (T093a) */}
      <Modal
        isOpen={showEmailModal}
        onClose={handleEmailModalConfirm}
        title="Send Revision Notification"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-steel-300">
            Quotation updated successfully. Would you like to send a revision notification email to the customer?
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmailOnSave}
              onChange={e => setSendEmailOnSave(e.target.checked)}
              className="h-4 w-4 rounded border-steel-600 bg-steel-800 text-copper-500 focus:ring-copper-500/20"
            />
            <span className="text-white">Send email notification to customer</span>
          </label>

          <p className="text-xs text-steel-500">
            This will notify the customer that a new version of the quotation is available.
          </p>

          <div className="flex justify-end gap-3 border-t border-steel-700/50 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setSendEmailOnSave(false);
                handleEmailModalConfirm();
              }}
            >
              Skip
            </Button>
            <Button onClick={handleEmailModalConfirm}>
              {sendEmailOnSave ? 'Send & Continue' : 'Continue'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
