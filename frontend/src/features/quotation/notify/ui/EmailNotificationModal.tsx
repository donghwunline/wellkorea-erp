/**
 * Email Notification Modal.
 *
 * Modal for sending quotation email notifications with editable TO and CC recipients.
 * Part of the notify feature - used when sending quotations to customers.
 *
 * FSD Layer: features/quotation/notify/ui
 * Can import from: entities, shared
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, ModalActions, Spinner, FormField, EmailTagInput, Icon } from '@/shared/ui';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EmailNotificationModalProps {
  /** Whether the modal is open */
  readonly isOpen: boolean;
  /** Callback when modal is closed (via Cancel or backdrop click) */
  readonly onClose: () => void;
  /** Callback when user confirms sending email */
  readonly onSend: (to: string, ccEmails: string[]) => void | Promise<void>;
  /** Default TO email (customer email from quotation) */
  readonly customerEmail?: string;
  /** Quotation info for context display */
  readonly quotationInfo?: {
    readonly jobCode: string;
    readonly version: number;
  };
  /** Whether email is being sent (shows loading state) */
  readonly isLoading?: boolean;
}

/**
 * Modal for sending email notification with editable recipients.
 * Parent component is responsible for closing the modal after successful send.
 *
 * Uses key-based reset pattern: when modal opens, the inner content component
 * is mounted fresh, initializing state from props without needing useEffect.
 */
export function EmailNotificationModal({
  isOpen,
  onClose,
  onSend,
  customerEmail,
  quotationInfo,
  isLoading = false,
}: EmailNotificationModalProps) {
  const { t } = useTranslation('quotations');
  // Only render content when modal is open - this ensures fresh state on each open
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('notify.title')}
      size="md"
    >
      <EmailNotificationModalContent
        onClose={onClose}
        onSend={onSend}
        customerEmail={customerEmail}
        quotationInfo={quotationInfo}
        isLoading={isLoading}
      />
    </Modal>
  );
}

interface EmailNotificationModalContentProps {
  readonly onClose: () => void;
  readonly onSend: (to: string, ccEmails: string[]) => void | Promise<void>;
  readonly customerEmail?: string;
  readonly quotationInfo?: {
    readonly jobCode: string;
    readonly version: number;
  };
  readonly isLoading: boolean;
}

/**
 * Inner content component for the email notification modal.
 * State is initialized from props on mount - no useEffect needed for reset.
 */
function EmailNotificationModalContent({
  onClose,
  onSend,
  customerEmail,
  quotationInfo,
  isLoading,
}: EmailNotificationModalContentProps) {
  const { t } = useTranslation(['quotations', 'common']);
  // Form state - initialized from props on mount
  const [toEmail, setToEmail] = useState(customerEmail ?? '');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [showCcField, setShowCcField] = useState(false);
  const [toError, setToError] = useState<string | undefined>();

  // Validate TO email
  const validateToEmail = useCallback((email: string): boolean => {
    if (!email.trim()) {
      setToError(t('notify.validation.emailRequired'));
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setToError(t('notify.validation.emailInvalid'));
      return false;
    }
    setToError(undefined);
    return true;
  }, [t]);

  // Check if all CC emails are valid
  const hasInvalidCcEmails = ccEmails.some(email => !EMAIL_REGEX.test(email.trim()));

  // Handle send
  const handleSend = useCallback(() => {
    if (!validateToEmail(toEmail)) {
      return;
    }
    if (hasInvalidCcEmails) {
      return;
    }
    onSend(toEmail.trim(), ccEmails.filter(e => e.trim()));
  }, [toEmail, ccEmails, validateToEmail, hasInvalidCcEmails, onSend]);

  // Handle TO email change
  const handleToEmailChange = useCallback((value: string) => {
    setToEmail(value);
    if (toError) {
      setToError(undefined);
    }
  }, [toError]);

  return (
    <div className="space-y-4">
      {/* Context info */}
      <p className="text-sm text-steel-400">
        {quotationInfo
          ? t('notify.contextWithInfo', { jobCode: quotationInfo.jobCode, version: quotationInfo.version })
          : t('notify.contextDefault')}
      </p>

      {/* TO Email Field */}
      <FormField
        label={t('notify.to')}
        type="email"
        value={toEmail}
        onChange={handleToEmailChange}
        error={toError}
        placeholder={t('notify.toPlaceholder')}
        disabled={isLoading}
        required
      />

      {/* CC Field - Collapsed by default */}
      {!showCcField ? (
        <button
          type="button"
          onClick={() => setShowCcField(true)}
          className="flex items-center gap-1.5 text-sm text-copper-400 hover:text-copper-300 transition-colors"
          disabled={isLoading}
        >
          <Icon name="plus" className="h-4 w-4" />
          {t('notify.addCc')}
        </button>
      ) : (
        <EmailTagInput
          label={t('notify.ccLabel')}
          emails={ccEmails}
          onChange={setCcEmails}
          placeholder={t('notify.ccPlaceholder')}
          disabled={isLoading}
        />
      )}

      {/* Info text */}
      <p className="text-xs text-steel-500">
        {t('notify.pdfAttachNote')}
      </p>

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {t('common:buttons.cancel')}
        </Button>
        <Button
          onClick={handleSend}
          disabled={isLoading || !!toError || hasInvalidCcEmails}
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              {t('notify.sending')}
            </>
          ) : (
            t('notify.sendEmail')
          )}
        </Button>
      </ModalActions>
    </div>
  );
}
