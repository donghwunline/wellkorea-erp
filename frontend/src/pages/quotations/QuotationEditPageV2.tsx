/**
 * Quotation Edit Page (FSD Version).
 *
 * Form for editing an existing quotation.
 * Only DRAFT quotations can be edited.
 *
 * Routes:
 * - /quotations/:id/edit (standalone)
 * - /projects/:projectId/quotations/:id/edit (project context)
 *
 * Pages Layer: Route-level assembly only
 * - URL params handling
 * - Layout composition
 * - Feature delegation
 */

import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Icon, PageHeader, Spinner } from '@/shared/ui';
import { useQuery } from '@tanstack/react-query';
import { quotationQueries, quotationRules, type UpdateQuotationInput } from '@/entities/quotation';
import { QuotationForm, useUpdateQuotation } from '@/features/quotation';

export function QuotationEditPageV2() {
  const navigate = useNavigate();
  const { id, projectId } = useParams<{ id: string; projectId?: string }>();
  const quotationId = id ? parseInt(id, 10) : null;

  // Fetch quotation data using TanStack Query
  const {
    data: quotation,
    isLoading: isLoadingQuotation,
    error: loadError,
  } = useQuery({
    ...quotationQueries.detail(quotationId!),
    enabled: quotationId !== null,
  });

  // Mutation hook for updating
  const {
    mutate: updateQuotation,
    isPending: isSubmitting,
    error: mutationError,
  } = useUpdateQuotation({
    onSuccess: () => {
      navigateBack();
    },
  });

  // Navigate back to appropriate page
  const navigateBack = useCallback(() => {
    if (projectId) {
      navigate(`/projects/${projectId}/quotation`);
    } else {
      navigate('/quotations');
    }
  }, [navigate, projectId]);

  // Handle form submission
  const handleUpdateSubmit = useCallback(
    (data: UpdateQuotationInput) => {
      if (!quotationId) return;
      updateQuotation({ id: quotationId, input: data });
    },
    [quotationId, updateQuotation]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigateBack();
  }, [navigateBack]);

  // Check if quotation is editable
  const canEdit = quotation ? quotationRules.canEdit(quotation) : false;
  const editError =
    quotation && !canEdit
      ? `Cannot edit quotation in ${quotation.status} status. Only DRAFT quotations can be edited.`
      : null;

  // Error message
  const error =
    mutationError?.message || editError || (loadError ? 'Failed to load quotation' : null);

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

  // Render error state (load error or not editable)
  if (error && !canEdit) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title="Edit Quotation" description="Unable to edit quotation" />
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
          {error}
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
      {quotation && canEdit && (
        <QuotationForm
          key={quotation.id}
          quotation={quotation}
          isSubmitting={isSubmitting}
          error={mutationError?.message}
          onUpdateSubmit={handleUpdateSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
