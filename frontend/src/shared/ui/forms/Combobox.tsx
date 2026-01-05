/**
 * Combobox Component
 *
 * A fully accessible, searchable dropdown supporting both local filtering and
 * async data loading. Implements the WAI-ARIA Combobox pattern for screen reader support.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE OVERVIEW
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ┌────────────────────────────────────────────────────────────────────────────┐
 * │                           COMBOBOX COMPONENT                               │
 * ├────────────────────────────────────────────────────────────────────────────┤
 * │                                                                            │
 * │  ┌──────────────────────────────────────────────────────────────┐          │
 * │  │  Container (ref forwarded)                                   │          │
 * │  │  ┌─────────────────────────────────────────────────────────┐ │          │
 * │  │  │  Label (optional)                                       │ │          │
 * │  │  └─────────────────────────────────────────────────────────┘ │          │
 * │  │  ┌─────────────────────────────────────────────────────────┐ │          │
 * │  │  │  Input Wrapper                                          │ │          │
 * │  │  │  ┌───────────────────────┬─────────┬──────────────────┐ │ │          │
 * │  │  │  │  Input (combobox)     │ Clear X │ Chevron/Spinner  │ │ │          │
 * │  │  │  │  role="combobox"      │         │                  │ │ │          │
 * │  │  │  └───────────────────────┴─────────┴──────────────────┘ │ │          │
 * │  │  └─────────────────────────────────────────────────────────┘ │          │
 * │  │  ┌─────────────────────────────────────────────────────────┐ │          │
 * │  │  │  Error / Help Text (optional)                           │ │          │
 * │  │  └─────────────────────────────────────────────────────────┘ │          │
 * │  └──────────────────────────────────────────────────────────────┘          │
 * │                                                                            │
 * │  ════════════════════════════════════════════════════════════════════════  │
 * │                          PORTAL BOUNDARY                                   │
 * │  ════════════════════════════════════════════════════════════════════════  │
 * │                                                                            │
 * │  ┌─────────────────────────────────────────────────────────────┐           │
 * │  │  Dropdown (rendered in document.body via Portal)            │           │
 * │  │  ┌────────────────────────────────────────────────────────┐ │           │
 * │  │  │  <ul role="listbox">                                   │ │           │
 * │  │  │    <li role="option"> Option 1 </li>                   │ │           │
 * │  │  │    <li role="option"> Option 2 (highlighted) </li>     │ │           │
 * │  │  │    <li role="option"> Option 3 (selected ✓) </li>      │ │           │
 * │  │  │    <li> + Create "new item" </li>  (optional)          │ │           │
 * │  │  └────────────────────────────────────────────────────────┘ │           │
 * │  └─────────────────────────────────────────────────────────────┘           │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * TWO MODES OF OPERATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 1. LOCAL MODE (options prop)
 *    - All options provided upfront
 *    - Client-side filtering as user types
 *    - No network requests
 *    - Best for: small lists (< 100 items)
 *
 *    ```tsx
 *    <Combobox
 *      options={[
 *        { id: 1, label: 'Apple' },
 *        { id: 2, label: 'Banana' },
 *      ]}
 *      value={selected}
 *      onChange={(id, option) => setSelected(id)}
 *    />
 *    ```
 *
 * 2. ASYNC MODE (loadOptions prop)
 *    - Options fetched from server based on search query
 *    - Debounced requests (default 300ms)
 *    - Request cancellation on new search
 *    - Best for: large datasets, server-side filtering
 *
 *    ```tsx
 *    <Combobox
 *      loadOptions={async (query) => {
 *        const response = await fetch(`/api/customers?search=${query}`);
 *        return response.json();
 *      }}
 *      value={customerId}
 *      onChange={(id, option) => setCustomerId(id)}
 *      initialLabel={customer?.name}  // Show label before options load
 *    />
 *    ```
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * KEY FEATURES
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * - Search highlighting: Matching text highlighted in copper color
 * - Keyboard navigation: Arrow keys, Enter, Escape, Tab
 * - "Create new" action: Optional inline creation when no match exists
 * - Portal rendering: Dropdown escapes parent overflow/backdrop-blur
 * - Accessible: Full WAI-ARIA Combobox pattern with screen reader support
 * - Steel/Copper theme: Consistent with project design system
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ACCESSIBILITY (WAI-ARIA COMBOBOX PATTERN)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This component follows the WAI-ARIA Combobox pattern:
 * - Input has role="combobox" with aria-expanded, aria-controls, aria-haspopup
 * - aria-activedescendant points to the currently highlighted option
 * - Dropdown has role="listbox" with unique id
 * - Each option has role="option" with aria-selected, aria-disabled
 * - Keyboard navigation follows ARIA best practices
 *
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 */

import {
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/cn';
import { Spinner } from '../primitives/Spinner';

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a single option in the combobox dropdown.
 *
 * @example
 * const option: ComboboxOption = {
 *   id: 123,
 *   label: 'Samsung Electronics',
 *   description: 'Major electronics manufacturer',
 *   disabled: false,
 * };
 */
export interface ComboboxOption {
  /** Unique identifier for the option (used as value) */
  id: string | number;
  /** Display text shown in the dropdown */
  label: string;
  /** Optional secondary text shown below the label */
  description?: string;
  /** Whether this option cannot be selected */
  disabled?: boolean;
}

/**
 * Props for the Combobox component.
 *
 * The component operates in one of two modes:
 * - LOCAL: Provide `options` array for client-side filtering
 * - ASYNC: Provide `loadOptions` function for server-side search
 */
export interface ComboboxProps {
  // ─────────────────────────────────────────────────────────────────────────
  // Core Props (Required)
  // ─────────────────────────────────────────────────────────────────────────

  /** Current selected value (option id), or null if nothing selected */
  value: string | number | null;

  /**
   * Callback fired when selection changes.
   * @param value - The selected option's id, or null if cleared
   * @param option - The full option object, or null if cleared
   */
  onChange: (value: string | number | null, option: ComboboxOption | null) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Data Source (Pick ONE)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Static options for LOCAL mode.
   * When provided, filtering happens client-side.
   * Mutually exclusive with loadOptions (if both provided, loadOptions takes precedence).
   */
  options?: ComboboxOption[];

  /**
   * Async function for ASYNC mode.
   * Called with the debounced search query, should return matching options.
   * The function is called whenever the dropdown opens or search query changes.
   *
   * @example
   * loadOptions={async (query) => {
   *   const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
   *   return res.json();
   * }}
   */
  loadOptions?: (query: string) => Promise<ComboboxOption[]>;

  // ─────────────────────────────────────────────────────────────────────────
  // Optional Features
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Callback to create a new option when no match exists.
   * When provided, shows "Create [query]" button at bottom of dropdown.
   *
   * @example
   * onCreateNew={(label) => {
   *   const newCustomer = await createCustomer({ name: label });
   *   setCustomerId(newCustomer.id);
   * }}
   */
  onCreateNew?: (label: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Form Integration
  // ─────────────────────────────────────────────────────────────────────────

  /** Field label displayed above the input */
  label?: string;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Marks field as required (shows * indicator) */
  required?: boolean;
  /** Disables the entire combobox */
  disabled?: boolean;
  /** Error message displayed below the input (red styling) */
  error?: string;
  /** Help text displayed below the input (when no error) */
  helpText?: string;

  // ─────────────────────────────────────────────────────────────────────────
  // Async Mode Configuration
  // ─────────────────────────────────────────────────────────────────────────

  /** Debounce delay in milliseconds for async search (default: 300) */
  debounceMs?: number;
  /** Text shown when no results match the search query */
  noResultsText?: string;
  /** Text shown while async options are loading */
  loadingText?: string;

  /**
   * Initial display label for async mode.
   * Used when value is pre-selected but options haven't loaded yet.
   * Without this, the input would be empty until first search completes.
   *
   * @example
   * // When editing a form with existing data
   * <Combobox
   *   value={project.customerId}
   *   loadOptions={searchCustomers}
   *   initialLabel={project.customerName}  // Shows name while loading
   * />
   */
  initialLabel?: string | null;

  // ─────────────────────────────────────────────────────────────────────────
  // Styling
  // ─────────────────────────────────────────────────────────────────────────

  /** Additional CSS classes for the container element */
  className?: string;
}

// ============================================================================
// Utility Hooks & Functions
// ============================================================================

/**
 * Custom hook that debounces a value by the specified delay.
 * Returns the debounced value that updates only after `delay` ms of inactivity.
 *
 * Used to prevent excessive API calls while user is still typing.
 *
 * @example
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebounce(query, 300);
 * // debouncedQuery updates 300ms after user stops typing
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Highlights matching portions of text with a styled <mark> element.
 * Used to show which part of option labels match the search query.
 *
 * The function:
 * 1. Escapes regex special characters in the query
 * 2. Splits text by matches (case-insensitive)
 * 3. Wraps matching parts in copper-colored <mark> tags
 *
 * @example
 * highlightMatch('Samsung Electronics', 'sam')
 * // Returns: [<mark>Sam</mark>, <span>sung Electronics</span>]
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  // Escape regex special characters to prevent regex injection
  // e.g., "C++" becomes "C\+\+" so it matches literally
  const escaped = query.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, startIndex) => {
    // Use composite key (index + content) to avoid key collisions
    // Pure index keys are discouraged as they cause issues with reordering
    const key = `${startIndex}-${part}`;
    return regex.test(part) ? (
      <mark key={key} className="bg-copper-500/30 text-copper-300">
        {part}
      </mark>
    ) : (
      <span key={key}>{part}</span>
    );
  });
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
      initialLabel,
    },
    ref
  ) => {
    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    /** Whether the dropdown is currently visible */
    const [isOpen, setIsOpen] = useState(false);

    /** Current search query typed by user (cleared when dropdown closes) */
    const [query, setQuery] = useState('');

    /** Index of currently highlighted option (for keyboard navigation) */
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    /** Options loaded from async source (only used in ASYNC mode) */
    const [asyncOptions, setAsyncOptions] = useState<ComboboxOption[]>([]);

    /** Whether async options are currently being fetched */
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Absolute position of dropdown (calculated from container's bounding rect).
     * Portal rendering requires absolute coordinates since dropdown is in document.body.
     */
    const [dropdownPosition, setDropdownPosition] = useState<{
      top: number;
      left: number;
      width: number;
    } | null>(null);

    // ═══════════════════════════════════════════════════════════════════════
    // REFS
    // ═══════════════════════════════════════════════════════════════════════

    /** Reference to the outermost container div */
    const containerRef = useRef<HTMLDivElement>(null);

    /** Reference to the text input element */
    const inputRef = useRef<HTMLInputElement>(null);

    /** Reference to the dropdown list (for scrolling highlighted item into view) */
    const listRef = useRef<HTMLUListElement>(null);

    /** Reference to the dropdown container (for click-outside detection) */
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ═══════════════════════════════════════════════════════════════════════
    // ACCESSIBILITY IDs
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generate unique IDs for ARIA relationships.
     * useId() ensures unique IDs even with multiple Combobox instances.
     *
     * These IDs connect:
     * - Input (aria-controls) → Listbox (id)
     * - Input (aria-activedescendant) → Highlighted Option (id)
     */
    const instanceId = useId();
    const listboxId = `${instanceId}-listbox`;
    const getOptionId = (index: number) => `${instanceId}-option-${index}`;

    // ═══════════════════════════════════════════════════════════════════════
    // DERIVED STATE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Debounced query for async mode.
     * In local mode, debounce is 0 (instant filtering).
     * In async mode, waits for user to stop typing before making request.
     */
    const debouncedQuery = useDebounce(query, loadOptions ? debounceMs : 0);

    /**
     * Current list of options to display in dropdown.
     *
     * Logic:
     * - ASYNC mode: Return whatever was fetched (asyncOptions)
     * - LOCAL mode: Filter staticOptions by query (case-insensitive)
     *
     * Filtering checks both label and description fields.
     */
    const filteredOptions = useMemo(() => {
      // ASYNC MODE: Server handles filtering, just return fetched options
      if (loadOptions) {
        return asyncOptions;
      }

      // LOCAL MODE: Client-side filtering
      if (!staticOptions) return [];

      // No query = show all options
      if (!query.trim()) return staticOptions;

      // Filter by label or description match
      const lowerQuery = query.toLowerCase();
      return staticOptions.filter(
        opt =>
          opt.label.toLowerCase().includes(lowerQuery) ||
          opt.description?.toLowerCase().includes(lowerQuery)
      );
    }, [staticOptions, asyncOptions, loadOptions, query]);

    /**
     * Find the full option object for the current value.
     * Used to display the selected option's label in the input.
     *
     * Checks both static and async options since value could come from either.
     */
    const selectedOption = useMemo(() => {
      if (value === null) return null;

      // Check static options first
      if (staticOptions) {
        const found = staticOptions.find(opt => opt.id === value);
        if (found) return found;
      }

      // Check async options (may contain the selected option from previous search)
      const found = asyncOptions.find(opt => opt.id === value);
      return found || null;
    }, [value, staticOptions, asyncOptions]);

    // ═══════════════════════════════════════════════════════════════════════
    // ASYNC LOADING EFFECT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Abort controller for cancelling in-flight requests.
     * Stored in ref to persist across renders without triggering re-renders.
     */
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Effect to load options in ASYNC mode.
     *
     * Triggers when:
     * - loadOptions function changes
     * - Debounced query changes
     * - Dropdown opens
     *
     * Features:
     * - Cancels previous request when new one starts (race condition prevention)
     * - Sets loading state via Promise.resolve() to avoid sync cascading renders
     * - Cleans up by aborting on unmount or re-run
     */
    useEffect(() => {
      // Only runs in ASYNC mode when dropdown is open
      if (!loadOptions || !isOpen) return;

      // Cancel any previous in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Set loading state asynchronously to avoid React state update warnings
      // This is a pattern to defer state updates when inside an effect
      Promise.resolve().then(() => {
        if (controller.signal.aborted) return;
        setIsLoading(true);
      });

      // Execute the async load function
      loadOptions(debouncedQuery)
        .then(opts => {
          // Only update state if this request wasn't cancelled
          if (!controller.signal.aborted) {
            setAsyncOptions(opts);
            setHighlightedIndex(0); // Reset highlight to first option
          }
        })
        .catch(() => {
          // On error, clear options (could also show error state)
          if (!controller.signal.aborted) {
            setAsyncOptions([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });

      // Cleanup: abort request if effect re-runs or component unmounts
      return () => controller.abort();
    }, [loadOptions, debouncedQuery, isOpen]);

    // ═══════════════════════════════════════════════════════════════════════
    // DROPDOWN POSITIONING EFFECT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Calculates and updates dropdown position when it opens.
     *
     * Uses useLayoutEffect (not useEffect) because:
     * - Position must be calculated before browser paint
     * - Prevents visual flicker of dropdown appearing in wrong position
     *
     * The dropdown is rendered via Portal (in document.body), so we need
     * absolute coordinates calculated from the container's bounding rect.
     *
     * Also listens for scroll/resize to reposition dropdown dynamically.
     */
    useLayoutEffect(() => {
      if (!isOpen || !containerRef.current) return;

      const updatePosition = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        setDropdownPosition({
          // Position below the input with 4px gap
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width, // Match input width
        });
      };

      // Initial position calculation
      updatePosition();

      // Re-calculate on scroll (use capture phase to catch all scroll events)
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
        setDropdownPosition(null);
      };
    }, [isOpen]);

    // ═══════════════════════════════════════════════════════════════════════
    // CLICK OUTSIDE DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Closes dropdown when clicking outside both the input and dropdown.
     *
     * Why check both containerRef AND dropdownRef?
     * Because dropdown is rendered via Portal (separate DOM tree), so clicking
     * the dropdown is technically "outside" the container.
     */
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        const isInsideContainer = containerRef.current?.contains(target);
        const isInsideDropdown = dropdownRef.current?.contains(target);

        if (!isInsideContainer && !isInsideDropdown) {
          setIsOpen(false);
          setQuery(''); // Clear search when closing
        }
      };

      // Use mousedown (not click) to close before focus changes
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // SCROLL INTO VIEW EFFECT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Ensures the highlighted option is visible in the scrollable dropdown.
     * Called whenever highlightedIndex changes (keyboard navigation).
     */
    useEffect(() => {
      if (!listRef.current || !isOpen) return;

      const highlighted = listRef.current.querySelector('[data-highlighted="true"]');
      if (highlighted) {
        // 'nearest' scrolls minimum amount to make element visible
        highlighted.scrollIntoView({ block: 'nearest' });
      }
    }, [highlightedIndex, isOpen]);

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Handles selecting an option (via click or keyboard).
     * Calls onChange, closes dropdown, and clears search query.
     */
    const handleSelect = useCallback(
      (option: ComboboxOption) => {
        if (option.disabled) return;
        onChange(option.id, option);
        setIsOpen(false);
        setQuery('');
      },
      [onChange]
    );

    /**
     * Handles clicking the clear (X) button.
     * Stops propagation to prevent dropdown from reopening.
     */
    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent container click from reopening dropdown
        onChange(null, null);
        setQuery('');
      },
      [onChange]
    );

    /**
     * Handles clicking the "Create new" option.
     * Calls onCreateNew callback with the current query.
     */
    const handleCreateNew = useCallback(() => {
      if (onCreateNew && query.trim()) {
        onCreateNew(query.trim());
        setIsOpen(false);
        setQuery('');
      }
    }, [onCreateNew, query]);

    /**
     * Keyboard navigation handler.
     *
     * When CLOSED:
     * - Enter/ArrowDown/Space: Open dropdown
     *
     * When OPEN:
     * - ArrowDown: Move highlight down
     * - ArrowUp: Move highlight up
     * - Enter: Select highlighted option (or create new if no options)
     * - Escape: Close dropdown
     * - Tab: Close dropdown (allow natural tab navigation)
     */
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        // Open dropdown on these keys when closed
        if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // Move down, but don't go past last option
          setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
          break;

        case 'ArrowUp':
          e.preventDefault();
          // Move up, but don't go before first option
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;

        case 'Enter':
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            // Select the highlighted option
            handleSelect(filteredOptions[highlightedIndex]);
          } else if (onCreateNew && query.trim() && filteredOptions.length === 0) {
            // No options but can create: create new
            handleCreateNew();
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setQuery('');
          break;

        case 'Tab':
          // Don't prevent default - allow natural tab navigation
          setIsOpen(false);
          setQuery('');
          break;
      }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Determines whether to show the "Create new" option.
     *
     * Shows when:
     * - onCreateNew callback is provided
     * - User has typed something
     * - No option matches the query exactly (case-insensitive)
     */
    const showCreateOption =
      onCreateNew &&
      query.trim() &&
      !filteredOptions.some(opt => opt.label.toLowerCase() === query.toLowerCase());

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    return (
      <div
        ref={node => {
          // Forward ref while also storing in containerRef
          containerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn('relative', className)}
      >
        {/* ─────────────────────────────────────────────────────────────────
            LABEL
        ───────────────────────────────────────────────────────────────── */}
        {label && (
          <label className="mb-2 block text-sm font-medium text-steel-300">
            {label}
            {required && <span className="text-red-400"> *</span>}
          </label>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            INPUT WRAPPER
            Clicking anywhere on this container focuses the input and opens dropdown.
            Using eslint-disable because this is a valid UX pattern where the
            click handler delegates to the focusable input inside.
        ───────────────────────────────────────────────────────────────── */}
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
          {/* ─────────────────────────────────────────────────────────────
              COMBOBOX INPUT
              The main interactive element with full ARIA support.

              Value logic:
              - When OPEN: Show the search query (user is typing)
              - When CLOSED: Show selected option's label, or initialLabel, or empty
          ───────────────────────────────────────────────────────────── */}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-controls={listboxId}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-activedescendant={isOpen ? getOptionId(highlightedIndex) : undefined}
            aria-autocomplete="list"
            value={isOpen ? query : selectedOption?.label || initialLabel || ''}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => {
              if (!disabled) {
                setIsOpen(true);
                // Clear query when focusing so user starts fresh search
                if (selectedOption || initialLabel) setQuery('');
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={selectedOption?.label || initialLabel || placeholder}
            disabled={disabled}
            className={cn(
              'h-full flex-1 bg-transparent px-3 text-sm outline-none',
              'placeholder-steel-500',
              disabled ? 'cursor-not-allowed text-steel-500' : 'text-white'
            )}
          />

          {/* ─────────────────────────────────────────────────────────────
              CLEAR BUTTON
              Only visible when there's a selection and not disabled.
          ───────────────────────────────────────────────────────────── */}
          {(selectedOption || (value !== null && initialLabel)) && !disabled && (
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

          {/* ─────────────────────────────────────────────────────────────
              DROPDOWN INDICATOR
              Shows spinner when loading, chevron otherwise.
              Chevron rotates 180° when dropdown is open.
          ───────────────────────────────────────────────────────────── */}
          <div className="mr-3 text-steel-400">
            {isLoading ? (
              <Spinner size="sm" variant="steel" label="Loading options" />
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

        {/* ─────────────────────────────────────────────────────────────────
            ERROR / HELP TEXT
        ───────────────────────────────────────────────────────────────── */}
        {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
        {helpText && !error && (
          <span className="mt-1 block text-xs text-steel-500">{helpText}</span>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            DROPDOWN (PORTAL)

            Rendered via createPortal to document.body because:
            1. Escapes parent overflow:hidden containers
            2. Escapes backdrop-blur effects
            3. Ensures correct z-index stacking
            4. Prevents clipping by modal/dialog boundaries

            Position is calculated absolutely based on container's bounding rect.
        ───────────────────────────────────────────────────────────────── */}
        {isOpen &&
          dropdownPosition &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
              }}
              className={cn(
                'z-[9999] max-h-64 overflow-hidden rounded-lg border border-steel-700/50',
                'bg-steel-800 shadow-xl shadow-black/20',
                'animate-in fade-in-0 zoom-in-95 duration-150'
              )}
            >
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                className="max-h-56 overflow-y-auto py-1"
              >
                {/* ───────────────────────────────────────────────────────
                    LOADING STATE
                ─────────────────────────────────────────────────────── */}
                {isLoading && (
                  <li className="flex items-center gap-2 px-3 py-2 text-sm text-steel-400">
                    <Spinner size="sm" variant="steel" label="Loading" />
                    {loadingText}
                  </li>
                )}

                {/* ───────────────────────────────────────────────────────
                    EMPTY STATE
                ─────────────────────────────────────────────────────── */}
                {!isLoading && filteredOptions.length === 0 && !showCreateOption && (
                  <li className="px-3 py-2 text-sm text-steel-400">{noResultsText}</li>
                )}

                {/* ───────────────────────────────────────────────────────
                    OPTIONS LIST
                    Each option is a <li role="option"> following WAI-ARIA.
                ─────────────────────────────────────────────────────── */}
                {!isLoading &&
                  filteredOptions.map((option, index) => {
                    const isHighlighted = index === highlightedIndex;
                    const isSelected = option.id === value;

                    return (
                      <li
                        key={option.id}
                        id={getOptionId(index)}
                        role="option"
                        tabIndex={isHighlighted ? 0 : -1}
                        aria-selected={isSelected}
                        aria-disabled={option.disabled}
                        data-highlighted={isHighlighted}
                        onClick={() => handleSelect(option)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelect(option);
                          }
                        }}
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
                          {/* Checkmark for selected option */}
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
                        {/* Optional description below label */}
                        {option.description && (
                          <p className="mt-0.5 text-xs text-steel-400">
                            {highlightMatch(option.description, query)}
                          </p>
                        )}
                      </li>
                    );
                  })}

                {/* ───────────────────────────────────────────────────────
                    CREATE NEW OPTION
                    Shows at the bottom when no exact match and onCreateNew provided.
                ─────────────────────────────────────────────────────── */}
                {showCreateOption && (
                  <li
                    id={getOptionId(filteredOptions.length)}
                    role="option"
                    tabIndex={highlightedIndex === filteredOptions.length ? 0 : -1}
                    aria-selected={false}
                    onClick={handleCreateNew}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCreateNew();
                      }
                    }}
                    onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                    data-highlighted={highlightedIndex === filteredOptions.length}
                    className={cn(
                      'cursor-pointer border-t border-steel-700/50 px-3 py-2 transition-colors',
                      highlightedIndex === filteredOptions.length && 'bg-steel-700/50'
                    )}
                  >
                    <div className="flex items-center gap-2 text-sm text-copper-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
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
            </div>,
            document.body
          )}
      </div>
    );
  }
);

Combobox.displayName = 'Combobox';

export default Combobox;
