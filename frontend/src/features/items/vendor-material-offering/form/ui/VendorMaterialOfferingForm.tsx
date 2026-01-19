/**
 * Vendor Material Offering Form Component.
 *
 * Dual-mode form for creating and editing vendor material offerings.
 *
 * FSD Layer: features
 */

import { useCallback, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { VendorMaterialOffering } from '@/entities/material';
import { materialQueries } from '@/entities/material';
import { CompanyCombobox, RoleTypeEnum } from '@/entities/company';
import { Button, FormField, ModalActions, Alert, DatePicker, type DateRange } from '@/shared/ui';

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

export function VendorMaterialOfferingForm({
  offering,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  onDismissError,
}: Readonly<VendorMaterialOfferingFormProps>) {
  const isEditMode = !!offering;

  // Fetch materials for dropdown
  const { data: materials = [] } = useQuery(materialQueries.allMaterials());

  // Form state
  const [formData, setFormData] = useState<VendorMaterialOfferingFormData>(() => ({
    vendorId: offering?.vendorId ?? null,
    materialId: offering?.materialId ?? null,
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
      newErrors.vendorId = 'Vendor is required';
    }

    if (!formData.materialId) {
      newErrors.materialId = 'Material is required';
    }

    if (formData.unitPrice && Number(formData.unitPrice) < 0) {
      newErrors.unitPrice = 'Unit price cannot be negative';
    }

    if (formData.leadTimeDays && Number(formData.leadTimeDays) < 0) {
      newErrors.leadTimeDays = 'Lead time cannot be negative';
    }

    if (formData.minOrderQuantity && Number(formData.minOrderQuantity) < 0) {
      newErrors.minOrderQuantity = 'Minimum quantity cannot be negative';
    }

    if (formData.effectiveFrom && formData.effectiveTo) {
      if (formData.effectiveFrom > formData.effectiveTo) {
        newErrors.effectiveFrom = 'Start date must be before end date';
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
        <Alert variant="error" onDismiss={onDismissError}>
          {error}
        </Alert>
      )}

      {/* Row 1: Vendor & Material */}
      <div className="grid grid-cols-2 gap-4">
        {/* Vendor */}
        <FormField label="Vendor" required error={errors.vendorId}>
          <CompanyCombobox
            value={formData.vendorId}
            onChange={id => handleChange('vendorId', id)}
            roleType={RoleTypeEnum.VENDOR}
            placeholder="Search vendors..."
            initialLabel={offering?.vendorName}
            disabled={isSubmitting || isEditMode}
          />
        </FormField>

        {/* Material */}
        <FormField label="Material" required error={errors.materialId}>
          <select
            value={formData.materialId ?? ''}
            onChange={e => handleChange('materialId', e.target.value ? Number(e.target.value) : null)}
            disabled={isSubmitting || isEditMode}
            className={selectClassName}
          >
            <option value="">Select material...</option>
            {materials.map(mat => (
              <option key={mat.id} value={mat.id}>
                {mat.sku} - {mat.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Row 2: Vendor Material Code & Name */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Vendor Material Code">
          <input
            type="text"
            value={formData.vendorMaterialCode}
            onChange={e => handleChange('vendorMaterialCode', e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., VM-001"
            className={inputClassName}
          />
        </FormField>

        <FormField label="Vendor Material Name">
          <input
            type="text"
            value={formData.vendorMaterialName}
            onChange={e => handleChange('vendorMaterialName', e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., Premium Steel Plate"
            className={inputClassName}
          />
        </FormField>
      </div>

      {/* Row 3: Price & Currency */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Unit Price" error={errors.unitPrice}>
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

        <FormField label="Currency">
          <select
            value={formData.currency}
            onChange={e => handleChange('currency', e.target.value)}
            disabled={isSubmitting}
            className={selectClassName}
          >
            <option value="KRW">KRW (₩)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="JPY">JPY (¥)</option>
            <option value="CNY">CNY (¥)</option>
          </select>
        </FormField>
      </div>

      {/* Row 4: Lead Time & Min Order */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Lead Time (days)" error={errors.leadTimeDays}>
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

        <FormField label="Min Order Quantity" error={errors.minOrderQuantity}>
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
      <FormField label="Effective Period" error={errors.effectiveFrom}>
        <DatePicker
          mode="range"
          value={{ start: formData.effectiveFrom, end: formData.effectiveTo }}
          onChange={handleDateRangeChange}
          disabled={isSubmitting}
          placeholder="Select date range..."
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
          Mark as preferred vendor for this material
        </label>
      </div>

      {/* Notes */}
      <FormField label="Notes">
        <textarea
          value={formData.notes}
          onChange={e => handleChange('notes', e.target.value)}
          disabled={isSubmitting}
          placeholder="Optional notes about this offering"
          rows={3}
          className={textareaClassName}
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
          {isEditMode ? 'Save Changes' : 'Create Offering'}
        </Button>
      </ModalActions>
    </form>
  );
}
