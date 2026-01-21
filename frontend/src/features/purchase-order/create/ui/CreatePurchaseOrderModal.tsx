/**
 * Create Purchase Order Modal.
 *
 * Modal for creating a purchase order from a selected RFQ item.
 * Pre-fills order date (today) and calculates expected delivery date.
 *
 * FSD Layer: features
 */

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, FormField, Modal, ModalActions, Spinner } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/formatting';
import type { RfqItem } from '@/entities/purchase-request';
import { useCreatePurchaseOrder } from '../model/use-create-purchase-order';

export interface CreatePurchaseOrderModalProps {
  /** Whether the modal is open */
  readonly isOpen: boolean;
  /** Purchase request ID */
  readonly purchaseRequestId: number;
  /** RFQ item to create PO for */
  readonly rfqItem: RfqItem;
  /** Quantity from purchase request */
  readonly quantity: number;
  /** Called when modal should close */
  readonly onClose: () => void;
  /** Called after successful submission */
  readonly onSuccess?: () => void;
}

interface FormData {
  orderDate: string;
  expectedDeliveryDate: string;
  notes: string;
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Add days to a date string.
 */
function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Modal for creating a purchase order from an RFQ item.
 *
 * Features:
 * - Pre-fills order date with today
 * - Calculates expected delivery date from quoted lead time
 * - Displays calculated total amount
 * - Loading state and error display
 */
export function CreatePurchaseOrderModal({
  isOpen,
  purchaseRequestId,
  rfqItem,
  quantity,
  onClose,
  onSuccess,
}: CreatePurchaseOrderModalProps) {
  const { t } = useTranslation(['purchasing', 'common']);
  // Calculate initial expected delivery date
  const initialOrderDate = getTodayDate();
  const initialExpectedDelivery = rfqItem.quotedLeadTime
    ? addDaysToDate(initialOrderDate, rfqItem.quotedLeadTime)
    : initialOrderDate;

  const [formData, setFormData] = useState<FormData>({
    orderDate: initialOrderDate,
    expectedDeliveryDate: initialExpectedDelivery,
    notes: '',
  });
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    if (rfqItem.quotedPrice === null) return null;
    return rfqItem.quotedPrice * quantity;
  }, [rfqItem.quotedPrice, quantity]);

  // Mutation hook
  const { mutate: createPurchaseOrder, isPending } = useCreatePurchaseOrder({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      setSubmitError(error.message);
    },
  });

  // Validate form
  const validate = useCallback((): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.orderDate) {
      errors.orderDate = t('purchasing:createPurchaseOrderModal.orderDateRequired');
    }

    if (!formData.expectedDeliveryDate) {
      errors.expectedDeliveryDate = t('purchasing:createPurchaseOrderModal.expectedDeliveryDateRequired');
    } else if (formData.expectedDeliveryDate < formData.orderDate) {
      errors.expectedDeliveryDate = t('purchasing:createPurchaseOrderModal.expectedDeliveryDateInvalid');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle order date change - auto-update expected delivery
  const handleOrderDateChange = useCallback((value: string) => {
    setFormData((prev) => {
      const newExpectedDelivery = rfqItem.quotedLeadTime
        ? addDaysToDate(value, rfqItem.quotedLeadTime)
        : value;
      return {
        ...prev,
        orderDate: value,
        expectedDeliveryDate: newExpectedDelivery,
      };
    });
    if (validationErrors.orderDate) {
      setValidationErrors((prev) => ({ ...prev, orderDate: undefined }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  }, [rfqItem.quotedLeadTime, validationErrors.orderDate, submitError]);

  // Handle field change
  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  }, [validationErrors, submitError]);

  // Handle submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    createPurchaseOrder({
      purchaseRequestId,
      rfqItemId: rfqItem.itemId,
      orderDate: formData.orderDate,
      expectedDeliveryDate: formData.expectedDeliveryDate,
      notes: formData.notes.trim() || null,
    });
  }, [formData, purchaseRequestId, rfqItem.itemId, validate, createPurchaseOrder]);

  // Handle close
  const handleClose = useCallback(() => {
    if (!isPending) {
      onClose();
    }
  }, [isPending, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('purchasing:createPurchaseOrderModal.title')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vendor Context */}
        <div className="rounded-lg bg-steel-800/50 p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-steel-400">{t('purchasing:createPurchaseOrderModal.vendor')}</span>
            <span className="font-medium text-white">{rfqItem.vendorName}</span>
          </div>
          {rfqItem.quotedPrice !== null && (
            <div className="flex justify-between">
              <span className="text-sm text-steel-400">{t('purchasing:createPurchaseOrderModal.quotedPrice')}</span>
              <span className="text-white">{formatCurrency(rfqItem.quotedPrice)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-steel-400">{t('purchasing:createPurchaseOrderModal.quantity')}</span>
            <span className="text-white">{quantity}</span>
          </div>
          {rfqItem.quotedLeadTime !== null && (
            <div className="flex justify-between">
              <span className="text-sm text-steel-400">{t('purchasing:createPurchaseOrderModal.leadTime')}</span>
              <span className="text-white">{t('purchasing:createPurchaseOrderModal.leadTimeDays', { days: rfqItem.quotedLeadTime })}</span>
            </div>
          )}
          {totalAmount !== null && (
            <div className="flex justify-between border-t border-steel-700 pt-2 mt-2">
              <span className="text-sm font-medium text-steel-300">{t('purchasing:createPurchaseOrderModal.totalAmount')}</span>
              <span className="font-semibold text-copper-400">{formatCurrency(totalAmount)}</span>
            </div>
          )}
        </div>

        {/* Submit Error */}
        {submitError && (
          <Alert variant="error" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {/* Order Date */}
        <FormField
          label={t('purchasing:createPurchaseOrderModal.orderDate')}
          required
          error={validationErrors.orderDate}
        >
          <input
            type="date"
            value={formData.orderDate}
            onChange={(e) => handleOrderDateChange(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white transition-all focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>

        {/* Expected Delivery Date */}
        <FormField
          label={t('purchasing:createPurchaseOrderModal.expectedDeliveryDate')}
          required
          error={validationErrors.expectedDeliveryDate}
          hint={rfqItem.quotedLeadTime ? t('purchasing:createPurchaseOrderModal.expectedDeliveryDateHint', { days: rfqItem.quotedLeadTime }) : undefined}
        >
          <input
            type="date"
            value={formData.expectedDeliveryDate}
            min={formData.orderDate}
            onChange={(e) => handleFieldChange('expectedDeliveryDate', e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white transition-all focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>

        {/* Notes */}
        <FormField
          label={t('purchasing:createPurchaseOrderModal.notes')}
          hint={t('purchasing:createPurchaseOrderModal.notesHint')}
        >
          <textarea
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder={t('purchasing:createPurchaseOrderModal.notesPlaceholder')}
            rows={3}
            disabled={isPending}
            className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder-steel-500 transition-all focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>

        {/* Actions */}
        <ModalActions>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isPending}
          >
            {t('common:buttons.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {t('purchasing:createPurchaseOrderModal.creating')}
              </>
            ) : (
              t('purchasing:createPurchaseOrderModal.create')
            )}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
