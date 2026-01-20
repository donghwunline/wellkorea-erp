/**
 * Service Category Form Component.
 *
 * Dual-mode form for creating and editing service categories.
 *
 * FSD Layer: features
 */

import { useCallback, useState, type FormEvent } from 'react';
import type { ServiceCategory } from '@/entities/catalog';
import { Button, FormField, ModalActions, Alert } from '@/shared/ui';

// =============================================================================
// TYPES
// =============================================================================

export interface ServiceCategoryFormData {
  name: string;
  description: string;
}

interface ServiceCategoryFormProps {
  /** Category to edit (undefined for create mode) */
  category?: ServiceCategory;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Error message to display */
  error?: string | null;
  /** Called on form submit */
  onSubmit: (data: ServiceCategoryFormData) => void;
  /** Called on cancel */
  onCancel: () => void;
  /** Called to dismiss error */
  onDismissError?: () => void;
}

interface FormErrors {
  name?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ServiceCategoryForm({
  category,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  onDismissError,
}: Readonly<ServiceCategoryFormProps>) {
  const isEditMode = !!category;

  // Form state
  const [formData, setFormData] = useState<ServiceCategoryFormData>(() => ({
    name: category?.name ?? '',
    description: category?.description ?? '',
  }));

  const [errors, setErrors] = useState<FormErrors>({});

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must not exceed 100 characters';
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
  const handleChange = (field: keyof ServiceCategoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error" onClose={onDismissError}>
          {error}
        </Alert>
      )}

      {/* Name */}
      <FormField
        label="Category Name"
        required
        error={errors.name}
      >
        <input
          type="text"
          value={formData.name}
          onChange={e => handleChange('name', e.target.value)}
          disabled={isSubmitting}
          placeholder="e.g., Laser Cutting"
          autoFocus
          className="h-10 w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 text-sm text-white placeholder-steel-500 focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      {/* Description */}
      <FormField label="Description">
        <textarea
          value={formData.description}
          onChange={e => handleChange('description', e.target.value)}
          disabled={isSubmitting}
          placeholder="Optional description of this service category"
          rows={3}
          className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

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
          {isEditMode ? 'Save Changes' : 'Create Category'}
        </Button>
      </ModalActions>
    </form>
  );
}
