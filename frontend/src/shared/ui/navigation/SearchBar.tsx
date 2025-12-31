/**
 * SearchBar component for search inputs
 *
 * A controlled input component with search icon and optional clear button.
 * Prevents future duplication of inline search patterns.
 */

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../lib';

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  showClearButton?: boolean;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      value,
      onValueChange,
      onClear,
      placeholder = 'Search...',
      showClearButton = true,
      className,
      ...props
    },
    ref
  ) => {
    const handleClear = () => {
      onValueChange('');
      onClear?.();
    };

    const showClear = showClearButton && value.length > 0;

    return (
      <div className={cn('relative', className)}>
        {/* Search Icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-4 w-4 text-steel-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={e => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'h-10 w-full rounded-lg border border-steel-700/50 bg-steel-800/50',
            'pl-10 pr-10 text-sm text-white placeholder-steel-500',
            'transition-colors',
            'focus:border-copper-500/50 focus:bg-steel-800 focus:outline-none focus:ring-2 focus:ring-copper-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          {...props}
        />

        {/* Clear Button */}
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-steel-500 hover:text-steel-300"
            aria-label="Clear search"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
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
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
