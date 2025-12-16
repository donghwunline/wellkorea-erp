/**
 * Modal component with accessibility features
 *
 * Features:
 * - Focus trap via useFocusTrap hook (keyboard navigation contained)
 * - ESC key to close
 * - Click outside to close (optional)
 * - Body scroll lock via useBodyScrollLock hook
 * - Size variants (sm, md, lg)
 * - Accessibility with role="dialog"
 *
 * Usage:
 * ```tsx
 * <Modal isOpen={isOpen} onClose={handleClose} title="Create User" size="md">
 *   <form>...</form>
 * </Modal>
 * ```
 */

import { type ReactNode, useEffect } from 'react';
import { cn } from '../utils/cn';
import { useFocusTrap, useBodyScrollLock } from '../hooks';

export interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg';
  /** Disable close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Disable close on Escape key */
  closeOnEsc?: boolean;
  children: ReactNode;
  /** Additional CSS classes for modal content */
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
};

export function Modal({
                        isOpen,
                        onClose,
                        title,
                        size = 'md',
                        closeOnBackdrop = true,
                        closeOnEsc = true,
                        children,
                        className,
                      }: Readonly<ModalProps>) {
  // Focus trap and body scroll lock
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, { autoFocus: true, restoreFocus: true });
  useBodyScrollLock(isOpen);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    globalThis.addEventListener('keydown', handleEscape);
    return () => globalThis.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEsc, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'w-full rounded-xl border border-steel-800/50 bg-steel-900 p-6 shadow-elevated',
          sizeClasses[size],
          className,
        )}
      >
        {title && (
          <div className="mb-6 flex items-start justify-between">
            <h2 id="modal-title" className="text-xl font-semibold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-800 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default Modal;
