/**
 * ConfirmationModal component for dangerous actions
 *
 * Features:
 * - Pre-built layout for confirmation dialogs
 * - Danger/warning variants with appropriate icons
 * - Async action support with loading state
 * - Error display
 *
 * Usage:
 * ```tsx
 * <ConfirmationModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onConfirm={handleDelete}
 *   title="Delete User"
 *   message="Are you sure you want to delete this user?"
 *   variant="danger"
 *   confirmLabel="Delete"
 * />
 * ```
 */

import { useState } from 'react';
import { Alert } from '../feedback/Alert';
import { Button } from '../primitives/Button';
import { Modal } from './Modal';
import { ModalActions } from './ModalActions';
import { cn } from '@/shared/utils';

export interface ConfirmationModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when confirm button clicked (can be async) */
  onConfirm: () => void | Promise<void>;
  /** Dialog title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Confirmation type (affects icon and button color) */
  variant?: 'danger' | 'warning';
  /** Confirm button text */
  confirmLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;
}

type ConfirmationVariant = 'danger' | 'warning';

interface VariantConfig {
  iconBg: string;
  iconColor: string;
  buttonClass: string;
}

const variantConfig: Record<ConfirmationVariant, VariantConfig> = {
  danger: {
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    buttonClass: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/50',
  },
  warning: {
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-400',
    buttonClass: 'bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500/50',
  },
};

function WarningIcon({ variant }: Readonly<{ variant: 'danger' | 'warning' }>) {
  const config = variantConfig[variant];

  return (
    <div
      className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-full', config.iconBg)}
    >
      <svg
        className={cn('h-6 w-6', config.iconColor)}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>
  );
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'danger',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: Readonly<ConfirmationModalProps>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = variantConfig[variant];

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" closeOnBackdrop={!isLoading}>
      <WarningIcon variant={variant} />
      <h2 className="mb-2 text-xl font-semibold text-white">{title}</h2>
      <p className="mb-6 text-sm text-steel-400">{message}</p>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <ModalActions>
        <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          isLoading={isLoading}
          className={cn(
            'rounded-lg px-4 py-2 font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-steel-900',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            config.buttonClass
          )}
        >
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  );
}

export default ConfirmationModal;
