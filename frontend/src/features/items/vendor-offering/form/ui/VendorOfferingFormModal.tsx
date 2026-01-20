/**
 * Vendor Offering Form Modal Component.
 *
 * Combined create/edit modal for vendor service offerings.
 *
 * FSD Layer: features
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/shared/ui';
import type { VendorOffering } from '@/entities/catalog';
import {
  catalogQueries,
  createVendorOffering,
  updateVendorOffering,
  type CreateVendorOfferingInput,
  type UpdateVendorOfferingInput,
} from '@/entities/catalog';
import { VendorOfferingForm, type VendorOfferingFormData } from './VendorOfferingForm';

// =============================================================================
// TYPES
// =============================================================================

export interface VendorOfferingFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Offering to edit (undefined for create mode) */
  offering?: VendorOffering;
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

export function VendorOfferingFormModal({
  isOpen,
  onClose,
  offering,
  onSuccess,
}: Readonly<VendorOfferingFormModalProps>) {
  const mode = offering ? 'edit' : 'create';
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateVendorOfferingInput) => createVendorOffering(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueries.offerings() });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create offering');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (input: UpdateVendorOfferingInput) => updateVendorOffering(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueries.offerings() });
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

  const handleSubmit = (data: VendorOfferingFormData) => {
    setError(null);

    if (mode === 'create') {
      if (!data.vendorId || !data.serviceCategoryId) {
        setError('Vendor and service category are required');
        return;
      }

      createMutation.mutate({
        vendorId: data.vendorId,
        serviceCategoryId: data.serviceCategoryId,
        vendorServiceCode: data.vendorServiceCode || null,
        vendorServiceName: data.vendorServiceName || null,
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
        vendorServiceCode: data.vendorServiceCode || null,
        vendorServiceName: data.vendorServiceName || null,
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
      title={mode === 'create' ? 'Add Vendor Offering' : 'Edit Vendor Offering'}
      size="lg"
    >
      <VendorOfferingForm
        offering={offering}
        isSubmitting={isSubmitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        onDismissError={handleDismissError}
      />
    </Modal>
  );
}
