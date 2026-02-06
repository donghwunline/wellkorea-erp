/**
 * Quotation Form Component.
 *
 * Feature-layer form component for creating and editing quotations.
 * Handles form state, validation, and delegates submission to parent.
 *
 * Features Layer: Quotation form workflow
 * - Contains form state management
 * - Uses ProductSelector from line-items feature
 * - Delegates mutations to parent via callbacks
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateQuotationInput, LineItemInput, Quotation, UpdateQuotationInput } from '@/entities/quotation';
import { type ProductLineItem, ProductSelector } from '../../line-items';
import { Alert, Button, Card, FormField, Input, Spinner } from '@/shared/ui';

/**
 * Props for QuotationForm.
 */
export interface QuotationFormProps {
  /**
   * Existing quotation for edit mode.
   * If undefined, form is in create mode.
   */
  quotation?: Quotation;

  /**
   * Project ID for new quotations (required in create mode).
   */
  projectId?: number;

  /**
   * Project name for display.
   */
  projectName?: string;

  /**
   * Whether the form is submitting.
   * @default false
   */
  isSubmitting?: boolean;

  /**
   * Error message to display.
   */
  error?: string | null;

  /**
   * Called when form is submitted in create mode.
   */
  onCreateSubmit?: (data: CreateQuotationInput) => void;

  /**
   * Called when form is submitted in edit mode.
   */
  onUpdateSubmit?: (data: UpdateQuotationInput) => void;

  /**
   * Called when user cancels.
   */
  onCancel: () => void;
}

interface FormState {
  validityDays: number;
  taxRate: number;
  discountAmount: number;
  notes: string;
  lineItems: ProductLineItem[];
}

/**
 * Form for creating and editing quotations.
 *
 * @example
 * ```tsx
 * // Create mode
 * <QuotationForm
 *   projectId={project.id}
 *   projectName={project.name}
 *   isSubmitting={isPending}
 *   onCreateSubmit={handleCreate}
 *   onCancel={handleCancel}
 * />
 *
 * // Edit mode
 * <QuotationForm
 *   quotation={quotation}
 *   isSubmitting={isPending}
 *   onUpdateSubmit={handleUpdate}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function QuotationForm({
  quotation,
  projectId,
  projectName,
  isSubmitting = false,
  error,
  onCreateSubmit,
  onUpdateSubmit,
  onCancel,
}: Readonly<QuotationFormProps>) {
  const { t } = useTranslation(['quotations', 'common']);
  const isEditMode = !!quotation;

  // Initialize form state
  const [formState, setFormState] = useState<FormState>(() => {
    if (quotation) {
      return {
        validityDays: quotation.validityDays,
        taxRate: quotation.taxRate,
        discountAmount: quotation.discountAmount,
        notes: quotation.notes || '',
        lineItems:
          quotation.lineItems?.map(item => ({
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes || undefined,
          })) || [],
      };
    }
    return {
      validityDays: 30,
      taxRate: 10,
      discountAmount: 0,
      notes: '',
      lineItems: [],
    };
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Update field
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setFormState(prev => ({ ...prev, [field]: value }));
      // Clear validation error when field changes
      if (validationErrors[field]) {
        setValidationErrors(prev => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    },
    [validationErrors]
  );

  // Validate form
  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!isEditMode && !projectId) {
      errors.projectId = t('form.validation.projectRequired');
    }

    if (formState.validityDays <= 0) {
      errors.validityDays = t('form.validation.validityPositive');
    }

    if (formState.taxRate < 0 || formState.taxRate > 100) {
      errors.taxRate = t('form.validation.taxRateRange');
    }

    if (formState.discountAmount < 0) {
      errors.discountAmount = t('form.validation.discountNonNegative');
    }

    if (formState.lineItems.length === 0) {
      errors.lineItems = t('form.validation.productRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [isEditMode, projectId, formState, t]);

  // Convert ProductLineItem to LineItemInput
  const toLineItemInput = (item: ProductLineItem): LineItemInput => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    notes: item.notes,
  });

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      if (isEditMode && onUpdateSubmit) {
        const updateData: UpdateQuotationInput = {
          validityDays: formState.validityDays,
          taxRate: formState.taxRate,
          discountAmount: formState.discountAmount,
          notes: formState.notes || undefined,
          lineItems: formState.lineItems.map(toLineItemInput),
        };
        onUpdateSubmit(updateData);
      } else if (!isEditMode && onCreateSubmit && projectId) {
        const createData: CreateQuotationInput = {
          projectId,
          validityDays: formState.validityDays,
          taxRate: formState.taxRate,
          discountAmount: formState.discountAmount,
          notes: formState.notes || undefined,
          lineItems: formState.lineItems.map(toLineItemInput),
        };
        onCreateSubmit(createData);
      }
    },
    [isEditMode, projectId, formState, validate, onCreateSubmit, onUpdateSubmit]
  );

  // Calculate amounts
  const subtotal = formState.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = Math.round(subtotal * (formState.taxRate / 100));
  const amountBeforeDiscount = subtotal + taxAmount;
  const finalAmount = amountBeforeDiscount - formState.discountAmount;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="error" title={t('common:toast.error')}>
          {error}
        </Alert>
      )}

      {/* Quotation Info */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium text-white">{t('form.quotationDetails')}</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Project Info (read-only) */}
          <div>
            <FormField label={t('form.project')}>
              <Input
                value={
                  isEditMode ? quotation?.projectName || '' : projectName || `Project #${projectId}`
                }
                disabled
              />
            </FormField>
          </div>

          {/* JobCode (read-only for edit) */}
          {isEditMode && (
            <div>
              <FormField label={t('form.jobCode')}>
                <Input value={quotation?.jobCode || ''} disabled />
              </FormField>
            </div>
          )}

          {/* Validity */}
          <div>
            <FormField
              label={t('form.validityPeriod')}
              required
              error={validationErrors.validityDays}
            >
              <Input
                type="number"
                min={1}
                value={formState.validityDays}
                onChange={e => updateField('validityDays', parseInt(e.target.value, 10) || 30)}
                placeholder="e.g., 30"
                disabled={isSubmitting}
              />
            </FormField>
          </div>

          {/* Version (read-only for edit) */}
          {isEditMode && (
            <div>
              <FormField label={t('form.version')}>
                <Input value={`v${quotation?.version}`} disabled />
              </FormField>
            </div>
          )}

          {/* Tax Rate */}
          <div>
            <FormField
              label={t('form.taxRate')}
              error={validationErrors.taxRate}
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={formState.taxRate}
                  onChange={e => updateField('taxRate', parseFloat(e.target.value) || 0)}
                  placeholder="10"
                  disabled={isSubmitting}
                  className="flex-1"
                />
                <span className="text-steel-400">%</span>
              </div>
            </FormField>
          </div>

          {/* Discount Amount */}
          <div>
            <FormField
              label={t('form.discountAmount')}
              error={validationErrors.discountAmount}
            >
              <div className="flex items-center gap-2">
                <span className="text-steel-400">₩</span>
                <Input
                  type="number"
                  min={0}
                  value={formState.discountAmount}
                  onChange={e => updateField('discountAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  disabled={isSubmitting}
                  className="flex-1"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <FormField label={t('form.notes')}>
            <textarea
              value={formState.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder={t('form.notesPlaceholder')}
              rows={3}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder-steel-500 transition-all focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </FormField>
        </div>
      </Card>

      {/* Line Items */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-white">{t('form.products')}</h3>
        {validationErrors.lineItems && (
          <Alert variant="error" className="mb-4">
            {validationErrors.lineItems}
          </Alert>
        )}
        <ProductSelector
          lineItems={formState.lineItems}
          onChange={items => updateField('lineItems', items)}
          disabled={isSubmitting}
        />
      </div>

      {/* Form Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-4">
              <span className="text-steel-400">{t('form.subtotal')}</span>
              <span className="text-steel-300">
                {new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW',
                  maximumFractionDigits: 0,
                }).format(subtotal)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-steel-400">{t('form.tax', { rate: formState.taxRate })}</span>
              <span className="text-steel-300">
                {new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW',
                  maximumFractionDigits: 0,
                }).format(taxAmount)}
              </span>
            </div>
            {formState.discountAmount > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-steel-400">{t('form.discount')}</span>
                <span className="text-red-400">
                  -{new Intl.NumberFormat('ko-KR', {
                    style: 'currency',
                    currency: 'KRW',
                    maximumFractionDigits: 0,
                  }).format(formState.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 border-t border-steel-700/50 pt-1">
              <span className="font-medium text-white">{t('form.finalAmount')}</span>
              <span className="text-lg font-semibold text-copper-400">
                {new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW',
                  maximumFractionDigits: 0,
                }).format(finalAmount)}
              </span>
              <span className="text-steel-500">
                ({t('form.itemCount', { count: formState.lineItems.length })})
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              {t('common:buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('form.saving')}
                </>
              ) : isEditMode ? (
                t('form.saveChanges')
              ) : (
                t('form.createQuotation')
              )}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
