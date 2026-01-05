/**
 * ErrorAlert component for displaying error messages
 *
 * Provides consistent error message styling with optional dismiss functionality.
 * Use this component for all error states to maintain visual consistency.
 */

import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface ErrorAlertProps extends HTMLAttributes<HTMLDivElement> {
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ message, onDismiss, className, ...props }: Readonly<ErrorAlertProps>) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4',
        className
      )}
      role="alert"
      {...props}
    >
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="flex-1 text-sm text-red-200">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-red-400 transition-colors hover:bg-red-500/20"
          aria-label="Dismiss error"
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

ErrorAlert.displayName = 'ErrorAlert';

export default ErrorAlert;
