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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['items', 'common']);
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
    sku: hasWhitespaceOnlySku ? t('productForm.validation.skuWhitespace') : undefined,
    name: hasWhitespaceOnlyName ? t('productForm.validation.nameWhitespace') : undefined,
    baseUnitPrice: hasInvalidPrice ? t('productForm.validation.pricePositive') : undefined,
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
          {t('common:sections.basicInfo')}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label={t('productForm.sku')}
            value={formData.sku}
            onChange={value => setFormData(prev => ({ ...prev, sku: value }))}
            required
            disabled={isSubmitting || mode === 'edit'} // SKU cannot be changed in edit mode
            error={validationErrors.sku}
            placeholder={t('productForm.placeholders.sku')}
          />
          <FormField
            label={t('productForm.name')}
            value={formData.name}
            onChange={value => setFormData(prev => ({ ...prev, name: value }))}
            required
            disabled={isSubmitting}
            error={validationErrors.name}
            placeholder={t('productForm.placeholders.name')}
          />
        </div>
      </div>

      {/* Type and Pricing */}
      <div>
        <h3 className="mb-4 border-b border-steel-800 pb-2 text-sm font-medium text-steel-400">
          {t('common:sections.typeAndPricing')}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-steel-300">
              {t('productForm.productType')} <span className="text-red-400">*</span>
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
              <option value="">{t('productForm.selectProductType')}</option>
              {productTypes.map((type: ProductType) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-steel-300">{t('productForm.unit')}</label>
            <select
              value={formData.unit}
              onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              disabled={isSubmitting}
              className={selectClass}
            >
              <option value="EA">{t('productForm.units.EA')}</option>
              <option value="SET">{t('productForm.units.SET')}</option>
              <option value="BOX">{t('productForm.units.BOX')}</option>
              <option value="KG">{t('productForm.units.KG')}</option>
              <option value="M">{t('productForm.units.M')}</option>
            </select>
          </div>
          <FormField
            label={t('productForm.baseUnitPrice')}
            type="number"
            value={formData.baseUnitPrice}
            onChange={value => setFormData(prev => ({ ...prev, baseUnitPrice: value }))}
            disabled={isSubmitting}
            error={validationErrors.baseUnitPrice}
            placeholder={t('productForm.placeholders.baseUnitPrice')}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="mb-4 border-b border-steel-800 pb-2 text-sm font-medium text-steel-400">
          {t('common:sections.description')}
        </h3>
        <FormField label={t('productForm.description')}>
          <textarea
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            disabled={isSubmitting}
            placeholder={t('productForm.descriptionPlaceholder')}
            rows={3}
            className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder-steel-500 transition-colors focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 border-t border-steel-800 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          {t('common:buttons.cancel')}
        </Button>
        <Button type="submit" disabled={!isValid || isSubmitting} isLoading={isSubmitting}>
          {mode === 'create' ? t('productForm.createProduct') : t('productForm.saveChanges')}
        </Button>
      </div>
    </form>
  );
}
