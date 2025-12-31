/**
 * IconButton component for icon-only buttons
 *
 * A specialized button wrapper for icon-only actions with consistent styling.
 * Enforces accessibility by requiring aria-label.
 *
 * Variants:
 * - ghost: Transparent with hover (default, most common in tables)
 * - danger: Red for delete actions
 * - primary: Copper accent for primary actions
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '../lib';

export type IconButtonVariant = 'ghost' | 'danger' | 'primary';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  children: ReactNode; // Icon SVG
  'aria-label': string; // Required for accessibility
}

const VARIANT_STYLES: Record<IconButtonVariant, string> = {
  ghost: 'rounded-lg p-2 text-steel-400 transition-colors hover:bg-steel-800 hover:text-white',
  danger: 'rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300',
  primary:
    'rounded-lg p-2 text-copper-400 transition-colors hover:bg-copper-500/10 hover:text-copper-300',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', className, children, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-500/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          VARIANT_STYLES[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
