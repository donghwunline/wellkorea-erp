/**
 * Delete Vendor Offering Modal Component.
 *
 * Confirmation modal for deleting a vendor service offering.
 *
 * FSD Layer: features
 */

import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationModal } from '@/shared/ui';
import type { VendorOffering } from '@/entities/catalog';
import { catalogQueries, deleteVendorOffering, vendorOfferingRules } from '@/entities/catalog';

// =============================================================================
// TYPES
// =============================================================================

export interface DeleteVendorOfferingModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Offering to delete */
  offering: VendorOffering | null;
  /** Called after successful delete */
  onSuccess?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DeleteVendorOfferingModal({
  isOpen,
  onClose,
  offering,
  onSuccess,
}: Readonly<DeleteVendorOfferingModalProps>) {
  const { t } = useTranslation(['items', 'common']);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendorOffering({ id: offering?.id ?? 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueries.offerings() });
      onSuccess?.();
      onClose();
    },
  });

  const handleConfirm = async () => {
    if (!offering) return;
    await deleteMutation.mutateAsync();
  };

  if (!offering) return null;

  const displayName = vendorOfferingRules.getDisplayName(offering);
  const priceInfo = vendorOfferingRules.formatPrice(offering);

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('items:deleteVendorOfferingModal.title')}
      message={t('items:deleteVendorOfferingModal.message', { name: displayName, vendor: offering.vendorName, price: priceInfo || '' })}
      variant="danger"
      confirmLabel={t('common:buttons.delete')}
    />
  );
}
