/**
 * Alert component for displaying contextual feedback messages
 *
 * Features:
 * - Multiple variants (info, success, warning, error)
 * - Optional dismiss functionality
 * - Automatic icon based on variant
 * - Accessibility with role="alert"
 *
 * Usage:
 * ```tsx
 * <Alert variant="error">Failed to load data</Alert>
 * <Alert variant="success" onClose={handleDismiss}>Operation completed</Alert>
 * ```
 */

import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  /** Alert type/severity */
  variant?: AlertVariant;
  /** Optional dismiss handler (shows close button if provided) */
  onClose?: () => void;
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  info: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  success: 'border-green-500/20 bg-green-500/10 text-green-400',
  warning: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
  error: 'border-red-500/20 bg-red-500/10 text-red-400',
};

function AlertIcon({ variant }: Readonly<{ variant: AlertVariant }>) {
  switch (variant) {
    case 'error':
      return (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case 'success':
      return (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

export function Alert({ variant = 'info', onClose, children, className }: Readonly<AlertProps>) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm',
        variantClasses[variant],
        className
      )}
    >
      <AlertIcon variant={variant} />
      <span className="flex-1">{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss alert"
          className="shrink-0 rounded p-1 transition-colors hover:bg-white/10"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Alert;
