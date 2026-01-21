/**
 * Material Category Form Modal Component.
 *
 * Combined create/edit modal for material categories.
 *
 * FSD Layer: features
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/shared/ui';
import type { MaterialCategory } from '@/entities/material';
import {
  materialQueries,
  createMaterialCategory,
  updateMaterialCategory,
  type CreateMaterialCategoryInput,
  type UpdateMaterialCategoryInput,
} from '@/entities/material';
import { MaterialCategoryForm, type MaterialCategoryFormData } from './MaterialCategoryForm';

// =============================================================================
// TYPES
// =============================================================================

export interface MaterialCategoryFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Category to edit (undefined for create mode) */
  category?: MaterialCategory;
  /** Called after successful create/update */
  onSuccess?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MaterialCategoryFormModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: Readonly<MaterialCategoryFormModalProps>) {
  const { t } = useTranslation(['items', 'common']);
  const mode = category ? 'edit' : 'create';
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateMaterialCategoryInput) => createMaterialCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialQueries.categories() });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || t('items:materialCategoryFormModal.createError'));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateMaterialCategoryInput }) =>
      updateMaterialCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialQueries.categories() });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || t('items:materialCategoryFormModal.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = (data: MaterialCategoryFormData) => {
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
      title={mode === 'create' ? t('items:materialCategoryFormModal.addTitle') : t('items:materialCategoryFormModal.editTitle')}
      size="md"
    >
      <MaterialCategoryForm
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
