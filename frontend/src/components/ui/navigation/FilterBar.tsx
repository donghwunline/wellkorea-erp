/**
 * FilterBar component for filter dropdowns
 *
 * A wrapper component that provides consistent styling for filter controls.
 * Works with native select elements and can be extended for custom filters.
 */

import type { HTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function FilterBar({ children, className, ...props }: Readonly<FilterBarProps>) {
  return (
    <div className={cn('flex flex-wrap items-end gap-4', className)} {...props}>
      {children}
    </div>
  );
}

FilterBar.displayName = 'FilterBar';

// FilterBar.Field - Individual filter field with label
export interface FilterFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  children: ReactNode;
}

export function FilterField({ label, children, className, ...props }: Readonly<FilterFieldProps>) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      <label className="text-xs font-medium uppercase tracking-wider text-steel-500">
        {label}
      </label>
      {children}
    </div>
  );
}

FilterField.displayName = 'FilterField';

// FilterBar.Select - Styled select element
export interface FilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function FilterSelect({
                               value,
                               onValueChange,
                               options,
                               placeholder = 'All',
                               className,
                               ...props
                             }: Readonly<FilterSelectProps>) {
  return (
    <select
      value={value}
      onChange={e => onValueChange(e.target.value)}
      className={cn(
        'h-10 rounded-lg border border-steel-700/50 bg-steel-900/60 px-3 py-2',
        'text-sm text-white',
        'transition-colors',
        'focus:border-copper-500/50 focus:outline-none focus:ring-2 focus:ring-copper-500/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

FilterSelect.displayName = 'FilterSelect';

// Compound component pattern
FilterBar.Field = FilterField;
FilterBar.Select = FilterSelect;

export default FilterBar;
