/**
 * Combobox Component
 *
 * A searchable dropdown with support for both local and async options.
 * Designed to scale from small lists to thousands of items.
 *
 * Features:
 * - Local filtering with options prop
 * - Async loading with loadOptions prop
 * - Optional "Create new" action
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Debounced search for async mode
 * - Steel/Copper theme with elegant animations
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/shared/utils';

// ============================================================================
// Types
// ============================================================================

export interface ComboboxOption {
  id: string | number;
  label: string;
  /** Optional description shown below label */
  description?: string;
  /** Whether option is disabled */
  disabled?: boolean;
}

export interface ComboboxProps {
  /** Current selected value (option id) */
  value: string | number | null;
  /** Called when selection changes */
  onChange: (value: string | number | null, option: ComboboxOption | null) => void;
  /** Static options for local filtering */
  options?: ComboboxOption[];
  /** Async function to load options based on search query */
  loadOptions?: (query: string) => Promise<ComboboxOption[]>;
  /** Called when user wants to create a new option (shows "Create new" button) */
  onCreateNew?: (label: string) => void;
  /** Label for the field */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Help text shown below disabled fields */
  helpText?: string;
  /** Debounce delay for async search (ms) */
  debounceMs?: number;
  /** Text shown when no results found */
  noResultsText?: string;
  /** Text shown while loading */
  loadingText?: string;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-copper-500/30 text-copper-300">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// ============================================================================
// Combobox Component
// ============================================================================

export const Combobox = forwardRef<HTMLDivElement, ComboboxProps>(
  (
    {
      value,
      onChange,
      options: staticOptions,
      loadOptions,
      onCreateNew,
      label,
      placeholder = 'Select or search...',
      required,
      disabled,
      error,
      helpText,
      debounceMs = 300,
      noResultsText = 'No results found',
      loadingText = 'Loading...',
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [asyncOptions, setAsyncOptions] = useState<ComboboxOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const debouncedQuery = useDebounce(query, loadOptions ? debounceMs : 0);

    // Get current options (filtered static or async)
    const filteredOptions = useMemo(() => {
      if (loadOptions) {
        return asyncOptions;
      }

      if (!staticOptions) return [];

      if (!query.trim()) return staticOptions;

      const lowerQuery = query.toLowerCase();
      return staticOptions.filter(
        opt =>
          opt.label.toLowerCase().includes(lowerQuery) ||
          opt.description?.toLowerCase().includes(lowerQuery)
      );
    }, [staticOptions, asyncOptions, loadOptions, query]);

    // Find selected option
    const selectedOption = useMemo(() => {
      if (value === null) return null;

      // Check static options first
      if (staticOptions) {
        const found = staticOptions.find(opt => opt.id === value);
        if (found) return found;
      }

      // Check async options
      const found = asyncOptions.find(opt => opt.id === value);
      return found || null;
    }, [value, staticOptions, asyncOptions]);

    // Load async options - using ref to track loading state to avoid setState in effect
    const loadingRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
      if (!loadOptions || !isOpen) {
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Use startTransition or schedule microtask to avoid sync setState
      const timeoutId = setTimeout(() => {
        if (controller.signal.aborted) return;

        loadingRef.current = true;
        setIsLoading(true);

        loadOptions(debouncedQuery)
          .then(opts => {
            if (!controller.signal.aborted) {
              setAsyncOptions(opts);
              setHighlightedIndex(0);
            }
          })
          .catch(() => {
            if (!controller.signal.aborted) {
              setAsyncOptions([]);
            }
          })
          .finally(() => {
            if (!controller.signal.aborted) {
              loadingRef.current = false;
              setIsLoading(false);
            }
          });
      }, 0);

      return () => {
        controller.abort();
        clearTimeout(timeoutId);
      };
    }, [loadOptions, debouncedQuery, isOpen]);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted option into view
    useEffect(() => {
      if (!listRef.current || !isOpen) return;

      const highlighted = listRef.current.querySelector('[data-highlighted="true"]');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' });
      }
    }, [highlightedIndex, isOpen]);

    // Handle selection
    const handleSelect = useCallback(
      (option: ComboboxOption) => {
        if (option.disabled) return;
        onChange(option.id, option);
        setIsOpen(false);
        setQuery('');
      },
      [onChange]
    );

    // Handle clear
    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null, null);
        setQuery('');
      },
      [onChange]
    );

    // Handle create new
    const handleCreateNew = useCallback(() => {
      if (onCreateNew && query.trim()) {
        onCreateNew(query.trim());
        setIsOpen(false);
        setQuery('');
      }
    }, [onCreateNew, query]);

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex]);
          } else if (onCreateNew && query.trim() && filteredOptions.length === 0) {
            handleCreateNew();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setQuery('');
          break;
        case 'Tab':
          setIsOpen(false);
          setQuery('');
          break;
      }
    };

    // Show create option when no exact match
    const showCreateOption =
      onCreateNew &&
      query.trim() &&
      !filteredOptions.some(opt => opt.label.toLowerCase() === query.toLowerCase());

    return (
      <div
        ref={node => {
          containerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn('relative', className)}
        onKeyDown={handleKeyDown}
      >
        {label && (
          <label className="mb-2 block text-sm font-medium text-steel-300">
            {label}
            {required && <span className="text-red-400"> *</span>}
          </label>
        )}

        {/* Input trigger */}
        <div
          className={cn(
            'flex h-10 items-center rounded-lg border transition-all',
            error
              ? 'border-red-500/50 focus-within:border-red-500/50 focus-within:ring-red-500/20'
              : 'border-steel-700/50 focus-within:border-copper-500/50 focus-within:ring-copper-500/20',
            disabled
              ? 'cursor-not-allowed bg-steel-900/40 opacity-50'
              : 'cursor-text bg-steel-900/60',
            'focus-within:ring-2'
          )}
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
              inputRef.current?.focus();
            }
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? query : selectedOption?.label || ''}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => {
              if (!disabled) {
                setIsOpen(true);
                if (selectedOption) setQuery('');
              }
            }}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            disabled={disabled}
            className={cn(
              'h-full flex-1 bg-transparent px-3 text-sm outline-none',
              'placeholder-steel-500',
              disabled ? 'cursor-not-allowed text-steel-500' : 'text-white'
            )}
          />

          {/* Clear button */}
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="mr-1 rounded p-1 text-steel-400 transition-colors hover:bg-steel-700/50 hover:text-white"
              aria-label="Clear selection"
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

          {/* Dropdown indicator */}
          <div className="mr-3 text-steel-400">
            {isLoading ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
        </div>

        {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
        {helpText && !error && (
          <span className="mt-1 block text-xs text-steel-500">{helpText}</span>
        )}

        {/* Dropdown */}
        {isOpen && (
          <div
            className={cn(
              'absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-lg border border-steel-700/50',
              'bg-steel-800 shadow-xl shadow-black/20',
              'animate-in fade-in-0 zoom-in-95 duration-150'
            )}
          >
            <ul ref={listRef} className="max-h-56 overflow-y-auto py-1">
              {isLoading && (
                <li className="flex items-center gap-2 px-3 py-2 text-sm text-steel-400">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {loadingText}
                </li>
              )}

              {!isLoading && filteredOptions.length === 0 && !showCreateOption && (
                <li className="px-3 py-2 text-sm text-steel-400">{noResultsText}</li>
              )}

              {!isLoading &&
                filteredOptions.map((option, index) => {
                  const isHighlighted = index === highlightedIndex;
                  const isSelected = option.id === value;

                  return (
                    <li
                      key={option.id}
                      data-highlighted={isHighlighted}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        'cursor-pointer px-3 py-2 transition-colors',
                        option.disabled && 'cursor-not-allowed opacity-50',
                        isHighlighted && 'bg-steel-700/50',
                        isSelected && 'bg-copper-500/10'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-sm',
                            isSelected ? 'font-medium text-copper-400' : 'text-white'
                          )}
                        >
                          {highlightMatch(option.label, query)}
                        </span>
                        {isSelected && (
                          <svg
                            className="h-4 w-4 text-copper-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      {option.description && (
                        <p className="mt-0.5 text-xs text-steel-400">
                          {highlightMatch(option.description, query)}
                        </p>
                      )}
                    </li>
                  );
                })}

              {/* Create new option */}
              {showCreateOption && (
                <li
                  onClick={handleCreateNew}
                  onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                  data-highlighted={highlightedIndex === filteredOptions.length}
                  className={cn(
                    'cursor-pointer border-t border-steel-700/50 px-3 py-2 transition-colors',
                    highlightedIndex === filteredOptions.length && 'bg-steel-700/50'
                  )}
                >
                  <div className="flex items-center gap-2 text-sm text-copper-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create &quot;{query}&quot;
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

Combobox.displayName = 'Combobox';

export default Combobox;
