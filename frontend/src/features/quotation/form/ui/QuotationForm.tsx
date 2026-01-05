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
  const isEditMode = !!quotation;

  // Initialize form state
  const [formState, setFormState] = useState<FormState>(() => {
    if (quotation) {
      return {
        validityDays: quotation.validityDays,
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
      errors.projectId = 'Project is required';
    }

    if (formState.validityDays <= 0) {
      errors.validityDays = 'Validity period must be positive';
    }

    if (formState.lineItems.length === 0) {
      errors.lineItems = 'At least one product is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [isEditMode, projectId, formState]);

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
          notes: formState.notes || undefined,
          lineItems: formState.lineItems.map(toLineItemInput),
        };
        onUpdateSubmit(updateData);
      } else if (!isEditMode && onCreateSubmit && projectId) {
        const createData: CreateQuotationInput = {
          projectId,
          validityDays: formState.validityDays,
          notes: formState.notes || undefined,
          lineItems: formState.lineItems.map(toLineItemInput),
        };
        onCreateSubmit(createData);
      }
    },
    [isEditMode, projectId, formState, validate, onCreateSubmit, onUpdateSubmit]
  );

  // Calculate total
  const totalAmount = formState.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Quotation Info */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium text-white">Quotation Details</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Project Info (read-only) */}
          <div>
            <FormField label="Project">
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
              <FormField label="Job Code">
                <Input value={quotation?.jobCode || ''} disabled />
              </FormField>
            </div>
          )}

          {/* Validity */}
          <div>
            <FormField
              label="Validity Period (Days)"
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
              <FormField label="Version">
                <Input value={`v${quotation?.version}`} disabled />
              </FormField>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mt-4">
          <FormField label="Notes">
            <textarea
              value={formState.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Additional notes or remarks..."
              rows={3}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder-steel-500 transition-all focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </FormField>
        </div>
      </Card>

      {/* Line Items */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-white">Products</h3>
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
          <div className="text-steel-400">
            <span>Total: </span>
            <span className="text-lg font-semibold text-copper-400">
              {new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW',
                maximumFractionDigits: 0,
              }).format(totalAmount)}
            </span>
            <span className="ml-2 text-sm">
              ({formState.lineItems.length} item{formState.lineItems.length !== 1 ? 's' : ''})
            </span>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Create Quotation'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
