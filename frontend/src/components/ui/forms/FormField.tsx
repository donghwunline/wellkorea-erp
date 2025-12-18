/**
 * FormField component for standardized form inputs
 *
 * Provides consistent styling for labeled input fields with error states.
 * Use this component for all form inputs to maintain visual consistency.
 */

import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/shared/utils';

export interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, value, onChange, error, required, disabled, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-steel-300">
          {label}
          {required && <span className="text-red-400"> *</span>}
        </label>
        <input
          ref={ref}
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'h-10 rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2',
            'text-sm text-white placeholder-steel-500',
            'transition-colors',
            'focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
            className,
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  },
);

FormField.displayName = 'FormField';

export default FormField;
