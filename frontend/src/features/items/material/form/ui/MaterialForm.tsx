/**
 * Material Form Component.
 *
 * Dual-mode form for creating and editing materials.
 * Handles local validation and delegates submission to parent.
 *
 * FSD Layer: features
 */

import { useCallback, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Material } from '@/entities/material';
import { materialQueries } from '@/entities/material';
import { Button, FormField, ModalActions, Alert } from '@/shared/ui';

// =============================================================================
// TYPES
// =============================================================================

export interface MaterialFormData {
  sku: string;
  name: string;
  description: string;
  categoryId: number | null;
  unit: string;
  standardPrice: string;
  preferredVendorId: number | null;
}

interface MaterialFormProps {
  /** Material to edit (undefined for create mode) */
  material?: Material;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Error message to display */
  error?: string | null;
  /** Called on form submit */
  onSubmit: (data: MaterialFormData) => void;
  /** Called on cancel */
  onCancel: () => void;
  /** Called to dismiss error */
  onDismissError?: () => void;
}

interface FormErrors {
  sku?: string;
  name?: string;
  categoryId?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MaterialForm({
  material,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  onDismissError,
}: Readonly<MaterialFormProps>) {
  const isEditMode = !!material;

  // Form state
  const [formData, setFormData] = useState<MaterialFormData>(() => ({
    sku: material?.sku ?? '',
    name: material?.name ?? '',
    description: material?.description ?? '',
    categoryId: material?.categoryId ?? null,
    unit: material?.unit ?? 'EA',
    standardPrice: material?.standardPrice?.toString() ?? '',
    preferredVendorId: material?.preferredVendorId ?? null,
  }));

  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery(materialQueries.categoryList());

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    } else if (formData.sku.trim().length > 50) {
      newErrors.sku = 'SKU must not exceed 50 characters';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  // Handle field change
  const handleChange = (field: keyof MaterialFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error" onDismiss={onDismissError}>
          {error}
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* SKU - only editable in create mode */}
        <FormField
          label="SKU"
          required
          error={errors.sku}
        >
          <input
            type="text"
            value={formData.sku}
            onChange={e => handleChange('sku', e.target.value)}
            disabled={isEditMode || isSubmitting}
            placeholder="e.g., BOLT-M8X20"
            className="h-10 w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 text-sm text-white placeholder-steel-500 focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>

        {/* Name */}
        <FormField
          label="Name"
          required
          error={errors.name}
        >
          <input
            type="text"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            disabled={isSubmitting}
            placeholder="Material name"
            className="h-10 w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 text-sm text-white placeholder-steel-500 focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>
      </div>

      {/* Category */}
      <FormField
        label="Category"
        required
        error={errors.categoryId}
      >
        <select
          value={formData.categoryId ?? ''}
          onChange={e => handleChange('categoryId', e.target.value ? Number(e.target.value) : null)}
          disabled={isSubmitting}
          className="h-10 w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 text-sm text-white focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" className="bg-steel-800">Select a category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id} className="bg-steel-800">
              {category.name}
            </option>
          ))}
        </select>
      </FormField>

      {/* Description */}
      <FormField label="Description">
        <textarea
          value={formData.description}
          onChange={e => handleChange('description', e.target.value)}
          disabled={isSubmitting}
          placeholder="Optional description"
          rows={3}
          className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Unit */}
        <FormField label="Unit">
          <input
            type="text"
            value={formData.unit}
            onChange={e => handleChange('unit', e.target.value)}
            disabled={isSubmitting}
            placeholder="EA"
            className="h-10 w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 text-sm text-white placeholder-steel-500 focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>

        {/* Standard Price */}
        <FormField label="Standard Price">
          <input
            type="number"
            value={formData.standardPrice}
            onChange={e => handleChange('standardPrice', e.target.value)}
            disabled={isSubmitting}
            placeholder="0"
            min="0"
            step="0.01"
            className="h-10 w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 text-sm text-white placeholder-steel-500 focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>
      </div>

      <ModalActions>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
        >
          {isEditMode ? 'Save Changes' : 'Create Material'}
        </Button>
      </ModalActions>
    </form>
  );
}
