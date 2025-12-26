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
 * - Version management
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Icon, PageHeader, Spinner } from '@/components/ui';
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

  // Hooks
  const {
    isLoading: isSubmitting,
    error,
    getQuotation,
    updateQuotation,
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

  // Navigate back to appropriate page
  const navigateBack = useCallback(() => {
    if (projectId) {
      navigate(`/projects/${projectId}/quotation`);
    } else {
      navigate('/quotations');
    }
  }, [navigate, projectId]);

  // Handle form submission
  const handleSubmit = useCallback(async (data: UpdateQuotationRequest) => {
    if (!quotationId) return;

    try {
      await updateQuotation(quotationId, data);
      navigateBack();
    } catch {
      // Error is handled by the hook
    }
  }, [quotationId, updateQuotation, navigateBack]);

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
    </div>
  );
}
