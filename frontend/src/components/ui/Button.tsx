/**
 * Button component with loading state and Tailwind CSS styling.
 *
 * Features:
 * - Multiple variants (primary, secondary, ghost, danger)
 * - Multiple sizes (sm, md, lg, icon)
 * - Loading state with spinner
 * - Automatic disabled when loading
 * - Forward ref support
 *
 * Usage:
 * ```typescript
 * <Button onClick={handleSave} isLoading={saving}>
 *   Save
 * </Button>
 *
 * <Button variant="secondary" size="sm" isLoading>
 *   Loading...
 * </Button>
 *
 * <Button variant="danger" size="icon" isLoading aria-label="Deleting" />
 * ```
 */

import type { ButtonHTMLAttributes, ForwardedRef } from 'react';
import { forwardRef } from 'react';

// Simple className utility
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Loading state (automatically disables button) */
  isLoading?: boolean;
}

// Variant styles
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400',
  ghost: 'bg-transparent text-gray-900 hover:bg-gray-100 focus-visible:ring-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
};

// Size styles
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
  icon: 'h-10 w-10 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className,
      type = 'button', // prevent accidental form submission
      disabled,
      isLoading = false,
      ...props
    },
    ref: ForwardedRef<HTMLButtonElement>
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          'transition-colors select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          // Gap between spinner and content
          isLoading && size !== 'icon' && 'gap-2',
          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <span className="inline-flex">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </span>
        )}

        {/* Button content */}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
