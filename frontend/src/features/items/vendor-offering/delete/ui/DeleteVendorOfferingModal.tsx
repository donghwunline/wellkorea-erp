/**
 * Delete Vendor Offering Modal Component.
 *
 * Confirmation modal for deleting a vendor service offering.
 *
 * FSD Layer: features
 */

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
      title="Delete Vendor Offering"
      message={`Are you sure you want to delete the offering "${displayName}" from ${offering.vendorName}${priceInfo ? ` (${priceInfo})` : ''}? This action cannot be undone.`}
      variant="danger"
      confirmLabel="Delete"
    />
  );
}
