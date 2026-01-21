/**
 * Vendor Material Offering Form Component.
 *
 * Dual-mode form for creating and editing vendor material offerings.
 *
 * FSD Layer: features
 */

import { type FormEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { VendorMaterialOffering } from '@/entities/material';
import { materialQueries } from '@/entities/material';
import { CompanyCombobox, RoleTypeEnum } from '@/entities/company';
import { Alert, Button, DatePicker, type DateRange, FormField, ModalActions } from '@/shared/ui';

// =============================================================================
// TYPES
// =============================================================================

export interface VendorMaterialOfferingFormData {
  vendorId: number | null;
  materialId: number | null;
  vendorMaterialCode: string;
  vendorMaterialName: string;
  unitPrice: string;
  currency: string;
  leadTimeDays: string;
  minOrderQuantity: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isPreferred: boolean;
  notes: string;
}

interface VendorMaterialOfferingFormProps {
  /** Offering to edit (undefined for create mode) */
  offering?: VendorMaterialOffering;
  /** Default material ID for create mode (pre-populate and lock the field) */
  defaultMaterialId?: number;
  /** Default material name for display when defaultMaterialId is provided */
  defaultMaterialName?: string;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Error message to display */
  error?: string | null;
  /** Called on form submit */
  onSubmit: (data: VendorMaterialOfferingFormData) => void;
  /** Called on cancel */
  onCancel: () => void;
  /** Called to dismiss error */
  onDismissError?: () => void;
}

interface FormErrors {
  vendorId?: string;
  materialId?: string;
  vendorMaterialCode?: string;
  vendorMaterialName?: string;
  unitPrice?: string;
  currency?: string;
  leadTimeDays?: string;
  minOrderQuantity?: string;
  effectiveFrom?: string;
  notes?: string;
}

// =============================================================================
// HELPER
// =============================================================================

const inputClassName =
  'h-10 w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 text-sm text-white placeholder-steel-500 focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50';

const selectClassName =
  'h-10 w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 text-sm text-white focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50';

const textareaClassName =
  'w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder-steel-500 focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50';

// =============================================================================
// COMPONENT
// =============================================================================

export function VendorMaterialOfferingForm({
  offering,
  defaultMaterialId,
  defaultMaterialName,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  onDismissError,
}: Readonly<VendorMaterialOfferingFormProps>) {
  const { t } = useTranslation(['items', 'common']);
  const isEditMode = !!offering;
  const isMaterialLocked = isEditMode || !!defaultMaterialId;

  // Fetch materials for dropdown (only needed if material is not locked)
  const { data: materials = [] } = useQuery({
    ...materialQueries.allMaterials(),
    enabled: !isMaterialLocked,
  });

  // Form state
  const [formData, setFormData] = useState<VendorMaterialOfferingFormData>(() => ({
    vendorId: offering?.vendorId ?? null,
    materialId: offering?.materialId ?? defaultMaterialId ?? null,
    vendorMaterialCode: offering?.vendorMaterialCode ?? '',
    vendorMaterialName: offering?.vendorMaterialName ?? '',
    unitPrice: offering?.unitPrice?.toString() ?? '',
    currency: offering?.currency ?? 'KRW',
    leadTimeDays: offering?.leadTimeDays?.toString() ?? '',
    minOrderQuantity: offering?.minOrderQuantity?.toString() ?? '',
    effectiveFrom: offering?.effectiveFrom ?? null,
    effectiveTo: offering?.effectiveTo ?? null,
    isPreferred: offering?.isPreferred ?? false,
    notes: offering?.notes ?? '',
  }));

  const [errors, setErrors] = useState<FormErrors>({});

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.vendorId) {
      newErrors.vendorId = t('items:vendorMaterialOfferingForm.validation.vendorRequired');
    }

    if (!formData.materialId) {
      newErrors.materialId = t('items:vendorMaterialOfferingForm.validation.materialRequired');
    }

    // vendorMaterialCode max 50 chars
    if (formData.vendorMaterialCode && formData.vendorMaterialCode.length > 50) {
      newErrors.vendorMaterialCode = t('items:vendorMaterialOfferingForm.validation.vendorMaterialCodeTooLong');
    }

    // vendorMaterialName max 200 chars
    if (formData.vendorMaterialName && formData.vendorMaterialName.length > 200) {
      newErrors.vendorMaterialName = t('items:vendorMaterialOfferingForm.validation.vendorMaterialNameTooLong');
    }

    if (formData.unitPrice && Number(formData.unitPrice) < 0) {
      newErrors.unitPrice = t('items:vendorMaterialOfferingForm.validation.priceNegative');
    }

    // currency max 3 chars
    if (formData.currency && formData.currency.length > 3) {
      newErrors.currency = t('items:vendorMaterialOfferingForm.validation.currencyTooLong');
    }

    if (formData.leadTimeDays && Number(formData.leadTimeDays) < 0) {
      newErrors.leadTimeDays = t('items:vendorMaterialOfferingForm.validation.leadTimeNegative');
    }

    if (formData.minOrderQuantity && Number(formData.minOrderQuantity) < 0) {
      newErrors.minOrderQuantity = t('items:vendorMaterialOfferingForm.validation.minQuantityNegative');
    }

    if (formData.effectiveFrom && formData.effectiveTo) {
      if (formData.effectiveFrom > formData.effectiveTo) {
        newErrors.effectiveFrom = t('items:vendorMaterialOfferingForm.validation.dateRangeInvalid');
      }
    }

    // notes max 1000 chars
    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = t('items:vendorMaterialOfferingForm.validation.notesTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Handle submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  // Handle field change
  const handleChange = <K extends keyof VendorMaterialOfferingFormData>(
    field: K,
    value: VendorMaterialOfferingFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | string) => {
    if (typeof range === 'string') return;
    setFormData(prev => ({
      ...prev,
      effectiveFrom: range.start,
      effectiveTo: range.end,
    }));
    if (errors.effectiveFrom) {
      setErrors(prev => ({ ...prev, effectiveFrom: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error" onClose={onDismissError}>
          {error}
        </Alert>
      )}

      {/* Row 1: Vendor & Material */}
      <div className="grid grid-cols-2 gap-4">
        {/* Vendor */}
        <FormField label={t('items:vendorMaterialOfferingForm.vendor')} required error={errors.vendorId}>
          <CompanyCombobox
            value={formData.vendorId}
            onChange={id => handleChange('vendorId', id)}
            roleType={RoleTypeEnum.VENDOR}
            placeholder={t('items:vendorMaterialOfferingForm.placeholders.searchVendors')}
            initialLabel={offering?.vendorName}
            disabled={isSubmitting || isEditMode}
          />
        </FormField>

        {/* Material */}
        <FormField label={t('items:vendorMaterialOfferingForm.material')} required error={errors.materialId}>
          {isMaterialLocked ? (
            <input
              type="text"
              value={offering?.materialName ?? defaultMaterialName ?? ''}
              disabled
              className={inputClassName}
            />
          ) : (
            <select
              value={formData.materialId ?? ''}
              onChange={e =>
                handleChange('materialId', e.target.value ? Number(e.target.value) : null)
              }
              disabled={isSubmitting}
              required
              className={selectClassName}
            >
              <option value="">{t('items:vendorMaterialOfferingForm.placeholders.selectMaterial')}</option>
              {materials.map(mat => (
                <option key={mat.id} value={mat.id}>
                  {mat.sku} - {mat.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      {/* Row 2: Vendor Material Code & Name */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('items:vendorMaterialOfferingForm.vendorMaterialCode')} error={errors.vendorMaterialCode}>
          <input
            type="text"
            value={formData.vendorMaterialCode}
            onChange={e => handleChange('vendorMaterialCode', e.target.value)}
            disabled={isSubmitting}
            placeholder={t('items:vendorMaterialOfferingForm.placeholders.vendorMaterialCode')}
            maxLength={50}
            className={inputClassName}
          />
        </FormField>

        <FormField label={t('items:vendorMaterialOfferingForm.vendorMaterialName')} error={errors.vendorMaterialName}>
          <input
            type="text"
            value={formData.vendorMaterialName}
            onChange={e => handleChange('vendorMaterialName', e.target.value)}
            disabled={isSubmitting}
            placeholder={t('items:vendorMaterialOfferingForm.placeholders.vendorMaterialName')}
            maxLength={200}
            className={inputClassName}
          />
        </FormField>
      </div>

      {/* Row 3: Price & Currency */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('items:vendorMaterialOfferingForm.unitPrice')} error={errors.unitPrice}>
          <input
            type="number"
            value={formData.unitPrice}
            onChange={e => handleChange('unitPrice', e.target.value)}
            disabled={isSubmitting}
            placeholder="0"
            min="0"
            step="1"
            className={inputClassName}
          />
        </FormField>

        <FormField label={t('items:vendorMaterialOfferingForm.currency')} error={errors.currency}>
          <select
            value={formData.currency}
            onChange={e => handleChange('currency', e.target.value)}
            disabled={isSubmitting}
            className={selectClassName}
          >
            <option value="KRW">{t('items:currencies.KRW')}</option>
            <option value="USD">{t('items:currencies.USD')}</option>
            <option value="EUR">{t('items:currencies.EUR')}</option>
            <option value="JPY">{t('items:currencies.JPY')}</option>
            <option value="CNY">{t('items:currencies.CNY')}</option>
          </select>
        </FormField>
      </div>

      {/* Row 4: Lead Time & Min Order */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('items:vendorMaterialOfferingForm.leadTimeDays')} error={errors.leadTimeDays}>
          <input
            type="number"
            value={formData.leadTimeDays}
            onChange={e => handleChange('leadTimeDays', e.target.value)}
            disabled={isSubmitting}
            placeholder="0"
            min="0"
            className={inputClassName}
          />
        </FormField>

        <FormField label={t('items:vendorMaterialOfferingForm.minOrderQuantity')} error={errors.minOrderQuantity}>
          <input
            type="number"
            value={formData.minOrderQuantity}
            onChange={e => handleChange('minOrderQuantity', e.target.value)}
            disabled={isSubmitting}
            placeholder="0"
            min="0"
            className={inputClassName}
          />
        </FormField>
      </div>

      {/* Row 5: Effective Date Range */}
      <FormField label={t('items:vendorMaterialOfferingForm.effectivePeriod')} error={errors.effectiveFrom}>
        <DatePicker
          mode="range"
          value={{ start: formData.effectiveFrom, end: formData.effectiveTo }}
          onChange={handleDateRangeChange}
          disabled={isSubmitting}
          placeholder={t('items:vendorMaterialOfferingForm.placeholders.selectDateRange')}
        />
      </FormField>

      {/* Row 6: Preferred checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPreferred"
          checked={formData.isPreferred}
          onChange={e => handleChange('isPreferred', e.target.checked)}
          disabled={isSubmitting}
          className="h-4 w-4 rounded border-steel-700 bg-steel-900 text-copper-500 focus:ring-copper-500/20 focus:ring-offset-0"
        />
        <label htmlFor="isPreferred" className="text-sm text-steel-300">
          {t('items:vendorMaterialOfferingForm.isPreferred')}
        </label>
      </div>

      {/* Notes */}
      <FormField label={t('items:vendorMaterialOfferingForm.notes')} error={errors.notes}>
        <textarea
          value={formData.notes}
          onChange={e => handleChange('notes', e.target.value)}
          disabled={isSubmitting}
          placeholder={t('items:vendorMaterialOfferingForm.placeholders.notes')}
          rows={3}
          maxLength={1000}
          className={textareaClassName}
        />
      </FormField>

      <ModalActions>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common:buttons.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditMode ? t('items:vendorMaterialOfferingForm.saveChanges') : t('items:vendorMaterialOfferingForm.createOffering')}
        </Button>
      </ModalActions>
    </form>
  );
}
