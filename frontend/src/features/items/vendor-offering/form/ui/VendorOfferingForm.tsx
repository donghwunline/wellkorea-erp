/**
 * Vendor Offering Form Component.
 *
 * Dual-mode form for creating and editing vendor service offerings.
 *
 * FSD Layer: features
 */

import { type FormEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { VendorOffering } from '@/entities/catalog';
import { catalogQueries } from '@/entities/catalog';
import { CompanyCombobox, RoleTypeEnum } from '@/entities/company';
import { Alert, Button, DatePicker, type DateRange, FormField, ModalActions } from '@/shared/ui';

// =============================================================================
// TYPES
// =============================================================================

export interface VendorOfferingFormData {
  vendorId: number | null;
  serviceCategoryId: number | null;
  vendorServiceCode: string;
  vendorServiceName: string;
  unitPrice: string;
  currency: string;
  leadTimeDays: string;
  minOrderQuantity: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isPreferred: boolean;
  notes: string;
}

interface VendorOfferingFormProps {
  /** Offering to edit (undefined for create mode) */
  offering?: VendorOffering;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Error message to display */
  error?: string | null;
  /** Called on form submit */
  onSubmit: (data: VendorOfferingFormData) => void;
  /** Called on cancel */
  onCancel: () => void;
  /** Called to dismiss error */
  onDismissError?: () => void;
}

interface FormErrors {
  vendorId?: string;
  serviceCategoryId?: string;
  unitPrice?: string;
  leadTimeDays?: string;
  minOrderQuantity?: string;
  effectiveFrom?: string;
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

export function VendorOfferingForm({
  offering,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  onDismissError,
}: Readonly<VendorOfferingFormProps>) {
  const { t } = useTranslation(['items', 'common']);
  const isEditMode = !!offering;

  // Fetch service categories for dropdown
  const { data: serviceCategories = [] } = useQuery(catalogQueries.allCategories());

  // Form state
  const [formData, setFormData] = useState<VendorOfferingFormData>(() => ({
    vendorId: offering?.vendorId ?? null,
    serviceCategoryId: offering?.serviceCategoryId ?? null,
    vendorServiceCode: offering?.vendorServiceCode ?? '',
    vendorServiceName: offering?.vendorServiceName ?? '',
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
      newErrors.vendorId = t('items:vendorOfferingForm.validation.vendorRequired');
    }

    if (!formData.serviceCategoryId) {
      newErrors.serviceCategoryId = t('items:vendorOfferingForm.validation.categoryRequired');
    }

    if (formData.unitPrice && Number(formData.unitPrice) < 0) {
      newErrors.unitPrice = t('items:vendorOfferingForm.validation.priceNegative');
    }

    if (formData.leadTimeDays && Number(formData.leadTimeDays) < 0) {
      newErrors.leadTimeDays = t('items:vendorOfferingForm.validation.leadTimeNegative');
    }

    if (formData.minOrderQuantity && Number(formData.minOrderQuantity) < 0) {
      newErrors.minOrderQuantity = t('items:vendorOfferingForm.validation.minQuantityNegative');
    }

    if (formData.effectiveFrom && formData.effectiveTo) {
      if (formData.effectiveFrom > formData.effectiveTo) {
        newErrors.effectiveFrom = t('items:vendorOfferingForm.validation.dateRangeInvalid');
      }
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
  const handleChange = <K extends keyof VendorOfferingFormData>(
    field: K,
    value: VendorOfferingFormData[K]
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

      {/* Row 1: Vendor & Service Category */}
      <div className="grid grid-cols-2 gap-4">
        {/* Vendor */}
        <FormField label={t('items:vendorOfferingForm.vendor')} required error={errors.vendorId}>
          <CompanyCombobox
            value={formData.vendorId}
            onChange={id => handleChange('vendorId', id)}
            roleType={RoleTypeEnum.OUTSOURCE}
            placeholder={t('items:vendorOfferingForm.placeholders.searchVendors')}
            initialLabel={offering?.vendorName}
            disabled={isSubmitting || isEditMode}
          />
        </FormField>

        {/* Service Category */}
        <FormField label={t('items:vendorOfferingForm.serviceCategory')} required error={errors.serviceCategoryId}>
          <select
            value={formData.serviceCategoryId ?? ''}
            onChange={e =>
              handleChange('serviceCategoryId', e.target.value ? Number(e.target.value) : null)
            }
            disabled={isSubmitting || isEditMode}
            className={selectClassName}
          >
            <option value="">{t('items:vendorOfferingForm.placeholders.selectCategory')}</option>
            {serviceCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Row 2: Vendor Service Code & Name */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('items:vendorOfferingForm.vendorServiceCode')}>
          <input
            type="text"
            value={formData.vendorServiceCode}
            onChange={e => handleChange('vendorServiceCode', e.target.value)}
            disabled={isSubmitting}
            placeholder={t('items:vendorOfferingForm.placeholders.vendorServiceCode')}
            className={inputClassName}
          />
        </FormField>

        <FormField label={t('items:vendorOfferingForm.vendorServiceName')}>
          <input
            type="text"
            value={formData.vendorServiceName}
            onChange={e => handleChange('vendorServiceName', e.target.value)}
            disabled={isSubmitting}
            placeholder={t('items:vendorOfferingForm.placeholders.vendorServiceName')}
            className={inputClassName}
          />
        </FormField>
      </div>

      {/* Row 3: Price & Currency */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('items:vendorOfferingForm.unitPrice')} error={errors.unitPrice}>
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

        <FormField label={t('items:vendorOfferingForm.currency')}>
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
        <FormField label={t('items:vendorOfferingForm.leadTimeDays')} error={errors.leadTimeDays}>
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

        <FormField label={t('items:vendorOfferingForm.minOrderQuantity')} error={errors.minOrderQuantity}>
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
      <FormField label={t('items:vendorOfferingForm.effectivePeriod')} error={errors.effectiveFrom}>
        <DatePicker
          mode="range"
          value={{ start: formData.effectiveFrom, end: formData.effectiveTo }}
          onChange={handleDateRangeChange}
          disabled={isSubmitting}
          placeholder={t('items:vendorOfferingForm.placeholders.selectDateRange')}
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
          {t('items:vendorOfferingForm.isPreferred')}
        </label>
      </div>

      {/* Notes */}
      <FormField label={t('items:vendorOfferingForm.notes')}>
        <textarea
          value={formData.notes}
          onChange={e => handleChange('notes', e.target.value)}
          disabled={isSubmitting}
          placeholder={t('items:vendorOfferingForm.placeholders.notes')}
          rows={3}
          className={textareaClassName}
        />
      </FormField>

      <ModalActions>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common:buttons.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditMode ? t('items:vendorOfferingForm.saveChanges') : t('items:vendorOfferingForm.createOffering')}
        </Button>
      </ModalActions>
    </form>
  );
}
