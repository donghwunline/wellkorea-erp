/**
 * Quotation Create Modal
 *
 * Modal wrapper for creating a new quotation within project context.
 * Preserves user context by staying on the project page.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, LoadingState, Modal, ModalActions } from '@/shared/ui';
import { projectQueries } from '@/entities/project';
import { QuotationForm } from '@/features/quotation/form';
import { useCreateQuotation } from '@/features/quotation/create';
import type { CreateQuotationInput } from '@/entities/quotation';

export interface QuotationCreateModalProps {
  /** Project ID to create quotation for */
  readonly projectId: number;
  /** Whether modal is open */
  readonly isOpen: boolean;
  /** Callback when modal should close */
  readonly onClose: () => void;
  /** Optional callback after successful creation */
  readonly onSuccess?: () => void;
}

export function QuotationCreateModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}: QuotationCreateModalProps) {
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch project details for display
  const {
    data: project,
    isLoading: isLoadingProject,
    error: projectError,
  } = useQuery({
    ...projectQueries.detail(projectId),
    enabled: isOpen && projectId > 0,
  });

  // Mutation hook
  const { mutate: createQuotation, isPending: isSubmitting } = useCreateQuotation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Handle form submission
  const handleCreateSubmit = useCallback(
    (data: CreateQuotationInput) => {
      setError(null);
      createQuotation(data);
    },
    [createQuotation]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  // Loading state
  if (isLoadingProject) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Quotation" size="lg">
        <LoadingState message="Loading project details..." />
      </Modal>
    );
  }

  // Error loading project
  if (projectError || !project) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Quotation" size="lg">
        <Alert variant="error">
          {projectError?.message || 'Failed to load project details'}
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create Quotation" size="lg">
      {/* Error alert */}
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <QuotationForm
        projectId={projectId}
        projectName={project.projectName}
        isSubmitting={isSubmitting}
        error={null}
        onCreateSubmit={handleCreateSubmit}
        onCancel={handleCancel}
      />
    </Modal>
  );
}
