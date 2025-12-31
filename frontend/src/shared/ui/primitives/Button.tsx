/**
 * Button component with loading state and Tailwind CSS styling.
 *
 * Features:
 * - Multiple variants (primary, secondary, ghost, danger, warning)
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

import { Spinner } from './Spinner';
import { cn } from '../lib';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Loading state (automatically disables button) */
  isLoading?: boolean;
}

// Variant styles - Steel/Copper theme
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-copper-500 text-white hover:bg-copper-600 focus-visible:ring-copper-500/50',
  secondary:
    'bg-steel-800 text-white hover:bg-steel-700 border border-steel-700/50 focus-visible:ring-steel-500/50',
  ghost: 'bg-transparent text-steel-400 hover:bg-steel-800/30 focus-visible:ring-steel-500/20',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/50',
  warning: 'bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500/50',
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
        aria-disabled={isDisabled || undefined}
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
        {isLoading && <Spinner size="sm" variant="white" label="Loading" />}

        {/* Button content */}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
