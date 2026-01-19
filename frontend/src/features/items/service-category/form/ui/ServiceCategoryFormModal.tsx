/**
 * Service Category Form Modal Component.
 *
 * Combined create/edit modal for service categories.
 *
 * FSD Layer: features
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/shared/ui';
import type { ServiceCategory } from '@/entities/catalog';
import {
  catalogQueries,
  createServiceCategory,
  updateServiceCategory,
  type CreateServiceCategoryInput,
  type UpdateServiceCategoryInput,
} from '@/entities/catalog';
import { ServiceCategoryForm, type ServiceCategoryFormData } from './ServiceCategoryForm';

// =============================================================================
// TYPES
// =============================================================================

export interface ServiceCategoryFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Category to edit (undefined for create mode) */
  category?: ServiceCategory;
  /** Called after successful create/update */
  onSuccess?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ServiceCategoryFormModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: Readonly<ServiceCategoryFormModalProps>) {
  const mode = category ? 'edit' : 'create';
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateServiceCategoryInput) => createServiceCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueries.categories() });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create category');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateServiceCategoryInput }) =>
      updateServiceCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueries.categories() });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to update category');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = (data: ServiceCategoryFormData) => {
    setError(null);

    if (mode === 'create') {
      createMutation.mutate({
        name: data.name,
        description: data.description || null,
      });
    } else if (category) {
      updateMutation.mutate({
        id: category.id,
        input: {
          name: data.name,
          description: data.description || null,
        },
      });
    }
  };

  const handleDismissError = () => {
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Add Service Category' : 'Edit Service Category'}
      size="md"
    >
      <ServiceCategoryForm
        category={category}
        isSubmitting={isSubmitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        onDismissError={handleDismissError}
      />
    </Modal>
  );
}
