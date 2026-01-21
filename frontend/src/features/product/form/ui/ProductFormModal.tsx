/**
 * Product Form Modal Component
 *
 * Modal wrapper for ProductForm.
 * Handles create and edit modes with appropriate mutations.
 *
 * FSD Layer: features
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/ui';
import type { Product } from '@/entities/product';
import { useCreateProduct } from '../../create';
import { useUpdateProduct } from '../../update';
import { ProductForm, type ProductFormData } from './ProductForm';

export interface ProductFormModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Product to edit (null for create mode) */
  product?: Product | null;
  /** Called after successful create/update */
  onSuccess?: () => void;
}

/**
 * Modal for creating or editing a product.
 */
export function ProductFormModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: Readonly<ProductFormModalProps>) {
  const { t } = useTranslation(['items', 'common']);
  const mode = product ? 'edit' : 'create';
  const [error, setError] = useState<string | null>(null);

  // Mutations
  const createMutation = useCreateProduct({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || t('items:productFormModal.createError'));
    },
  });

  const updateMutation = useUpdateProduct({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || t('items:productFormModal.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data: ProductFormData) => {
    setError(null);

    const price = data.baseUnitPrice ? parseFloat(data.baseUnitPrice) : undefined;

    if (mode === 'create') {
      createMutation.mutate({
        sku: data.sku.trim(),
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        productTypeId: data.productTypeId!,
        baseUnitPrice: price,
        unit: data.unit,
      });
    } else if (product) {
      updateMutation.mutate({
        id: product.id,
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        productTypeId: data.productTypeId!,
        baseUnitPrice: price,
        unit: data.unit,
      });
    }
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  const handleDismissError = () => {
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={mode === 'create' ? t('items:productFormModal.addTitle') : t('items:productFormModal.editTitle')}
      size="lg"
    >
      <ProductForm
        mode={mode}
        initialData={product}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        error={error}
        onDismissError={handleDismissError}
      />
    </Modal>
  );
}
