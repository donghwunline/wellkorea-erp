/**
 * Email Send Modal.
 *
 * Generic modal for sending emails with editable TO and CC recipients.
 * Can be used for quotation notifications, purchase orders, RFQs, etc.
 *
 * FSD Layer: shared/ui
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, ModalActions, Spinner, FormField, EmailTagInput, Icon } from '@/shared/ui';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EmailSendModalProps {
  /** Whether the modal is open */
  readonly isOpen: boolean;
  /** Callback when modal is closed (via Cancel or backdrop click) */
  readonly onClose: () => void;
  /** Callback when user confirms sending email */
  readonly onSend: (to: string, ccEmails: string[]) => void | Promise<void>;
  /** Default TO email (e.g., customer/vendor email) */
  readonly defaultEmail?: string;
  /** Modal title */
  readonly title?: string;
  /** Context message displayed at the top of the modal */
  readonly contextMessage?: string;
  /** Help text displayed at the bottom (above buttons) */
  readonly helpText?: string;
  /** Whether email is being sent (shows loading state) */
  readonly isLoading?: boolean;
}

/**
 * Modal for sending email with editable recipients.
 * Parent component is responsible for closing the modal after successful send.
 *
 * Uses conditional rendering pattern: when modal opens, the inner content component
 * is mounted fresh, initializing state from props without needing useEffect.
 */
export function EmailSendModal({
  isOpen,
  onClose,
  onSend,
  defaultEmail,
  title,
  contextMessage,
  helpText,
  isLoading = false,
}: EmailSendModalProps) {
  const { t } = useTranslation('common');
  const resolvedTitle = title ?? t('email.title');
  const resolvedHelpText = helpText ?? t('email.pdfAttachment');
  // Only render content when modal is open - this ensures fresh state on each open
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={resolvedTitle} size="md">
      <EmailSendModalContent
        onClose={onClose}
        onSend={onSend}
        defaultEmail={defaultEmail}
        contextMessage={contextMessage}
        helpText={resolvedHelpText}
        isLoading={isLoading}
      />
    </Modal>
  );
}

interface EmailSendModalContentProps {
  readonly onClose: () => void;
  readonly onSend: (to: string, ccEmails: string[]) => void | Promise<void>;
  readonly defaultEmail?: string;
  readonly contextMessage?: string;
  readonly helpText?: string;
  readonly isLoading: boolean;
}

/**
 * Inner content component for the email send modal.
 * State is initialized from props on mount - no useEffect needed for reset.
 */
function EmailSendModalContent({
  onClose,
  onSend,
  defaultEmail,
  contextMessage,
  helpText,
  isLoading,
}: EmailSendModalContentProps) {
  const { t } = useTranslation('common');
  // Form state - initialized from props on mount
  const [toEmail, setToEmail] = useState(defaultEmail ?? '');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [showCcField, setShowCcField] = useState(false);
  const [toError, setToError] = useState<string | undefined>();

  // Validate TO email
  const validateToEmail = useCallback((email: string): boolean => {
    if (!email.trim()) {
      setToError(t('email.required'));
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setToError(t('email.invalidFormat'));
      return false;
    }
    setToError(undefined);
    return true;
  }, [t]);

  // Check if all CC emails are valid
  const hasInvalidCcEmails = ccEmails.some((email) => !EMAIL_REGEX.test(email.trim()));

  // Handle send
  const handleSend = useCallback(() => {
    if (!validateToEmail(toEmail)) {
      return;
    }
    if (hasInvalidCcEmails) {
      return;
    }
    onSend(
      toEmail.trim(),
      ccEmails.filter((e) => e.trim())
    );
  }, [toEmail, ccEmails, validateToEmail, hasInvalidCcEmails, onSend]);

  // Handle TO email change
  const handleToEmailChange = useCallback(
    (value: string) => {
      setToEmail(value);
      if (toError) {
        setToError(undefined);
      }
    },
    [toError]
  );

  return (
    <div className="space-y-4">
      {/* Context info */}
      {contextMessage && <p className="text-sm text-steel-400">{contextMessage}</p>}

      {/* TO Email Field */}
      <FormField
        label={t('email.to')}
        type="email"
        value={toEmail}
        onChange={handleToEmailChange}
        error={toError}
        placeholder="recipient@example.com"
        disabled={isLoading}
        required
      />

      {/* CC Field - Collapsed by default */}
      {!showCcField ? (
        <button
          type="button"
          onClick={() => setShowCcField(true)}
          className="flex items-center gap-1.5 text-sm text-copper-400 transition-colors hover:text-copper-300"
          disabled={isLoading}
        >
          <Icon name="plus" className="h-4 w-4" />
          {t('email.addCc')}
        </button>
      ) : (
        <EmailTagInput
          label={t('email.cc')}
          emails={ccEmails}
          onChange={setCcEmails}
          placeholder={t('email.placeholder')}
          disabled={isLoading}
        />
      )}

      {/* Help text */}
      {helpText && <p className="text-xs text-steel-500">{helpText}</p>}

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {t('buttons.cancel')}
        </Button>
        <Button onClick={handleSend} disabled={isLoading || !!toError || hasInvalidCcEmails}>
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              {t('email.sending')}
            </>
          ) : (
            t('email.send')
          )}
        </Button>
      </ModalActions>
    </div>
  );
}
