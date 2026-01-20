/**
 * Delete Vendor Material Offering Modal Component.
 *
 * Confirmation modal for deleting a vendor material offering.
 *
 * FSD Layer: features
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationModal } from '@/shared/ui';
import type { VendorMaterialOffering } from '@/entities/material';
import { materialQueries, deleteVendorMaterialOffering, vendorMaterialOfferingRules } from '@/entities/material';

// =============================================================================
// TYPES
// =============================================================================

export interface DeleteVendorMaterialOfferingModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Offering to delete */
  offering: VendorMaterialOffering | null;
  /** Called after successful delete */
  onSuccess?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DeleteVendorMaterialOfferingModal({
  isOpen,
  onClose,
  offering,
  onSuccess,
}: Readonly<DeleteVendorMaterialOfferingModalProps>) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendorMaterialOffering({ id: offering?.id ?? 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialQueries.offerings() });
      onSuccess?.();
      onClose();
    },
  });

  const handleConfirm = async () => {
    if (!offering) return;
    await deleteMutation.mutateAsync();
  };

  if (!offering) return null;

  const displayName = vendorMaterialOfferingRules.getDisplayName(offering);
  const priceInfo = vendorMaterialOfferingRules.formatPrice(offering);

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Vendor Material Offering"
      message={`Are you sure you want to delete the offering "${displayName}" from ${offering.vendorName}${priceInfo ? ` (${priceInfo})` : ''}? This action cannot be undone.`}
      variant="danger"
      confirmLabel="Delete"
    />
  );
}
