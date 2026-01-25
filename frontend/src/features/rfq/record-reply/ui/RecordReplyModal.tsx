/**
 * Record RFQ Reply Modal.
 *
 * Modal for recording vendor's quoted price, lead time, and notes.
 * Uses internal mutation hook for submission.
 *
 * Note: Parent should use `key={rfqItem.itemId}` to reset form state when item changes.
 *
 * FSD Layer: features
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, FormField, Modal, ModalActions, Spinner } from '@/shared/ui';
import type { RfqItem } from '@/entities/purchase-request';
import { useRecordReply } from '../model/use-record-reply';

export interface RecordReplyModalProps {
  /** Whether the modal is open */
  readonly isOpen: boolean;
  /** Purchase request ID */
  readonly purchaseRequestId: number;
  /** RFQ item to record reply for */
  readonly rfqItem: RfqItem;
  /** Called when modal should close */
  readonly onClose: () => void;
  /** Called after successful submission */
  readonly onSuccess?: () => void;
}

interface FormData {
  quotedPrice: string;
  quotedLeadTime: string;
  notes: string;
}

const initialFormData: FormData = {
  quotedPrice: '',
  quotedLeadTime: '',
  notes: '',
};

/**
 * Modal for recording a vendor's RFQ reply.
 *
 * Features:
 * - Number inputs for quoted price and lead time
 * - Textarea for notes
 * - Client-side validation
 * - Loading state
 * - Error display
 */
export function RecordReplyModal({
  isOpen,
  purchaseRequestId,
  rfqItem,
  onClose,
  onSuccess,
}: RecordReplyModalProps) {
  const { t } = useTranslation(['purchasing', 'common']);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Mutation hook
  const { mutate: recordReply, isPending } = useRecordReply({
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
    const price = parseFloat(formData.quotedPrice);
    const leadTime = formData.quotedLeadTime ? parseInt(formData.quotedLeadTime, 10) : null;

    if (!formData.quotedPrice.trim()) {
      errors.quotedPrice = t('purchasing:recordReplyModal.validation.quotedPriceRequired');
    } else if (isNaN(price) || price < 0) {
      errors.quotedPrice = t('purchasing:recordReplyModal.validation.quotedPriceInvalid');
    }

    if (formData.quotedLeadTime && (leadTime === null || isNaN(leadTime) || leadTime < 0)) {
      errors.quotedLeadTime = t('purchasing:recordReplyModal.validation.leadTimeInvalid');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, t]);

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

    const price = parseFloat(formData.quotedPrice);
    const leadTime = formData.quotedLeadTime ? parseInt(formData.quotedLeadTime, 10) : null;

    recordReply({
      purchaseRequestId,
      itemId: rfqItem.itemId,
      quotedPrice: price,
      quotedLeadTime: leadTime,
      notes: formData.notes.trim() || null,
    });
  }, [formData, purchaseRequestId, rfqItem.itemId, validate, recordReply]);

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
      title={t('purchasing:recordReplyModal.title')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vendor Context */}
        <div className="rounded-lg bg-steel-800/50 p-3">
          <span className="text-sm text-steel-400">{t('purchasing:recordReplyModal.vendor')}: </span>
          <span className="font-medium text-white">{rfqItem.vendorName}</span>
        </div>

        {/* Submit Error */}
        {submitError && (
          <Alert variant="error" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {/* Quoted Price */}
        <FormField
          label={t('purchasing:recordReplyModal.quotedPrice')}
          required
          error={validationErrors.quotedPrice}
          hint={t('purchasing:recordReplyModal.quotedPriceHint')}
        >
          <input
            type="number"
            min="0"
            step="1"
            value={formData.quotedPrice}
            onChange={(e) => handleFieldChange('quotedPrice', e.target.value)}
            placeholder={t('purchasing:recordReplyModal.quotedPricePlaceholder')}
            disabled={isPending}
            className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder-steel-500 transition-all focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>

        {/* Quoted Lead Time */}
        <FormField
          label={t('purchasing:recordReplyModal.quotedLeadTime')}
          error={validationErrors.quotedLeadTime}
          hint={t('purchasing:recordReplyModal.quotedLeadTimeHint')}
        >
          <input
            type="number"
            min="0"
            step="1"
            value={formData.quotedLeadTime}
            onChange={(e) => handleFieldChange('quotedLeadTime', e.target.value)}
            placeholder={t('purchasing:recordReplyModal.quotedLeadTimePlaceholder')}
            disabled={isPending}
            className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder-steel-500 transition-all focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>

        {/* Notes */}
        <FormField
          label={t('purchasing:recordReplyModal.notes')}
          hint={t('purchasing:recordReplyModal.notesHint')}
        >
          <textarea
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder={t('purchasing:recordReplyModal.notesPlaceholder')}
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
            disabled={isPending || !formData.quotedPrice.trim()}
          >
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {t('purchasing:recordReplyModal.saving')}
              </>
            ) : (
              t('common:buttons.save')
            )}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
