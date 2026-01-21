/**
 * Delete Material Modal Component.
 *
 * Confirmation modal for deactivating a material.
 *
 * FSD Layer: features
 */

import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationModal } from '@/shared/ui';
import type { MaterialListItem } from '@/entities/material';
import { materialQueries, deleteMaterial } from '@/entities/material';

// =============================================================================
// TYPES
// =============================================================================

export interface DeleteMaterialModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Material to delete */
  material: MaterialListItem | null;
  /** Called after successful delete */
  onSuccess?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DeleteMaterialModal({
  isOpen,
  onClose,
  material,
  onSuccess,
}: Readonly<DeleteMaterialModalProps>) {
  const { t } = useTranslation(['items', 'common']);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteMaterial({ id: material?.id ?? 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialQueries.lists() });
      queryClient.invalidateQueries({ queryKey: materialQueries.details() });
      onSuccess?.();
      onClose();
    },
  });

  const handleConfirm = async () => {
    if (!material) return;
    await deleteMutation.mutateAsync();
  };

  if (!material) return null;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('items:deleteMaterialModal.title')}
      message={t('items:deleteMaterialModal.message', { name: material.name, sku: material.sku })}
      variant="danger"
      confirmLabel={t('items:deleteMaterialModal.confirm')}
    />
  );
}
