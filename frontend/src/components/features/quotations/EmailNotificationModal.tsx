/**
 * Email Notification Modal
 *
 * Reusable modal for confirming email notification sending.
 * Extracted for use in multiple contexts (details panel, future admin edit flow).
 *
 * Features:
 * - Simple confirmation dialog for sending email
 * - Displays quotation context (job code, version)
 * - Loading state during email sending
 */

import { Button, Modal, ModalActions, Spinner } from '@/components/ui';

export interface EmailNotificationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed (via Cancel or backdrop click) */
  onClose: () => void;
  /** Callback when user confirms sending email. Parent should close modal after success. */
  onSend: () => void | Promise<void>;
  /** Quotation info for context display */
  quotationInfo?: {
    jobCode: string;
    version: number;
  };
  /** Whether email is being sent (shows loading state) */
  isLoading?: boolean;
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
}: Readonly<EmailNotificationModalProps>) {
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
