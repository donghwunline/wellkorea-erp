/**
 * Material Form Modal Component.
 *
 * Combined create/edit modal for materials.
 * Wraps MaterialForm with mutations and modal UI.
 *
 * FSD Layer: features
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/shared/ui';
import type { Material } from '@/entities/material';
import {
  materialQueries,
  createMaterial,
  updateMaterial,
  type CreateMaterialInput,
  type UpdateMaterialInput,
} from '@/entities/material';
import { MaterialForm, type MaterialFormData } from './MaterialForm';

// =============================================================================
// TYPES
// =============================================================================

export interface MaterialFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Material to edit (undefined for create mode) */
  material?: Material;
  /** Called after successful create/update */
  onSuccess?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MaterialFormModal({
  isOpen,
  onClose,
  material,
  onSuccess,
}: Readonly<MaterialFormModalProps>) {
  const { t } = useTranslation(['items', 'common']);
  const mode = material ? 'edit' : 'create';
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateMaterialInput) => createMaterial(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialQueries.lists() });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || t('items:materialFormModal.createError'));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateMaterialInput }) =>
      updateMaterial(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialQueries.lists() });
      queryClient.invalidateQueries({ queryKey: materialQueries.details() });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || t('items:materialFormModal.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = (data: MaterialFormData) => {
    setError(null);

    const price = data.standardPrice ? parseFloat(data.standardPrice) : null;

    if (mode === 'create') {
      createMutation.mutate({
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        categoryId: data.categoryId!,
        unit: data.unit || 'EA',
        standardPrice: price,
        preferredVendorId: data.preferredVendorId,
      });
    } else if (material) {
      updateMutation.mutate({
        id: material.id,
        input: {
          name: data.name,
          description: data.description || null,
          categoryId: data.categoryId!,
          unit: data.unit || 'EA',
          standardPrice: price,
          preferredVendorId: data.preferredVendorId,
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
      title={mode === 'create' ? t('items:materialFormModal.addTitle') : t('items:materialFormModal.editTitle')}
      size="lg"
    >
      <MaterialForm
        material={material}
        isSubmitting={isSubmitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        onDismissError={handleDismissError}
      />
    </Modal>
  );
}
