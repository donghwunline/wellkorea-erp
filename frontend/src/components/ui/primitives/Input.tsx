/**
 * Input component with consistent styling.
 */

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replaceAll(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-steel-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-steel-800/50 px-4 py-2.5',
            'text-sm text-white placeholder-steel-500',
            'border-steel-700/50 focus:border-copper-500/50',
            'focus:outline-none focus:ring-2 focus:ring-copper-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-600',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
