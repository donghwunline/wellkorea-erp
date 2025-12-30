/**
 * Email Notification Modal.
 *
 * Reusable modal for confirming email notification sending.
 * Part of the notify feature - used when sending quotations to customers.
 *
 * FSD Layer: features/quotation/notify/ui
 * Can import from: entities, shared
 */

import { Button, Modal, ModalActions, Spinner } from '@/components/ui';

export interface EmailNotificationModalProps {
  /** Whether the modal is open */
  readonly isOpen: boolean;
  /** Callback when modal is closed (via Cancel or backdrop click) */
  readonly onClose: () => void;
  /** Callback when user confirms sending email. Parent should close modal after success. */
  readonly onSend: () => void | Promise<void>;
  /** Quotation info for context display */
  readonly quotationInfo?: {
    readonly jobCode: string;
    readonly version: number;
  };
  /** Whether email is being sent (shows loading state) */
  readonly isLoading?: boolean;
}

/**
 * Modal for confirming email notification sending.
 * Parent component is responsible for closing the modal after successful send.
 */
export function EmailNotificationModal({
  isOpen,
  onClose,
  onSend,
  quotationInfo,
  isLoading = false,
}: EmailNotificationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Email Notification"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-steel-300">
          {quotationInfo
            ? `Send email notification for "${quotationInfo.jobCode} v${quotationInfo.version}" to the customer?`
            : 'Send email notification to the customer?'}
        </p>

        <p className="text-xs text-steel-500">
          This will notify the customer that the quotation is available.
        </p>

        <ModalActions>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSend} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Sending...
              </>
            ) : (
              'Send Email'
            )}
          </Button>
        </ModalActions>
      </div>
    </Modal>
  );
}
