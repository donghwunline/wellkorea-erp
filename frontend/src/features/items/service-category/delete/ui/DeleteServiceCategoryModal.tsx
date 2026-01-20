/**
 * Delete Service Category Modal Component.
 *
 * Confirmation modal for deactivating a service category.
 *
 * FSD Layer: features
 */

import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationModal } from '@/shared/ui';
import type { ServiceCategoryListItem } from '@/entities/catalog';
import { catalogQueries, deleteServiceCategory } from '@/entities/catalog';

// =============================================================================
// TYPES
// =============================================================================

export interface DeleteServiceCategoryModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Category to delete */
  category: ServiceCategoryListItem | null;
  /** Called after successful delete */
  onSuccess?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DeleteServiceCategoryModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: Readonly<DeleteServiceCategoryModalProps>) {
  const { t } = useTranslation(['items', 'common']);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteServiceCategory({ id: category?.id ?? 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueries.categories() });
      onSuccess?.();
      onClose();
    },
  });

  const handleConfirm = async () => {
    if (!category) return;
    await deleteMutation.mutateAsync();
  };

  if (!category) return null;

  const vendorCountWarning = category.vendorCount > 0
    ? ` ${t('items:deleteServiceCategoryModal.vendorCountWarning', { count: category.vendorCount })}`
    : '';

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('items:deleteServiceCategoryModal.title')}
      message={t('items:deleteServiceCategoryModal.message', { name: category.name, warning: vendorCountWarning })}
      variant="danger"
      confirmLabel={t('common:buttons.deactivate')}
    />
  );
}
