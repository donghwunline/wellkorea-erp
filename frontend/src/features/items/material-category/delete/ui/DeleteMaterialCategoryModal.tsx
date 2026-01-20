/**
 * Delete Material Category Modal Component.
 *
 * Confirmation modal for deactivating a material category.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationModal } from '@/shared/ui';
import type { MaterialCategoryListItem } from '@/entities/material';
import { materialQueries, deleteMaterialCategory } from '@/entities/material';

// =============================================================================
// TYPES
// =============================================================================

export interface DeleteMaterialCategoryModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Category to delete */
  category: MaterialCategoryListItem | null;
  /** Called after successful delete */
  onSuccess?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DeleteMaterialCategoryModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: Readonly<DeleteMaterialCategoryModalProps>) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteMaterialCategory({ id: category?.id ?? 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialQueries.categories() });
      onSuccess?.();
      onClose();
    },
  });

  const handleConfirm = async () => {
    if (!category) return;
    await deleteMutation.mutateAsync();
  };

  if (!category) return null;

  const materialCountWarning = category.materialCount > 0
    ? ` This category contains ${category.materialCount} material(s).`
    : '';

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Deactivate Category"
      message={`Are you sure you want to deactivate "${category.name}"?${materialCountWarning} The category will no longer appear in active listings.`}
      variant="danger"
      confirmLabel="Deactivate"
    />
  );
}
