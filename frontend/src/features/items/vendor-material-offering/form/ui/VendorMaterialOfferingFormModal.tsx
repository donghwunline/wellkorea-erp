/**
 * Vendor Material Offering Form Modal Component.
 *
 * Combined create/edit modal for vendor material offerings.
 *
 * FSD Layer: features
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/shared/ui';
import type { VendorMaterialOffering } from '@/entities/material';
import {
  materialQueries,
  createVendorMaterialOffering,
  updateVendorMaterialOffering,
  type CreateVendorMaterialOfferingInput,
  type UpdateVendorMaterialOfferingInput,
} from '@/entities/material';
import { VendorMaterialOfferingForm, type VendorMaterialOfferingFormData } from './VendorMaterialOfferingForm';

// =============================================================================
// TYPES
// =============================================================================

export interface VendorMaterialOfferingFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Offering to edit (undefined for create mode) */
  offering?: VendorMaterialOffering;
  /** Material ID for create mode (pre-populate and lock the material field) */
  materialId?: number;
  /** Material name for display when materialId is provided */
  materialName?: string;
  /** Called after successful create/update */
  onSuccess?: () => void;
}

// =============================================================================
// HELPER
// =============================================================================

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function VendorMaterialOfferingFormModal({
  isOpen,
  onClose,
  offering,
  materialId,
  materialName,
  onSuccess,
}: Readonly<VendorMaterialOfferingFormModalProps>) {
  const mode = offering ? 'edit' : 'create';
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateVendorMaterialOfferingInput) => createVendorMaterialOffering(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialQueries.offerings() });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create offering');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (input: UpdateVendorMaterialOfferingInput) => updateVendorMaterialOffering(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialQueries.offerings() });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to update offering');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = (data: VendorMaterialOfferingFormData) => {
    setError(null);

    if (mode === 'create') {
      if (!data.vendorId || !data.materialId) {
        setError('Vendor and material are required');
        return;
      }

      createMutation.mutate({
        vendorId: data.vendorId,
        materialId: data.materialId,
        vendorMaterialCode: data.vendorMaterialCode || null,
        vendorMaterialName: data.vendorMaterialName || null,
        unitPrice: parseNumber(data.unitPrice),
        currency: data.currency || null,
        leadTimeDays: parseNumber(data.leadTimeDays),
        minOrderQuantity: parseNumber(data.minOrderQuantity),
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        isPreferred: data.isPreferred,
        notes: data.notes || null,
      });
    } else if (offering) {
      updateMutation.mutate({
        id: offering.id,
        vendorMaterialCode: data.vendorMaterialCode || null,
        vendorMaterialName: data.vendorMaterialName || null,
        unitPrice: parseNumber(data.unitPrice),
        currency: data.currency || null,
        leadTimeDays: parseNumber(data.leadTimeDays),
        minOrderQuantity: parseNumber(data.minOrderQuantity),
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        isPreferred: data.isPreferred,
        notes: data.notes || null,
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
      title={mode === 'create' ? 'Add Vendor Material Offering' : 'Edit Vendor Material Offering'}
      size="lg"
    >
      <VendorMaterialOfferingForm
        offering={offering}
        defaultMaterialId={materialId}
        defaultMaterialName={materialName}
        isSubmitting={isSubmitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        onDismissError={handleDismissError}
      />
    </Modal>
  );
}
