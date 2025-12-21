/**
 * JobCode Success Modal
 *
 * Displays the generated JobCode after successful project creation.
 * Features copy to clipboard and navigation options.
 */

import { useState } from 'react';
import { Button, Icon, Modal, ModalActions } from '@/components/ui';

export interface JobCodeSuccessModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Generated JobCode */
  jobCode: string;
  /** Called when modal is closed */
  onClose: () => void;
  /** Called when user wants to view the created project */
  onViewProject: () => void;
}

/**
 * Success modal showing generated JobCode with copy functionality.
 */
export function JobCodeSuccessModal({
  isOpen,
  jobCode,
  onClose,
  onViewProject,
}: Readonly<JobCodeSuccessModalProps>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jobCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = jobCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Created Successfully">
      <div className="text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Icon name="check-circle" className="h-10 w-10 text-green-500" />
        </div>

        {/* Success Message */}
        <p className="mb-6 text-steel-300">
          Your project has been created with the following Job Code:
        </p>

        {/* JobCode Display */}
        <div className="mb-6 rounded-lg border border-copper-500/30 bg-copper-500/10 p-4">
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-2xl font-bold text-copper-400">{jobCode}</span>
            <button
              onClick={handleCopy}
              className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
              title={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? (
                <Icon name="check" className="h-5 w-5 text-green-500" />
              ) : (
                <Icon name="document" className="h-5 w-5" />
              )}
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-sm text-green-400">Copied to clipboard!</p>
          )}
        </div>

        <p className="mb-6 text-sm text-steel-400">
          Use this Job Code to reference this project in quotations, production, and invoicing.
        </p>

        {/* Actions */}
        <ModalActions align="center">
          <Button variant="secondary" onClick={onClose}>
            Back to List
          </Button>
          <Button onClick={onViewProject}>
            <Icon name="eye" className="mr-2 h-4 w-4" />
            View Project
          </Button>
        </ModalActions>
      </div>
    </Modal>
  );
}
