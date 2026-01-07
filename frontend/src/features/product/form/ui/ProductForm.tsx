/**
 * Product Form Component
 *
 * Reusable form for creating and editing products.
 * Includes product type selection dropdown.
 *
 * FSD Layer: features
 * - Contains form logic and validation
 * - Uses entity types for form data
 */

import { type FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, ErrorAlert, FormField } from '@/shared/ui';
import type { Product, ProductType } from '@/entities/product';
import { productQueries } from '@/entities/product';

export interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  productTypeId: number | null;
  baseUnitPrice: string; // String for easier input handling
  unit: string;
}

export interface ProductFormProps {
  /** Form mode: 'create' or 'edit' */
  mode: 'create' | 'edit';
  /** Initial data for edit mode */
  initialData?: Product | null;
  /** Called when form is submitted */
  onSubmit: (data: ProductFormData) => Promise<void>;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** External error message */
  error?: string | null;
  /** Called when error is dismissed */
  onDismissError?: () => void;
}

/**
 * Product form for create and edit operations.
 */
export function ProductForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  onDismissError,
}: Readonly<ProductFormProps>) {
  // Fetch product types for dropdown
  const { data: productTypes = [], isLoading: typesLoading } = useQuery(
    productQueries.allTypes()
  );

  // Form state - initialize from initialData if editing
  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (mode === 'edit' && initialData) {
      return {
        sku: initialData.sku,
        name: initialData.name,
        description: initialData.description || '',
        productTypeId: initialData.productTypeId,
        baseUnitPrice: initialData.baseUnitPrice?.toString() || '',
        unit: initialData.unit || 'EA',
      };
    }
    return {
      sku: '',
      name: '',
      description: '',
      productTypeId: null,
      baseUnitPrice: '',
      unit: 'EA',
    };
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // Validation helpers
  const skuTrimmed = formData.sku.trim();
  const nameTrimmed = formData.name.trim();
  const hasWhitespaceOnlySku = formData.sku.length > 0 && skuTrimmed.length === 0;
  const hasWhitespaceOnlyName = formData.name.length > 0 && nameTrimmed.length === 0;

  // Validate price if entered
  const priceNum = formData.baseUnitPrice ? parseFloat(formData.baseUnitPrice) : null;
  const hasInvalidPrice = formData.baseUnitPrice && (isNaN(priceNum!) || priceNum! < 0);

  // Check if form is valid
  const isValid =
    skuTrimmed.length > 0 &&
    nameTrimmed.length > 0 &&
    formData.productTypeId !== null &&
    !hasInvalidPrice;

  // Validation error messages
  const validationErrors = {
    sku: hasWhitespaceOnlySku ? 'SKU cannot be whitespace only' : undefined,
    name: hasWhitespaceOnlyName ? 'Name cannot be whitespace only' : undefined,
    baseUnitPrice: hasInvalidPrice ? 'Price must be a positive number' : undefined,
  };

  // Select styling class
  const selectClass =
    'w-full rounded-lg border border-steel-700/50 bg-steel-800/60 px-3 py-2 text-sm text-white focus:border-copper-500 focus:outline-none disabled:opacity-50';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={onDismissError} />}

      {/* Basic Information */}
      <div>
        <h3 className="mb-4 border-b border-steel-800 pb-2 text-sm font-medium text-steel-400">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="SKU (품목코드)"
            value={formData.sku}
            onChange={value => setFormData(prev => ({ ...prev, sku: value }))}
            required
            disabled={isSubmitting || mode === 'edit'} // SKU cannot be changed in edit mode
            error={validationErrors.sku}
            placeholder="e.g., PRD-001"
          />
          <FormField
            label="Name (품목명)"
            value={formData.name}
            onChange={value => setFormData(prev => ({ ...prev, name: value }))}
            required
            disabled={isSubmitting}
            error={validationErrors.name}
            placeholder="Enter product name"
          />
        </div>
      </div>

      {/* Type and Pricing */}
      <div>
        <h3 className="mb-4 border-b border-steel-800 pb-2 text-sm font-medium text-steel-400">
          Type and Pricing
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-steel-300">
              Product Type <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.productTypeId || ''}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  productTypeId: e.target.value ? parseInt(e.target.value, 10) : null,
                }))
              }
              disabled={isSubmitting || typesLoading}
              className={selectClass}
            >
              <option value="">Select product type</option>
              {productTypes.map((type: ProductType) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-steel-300">Unit</label>
            <select
              value={formData.unit}
              onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              disabled={isSubmitting}
              className={selectClass}
            >
              <option value="EA">EA (Each)</option>
              <option value="SET">SET</option>
              <option value="BOX">BOX</option>
              <option value="KG">KG</option>
              <option value="M">M (Meter)</option>
            </select>
          </div>
          <FormField
            label="Base Unit Price (단가)"
            type="number"
            value={formData.baseUnitPrice}
            onChange={value => setFormData(prev => ({ ...prev, baseUnitPrice: value }))}
            disabled={isSubmitting}
            error={validationErrors.baseUnitPrice}
            placeholder="e.g., 10000"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="mb-4 border-b border-steel-800 pb-2 text-sm font-medium text-steel-400">
          Description
        </h3>
        <FormField
          label="Description"
          value={formData.description}
          onChange={value => setFormData(prev => ({ ...prev, description: value }))}
          disabled={isSubmitting}
          placeholder="Product description (optional)"
          multiline
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 border-t border-steel-800 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || isSubmitting} isLoading={isSubmitting}>
          {mode === 'create' ? 'Create Product' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
