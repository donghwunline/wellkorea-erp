/**
 * Quotation Edit Modal
 *
 * Modal wrapper for editing an existing quotation within project context.
 * Preserves user context by staying on the project page.
 * Only DRAFT quotations can be edited.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, LoadingState, Modal, ModalActions } from '@/shared/ui';
import { quotationQueries, quotationRules, type UpdateQuotationInput } from '@/entities/quotation';
import { QuotationForm } from '@/features/quotation/form';
import { useUpdateQuotation } from '@/features/quotation/update';

export interface QuotationEditModalProps {
  /** Quotation ID to edit */
  readonly quotationId: number;
  /** Whether modal is open */
  readonly isOpen: boolean;
  /** Callback when modal should close */
  readonly onClose: () => void;
  /** Optional callback after successful update */
  readonly onSuccess?: () => void;
}

export function QuotationEditModal({
  quotationId,
  isOpen,
  onClose,
  onSuccess,
}: QuotationEditModalProps) {
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch quotation details
  const {
    data: quotation,
    isLoading,
    error: fetchError,
  } = useQuery({
    ...quotationQueries.detail(quotationId),
    enabled: isOpen && quotationId > 0,
  });

  // Check if quotation is editable
  const canEdit = quotation ? quotationRules.canEdit(quotation) : false;

  // Mutation hook
  const { mutate: updateQuotation, isPending: isSubmitting } = useUpdateQuotation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Handle form submission
  const handleUpdateSubmit = useCallback(
    (data: UpdateQuotationInput) => {
      setError(null);
      updateQuotation({ id: quotationId, input: data });
    },
    [quotationId, updateQuotation]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  // Loading state
  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Quotation" size="lg">
        <LoadingState message="Loading quotation..." />
      </Modal>
    );
  }

  // Error loading quotation
  if (fetchError || !quotation) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Quotation" size="lg">
        <Alert variant="error">
          {fetchError?.message || 'Failed to load quotation'}
        </Alert>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  // Not editable state
  if (!canEdit) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Quotation" size="lg">
        <Alert variant="warning">
          Cannot edit quotation in {quotation.status} status. Only DRAFT quotations can be edited.
        </Alert>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Quotation - ${quotation.jobCode} v${quotation.version}`}
      size="lg"
    >
      {/* Error alert */}
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <QuotationForm
        key={quotation.id}
        quotation={quotation}
        isSubmitting={isSubmitting}
        error={null}
        onUpdateSubmit={handleUpdateSubmit}
        onCancel={handleCancel}
      />
    </Modal>
  );
}
