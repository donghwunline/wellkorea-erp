/**
 * Reject Modal.
 *
 * Feature component for collecting rejection reason.
 * Contains form state and validation logic.
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, FormField, Modal, ModalActions, Spinner } from '@/shared/ui';

export interface RejectModalProps {
  /**
   * Whether the modal is open.
   */
  isOpen: boolean;

  /**
   * Entity reference for context (e.g., quotation number).
   */
  entityRef?: string;

  /**
   * Whether the rejection is in progress.
   * @default false
   */
  isSubmitting?: boolean;

  /**
   * Error message from submission.
   */
  error?: string | null;

  /**
   * Called when modal is closed.
   */
  onClose: () => void;

  /**
   * Called when rejection is confirmed with reason.
   */
  onConfirm: (reason: string) => void;
}

/**
 * Modal for collecting rejection reason.
 *
 * Features:
 * - Textarea for reason input
 * - Validation (required, min 10 chars)
 * - Error display
 * - Loading state
 *
 * @example
 * ```tsx
 * <RejectModal
 *   isOpen={showRejectModal}
 *   entityRef={`${quotation.jobCode} v${quotation.version}`}
 *   isSubmitting={isRejecting}
 *   error={rejectError?.message}
 *   onClose={() => setShowRejectModal(false)}
 *   onConfirm={handleReject}
 * />
 * ```
 */
export function RejectModal({
  isOpen,
  entityRef,
  isSubmitting = false,
  error,
  onClose,
  onConfirm,
}: Readonly<RejectModalProps>) {
  const { t } = useTranslation(['approval', 'common']);
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset state when modal opens
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setReason('');
        setValidationError(null);
        onClose();
      }
    },
    [onClose]
  );

  // Handle confirmation
  const handleConfirm = useCallback(() => {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setValidationError(t('reject.modal.validation.reasonRequired'));
      return;
    }

    if (trimmedReason.length < 10) {
      setValidationError(t('reject.modal.validation.reasonMinLength'));
      return;
    }

    setValidationError(null);
    onConfirm(trimmedReason);
  }, [reason, onConfirm, t]);

  // Handle reason change
  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  }, [validationError]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => handleOpenChange(false)}
      title={t('reject.modal.title')}
      size="md"
    >
      <div className="space-y-4">
        {/* Context */}
        {entityRef && (
          <div className="rounded-lg bg-steel-800/50 p-3">
            <span className="text-sm text-steel-400">{t('reject.modal.rejecting')}: </span>
            <span className="font-medium text-white">{entityRef}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="error" title={t('common:toast.error')}>
            {error}
          </Alert>
        )}

        {/* Warning */}
        <Alert variant="warning" title={t('common:toast.warning')}>
          {t('reject.modal.warning')}
        </Alert>

        {/* Reason Input */}
        <FormField
          label={t('reject.modal.reasonLabel')}
          required
          error={validationError || undefined}
        >
          <textarea
            value={reason}
            onChange={handleReasonChange}
            placeholder={t('reject.modal.reasonPlaceholder')}
            rows={4}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2 text-sm text-white placeholder-steel-500 transition-all focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>

        <p className="text-xs text-steel-500">
          {t('reject.modal.reasonHelp')}
        </p>

        {/* Actions */}
        <ModalActions>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('common:buttons.cancel')}
          </Button>
          <Button
            variant="warning"
            onClick={handleConfirm}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {t('reject.modal.rejectingButton')}
              </>
            ) : (
              t('reject.modal.rejectButton')
            )}
          </Button>
        </ModalActions>
      </div>
    </Modal>
  );
}
