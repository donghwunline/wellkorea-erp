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
 *
 * TODO: Refactor to use explicit `actions` prop instead of auto-detecting ModalActions children.
 * The current child detection logic (lines 90-105) using Children.toArray() and displayName
 * is overly complex and fragile. Replace with:
 *   - Add `actions?: ReactNode` prop to ModalProps
 *   - Render actions in footer section directly
 *   - Remove child detection logic
 * This will make the API cleaner and more predictable.
 */

import { type ReactNode, useEffect, Children, isValidElement } from 'react';
import { cn } from '@/shared/lib/cn';
import { useFocusTrap } from '../lib/useFocusTrap';
import { useBodyScrollLock } from '../lib/useBodyScrollLock';
import { ModalActions } from './ModalActions';

export interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
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
  fullscreen: 'w-full h-full max-w-none max-h-none rounded-none',
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

  const isFullscreen = size === 'fullscreen';

  // Detect ModalActions child for fixed footer layout
  const childrenArray = Children.toArray(children);
  const actionsIndex = childrenArray.findIndex(
    (child) =>
      isValidElement(child) &&
      (child.type === ModalActions ||
        (typeof child.type === 'function' &&
          (child.type as { displayName?: string }).displayName === 'ModalActions'))
  );
  const hasModalActions = actionsIndex !== -1;

  // Split children: content vs actions
  const contentChildren = hasModalActions
    ? childrenArray.filter((_, index) => index !== actionsIndex)
    : children;
  const actionsChild = hasModalActions ? childrenArray[actionsIndex] : null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        !isFullscreen && 'bg-black/60 backdrop-blur-sm'
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'flex w-full flex-col bg-steel-900 shadow-elevated',
          isFullscreen
            ? 'h-full border-0 p-0'
            : 'max-h-[calc(100vh-4rem)] rounded-xl border border-steel-800/50 p-6',
          sizeClasses[size],
          className
        )}
      >
        {title && (
          <div
            className={cn(
              'flex items-start justify-between',
              isFullscreen
                ? 'border-b border-steel-700/50 bg-steel-800 px-6 py-4'
                : 'mb-6'
            )}
          >
            <h2 id="modal-title" className="text-xl font-semibold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-700 hover:text-white"
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
        {/* Scrollable content area - always scrollable for non-fullscreen modals */}
        <div
          className={cn(
            isFullscreen
              ? 'flex-1 overflow-hidden'
              : 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden'
          )}
        >
          {contentChildren}
        </div>

        {/* Fixed footer - always visible when ModalActions is direct child */}
        {actionsChild && !isFullscreen && (
          <div className="flex-shrink-0">{actionsChild}</div>
        )}

        {/* Fullscreen mode - preserve original behavior */}
        {actionsChild && isFullscreen && actionsChild}
      </div>
    </div>
  );
}

export default Modal;
