/**
 * DatePicker Component
 *
 * A beautiful, accessible date picker with calendar popover.
 * Supports single date and range selection modes.
 *
 * Features:
 * - Single date or date range selection
 * - Min/max date constraints
 * - Dropdown (popover) or inline display modes
 * - Keyboard navigation
 * - Steel/Copper theme with elegant animations
 */

import {
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/shared/lib/cn';

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface DatePickerProps {
  /** Selection mode */
  mode?: 'single' | 'range';
  /** Display mode */
  display?: 'dropdown' | 'inline';
  /** Current value (YYYY-MM-DD string for single, DateRange for range) */
  value: string | DateRange;
  /** Called when value changes */
  onChange: (value: string | DateRange) => void;
  /** Minimum selectable date (YYYY-MM-DD) */
  min?: string;
  /** Maximum selectable date (YYYY-MM-DD) */
  max?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Label for the field */
  label?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether to show clear button when value is selected */
  clearable?: boolean;
  /** Error message */
  error?: string;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = parseDate(dateStr);
  if (!date) return '';
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

function isDateDisabled(date: Date, min: string | undefined, max: string | undefined): boolean {
  if (min) {
    const minDate = parseDate(min);
    if (minDate && date < minDate) return true;
  }
  if (max) {
    const maxDate = parseDate(max);
    if (maxDate && date > maxDate) return true;
  }
  return false;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ============================================================================
// Calendar Component
// ============================================================================

interface CalendarProps {
  mode: 'single' | 'range';
  selectedDate: string | null;
  rangeStart: string | null;
  rangeEnd: string | null;
  hoveredDate: Date | null;
  onSelect: (date: Date) => void;
  onHover: (date: Date | null) => void;
  min?: string;
  max?: string;
  viewMonth: number;
  viewYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

function Calendar({
  mode,
  selectedDate,
  rangeStart,
  rangeEnd,
  hoveredDate,
  onSelect,
  onHover,
  min,
  max,
  viewMonth,
  viewYear,
  onMonthChange,
  onYearChange,
}: Readonly<CalendarProps>) {
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedParsed = parseDate(selectedDate);
  const rangeStartParsed = parseDate(rangeStart);
  const rangeEndParsed = parseDate(rangeEnd);

  const prevMonth = () => {
    if (viewMonth === 0) {
      onMonthChange(11);
      onYearChange(viewYear - 1);
    } else {
      onMonthChange(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      onMonthChange(0);
      onYearChange(viewYear + 1);
    } else {
      onMonthChange(viewMonth + 1);
    }
  };

  const days: (Date | null)[] = [];

  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add all days in the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(viewYear, viewMonth, i));
  }

  return (
    <div className="select-none">
      {/* Header with month/year navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-md p-1.5 text-steel-400 transition-colors hover:bg-steel-700/50 hover:text-white"
          aria-label="Previous month"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <select
            value={viewMonth}
            onChange={e => onMonthChange(Number(e.target.value))}
            className="rounded bg-transparent px-1 py-0.5 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-copper-500/50"
          >
            {MONTHS.map((month, idx) => (
              <option key={month} value={idx} className="bg-steel-800">
                {month}
              </option>
            ))}
          </select>
          <select
            value={viewYear}
            onChange={e => onYearChange(Number(e.target.value))}
            className="rounded bg-transparent px-1 py-0.5 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-copper-500/50"
          >
            {Array.from({ length: 20 }, (_, i) => viewYear - 10 + i).map(year => (
              <option key={year} value={year} className="bg-steel-800">
                {year}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={nextMonth}
          className="rounded-md p-1.5 text-steel-400 transition-colors hover:bg-steel-700/50 hover:text-white"
          aria-label="Next month"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAYS.map(day => (
          <div key={day} className="py-1 text-center text-xs font-medium text-steel-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="h-8 w-8" />;
          }

          const isDisabled = isDateDisabled(date, min, max);
          const isToday = isSameDay(date, today);
          const isSelected = mode === 'single' && selectedParsed && isSameDay(date, selectedParsed);
          const isRangeStart = rangeStartParsed && isSameDay(date, rangeStartParsed);
          const isRangeEnd = rangeEndParsed && isSameDay(date, rangeEndParsed);
          const isInRange =
            mode === 'range' && isDateInRange(date, rangeStartParsed, rangeEndParsed);
          const isInHoverRange =
            mode === 'range' &&
            rangeStartParsed &&
            !rangeEndParsed &&
            hoveredDate &&
            isDateInRange(
              date,
              rangeStartParsed < hoveredDate ? rangeStartParsed : hoveredDate,
              rangeStartParsed < hoveredDate ? hoveredDate : rangeStartParsed
            );

          const dateLabel = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(date)}
              onMouseEnter={() => onHover(date)}
              onMouseLeave={() => onHover(null)}
              aria-label={dateLabel}
              className={cn(
                'relative h-8 w-8 rounded-md text-sm font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-copper-500/50 focus:ring-offset-1 focus:ring-offset-steel-800',
                // Default state
                !isDisabled &&
                  !isSelected &&
                  !isRangeStart &&
                  !isRangeEnd &&
                  !isInRange &&
                  !isInHoverRange &&
                  'text-steel-300 hover:bg-steel-700/50 hover:text-white',
                // Today indicator
                isToday &&
                  !isSelected &&
                  !isRangeStart &&
                  !isRangeEnd &&
                  'ring-1 ring-copper-500/30',
                // Selected (single mode)
                isSelected && 'bg-copper-500 text-white shadow-lg shadow-copper-500/25',
                // Range start/end
                (isRangeStart || isRangeEnd) &&
                  'bg-copper-500 text-white shadow-lg shadow-copper-500/25',
                // In range
                isInRange && !isRangeStart && !isRangeEnd && 'bg-copper-500/20 text-copper-300',
                // Hover range preview
                isInHoverRange && !isRangeStart && 'bg-copper-500/10 text-copper-400',
                // Disabled
                isDisabled && 'cursor-not-allowed text-steel-600 opacity-50'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// DatePicker Component
// ============================================================================

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      mode = 'single',
      display = 'dropdown',
      value,
      onChange,
      min,
      max,
      placeholder = 'Select date',
      label,
      required,
      disabled,
      clearable = true,
      error,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(display === 'inline');
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);

    // Parse current value
    const singleValue = mode === 'single' ? (value as string) : null;
    const rangeValue = mode === 'range' ? (value as DateRange) : null;

    // View state for calendar navigation
    const initialDate = useMemo(() => {
      if (mode === 'single' && singleValue) {
        return parseDate(singleValue) || new Date();
      }
      if (mode === 'range' && rangeValue?.start) {
        return parseDate(rangeValue.start) || new Date();
      }
      return new Date();
    }, [mode, singleValue, rangeValue]);

    const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
    const [viewYear, setViewYear] = useState(initialDate.getFullYear());

    // Close on outside click
    useEffect(() => {
      if (display === 'inline') return;

      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [display]);

    // Handle date selection
    const handleSelect = useCallback(
      (date: Date) => {
        const dateStr = formatDate(date);

        if (mode === 'single') {
          onChange(dateStr);
          if (display === 'dropdown') setIsOpen(false);
        } else {
          // Range mode
          const currentRange = rangeValue || { start: null, end: null };

          if (!currentRange.start || (currentRange.start && currentRange.end)) {
            // Start new range
            onChange({ start: dateStr, end: null });
          } else {
            // Complete range
            const startDate = parseDate(currentRange.start)!;
            if (date < startDate) {
              onChange({ start: dateStr, end: currentRange.start });
            } else {
              onChange({ start: currentRange.start, end: dateStr });
            }
            if (display === 'dropdown') setIsOpen(false);
          }
        }
      },
      [mode, onChange, rangeValue, display]
    );

    // Handle clear button click
    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent dropdown from opening
        if (mode === 'single') {
          onChange('');
        } else {
          onChange({ start: null, end: null });
        }
      },
      [mode, onChange]
    );

    // Keyboard handler
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    };

    // Display value
    const displayValue = useMemo(() => {
      if (mode === 'single') {
        return formatDisplayDate(singleValue);
      }
      if (rangeValue?.start && rangeValue?.end) {
        return `${formatDisplayDate(rangeValue.start)} - ${formatDisplayDate(rangeValue.end)}`;
      }
      if (rangeValue?.start) {
        return `${formatDisplayDate(rangeValue.start)} - ...`;
      }
      return '';
    }, [mode, singleValue, rangeValue]);

    const calendar = (
      <Calendar
        mode={mode}
        selectedDate={singleValue}
        rangeStart={rangeValue?.start || null}
        rangeEnd={rangeValue?.end || null}
        hoveredDate={hoveredDate}
        onSelect={handleSelect}
        onHover={setHoveredDate}
        min={min}
        max={max}
        viewMonth={viewMonth}
        viewYear={viewYear}
        onMonthChange={setViewMonth}
        onYearChange={setViewYear}
      />
    );

    // Inline display
    if (display === 'inline') {
      return (
        <div ref={ref} className={cn('w-fit', className)}>
          {label && (
            <label className="mb-2 block text-sm font-medium text-steel-300">
              {label}
              {required && <span className="text-red-400"> *</span>}
            </label>
          )}
          <div className="rounded-lg border border-steel-700/50 bg-steel-800/60 p-3">
            {calendar}
          </div>
          {error && <span className="mt-1 text-xs text-red-400">{error}</span>}
        </div>
      );
    }

    // Dropdown display
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

        {/* Trigger button */}
        <div
          ref={inputRef as React.RefObject<HTMLDivElement>}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={e => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border px-3',
            'text-left text-sm transition-all',
            'focus:outline-none focus:ring-2 focus:ring-copper-500/20',
            error
              ? 'border-red-500/50 focus:border-red-500/50'
              : 'border-steel-700/50 focus:border-copper-500/50',
            disabled
              ? 'cursor-not-allowed bg-steel-900/40 text-steel-500 opacity-50'
              : 'bg-steel-900/60 text-white hover:border-steel-600'
          )}
        >
          <span className={displayValue ? 'text-white' : 'text-steel-500'}>
            {displayValue || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {/* Clear button - hidden for required fields */}
            {clearable && !required && displayValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded p-1 text-steel-400 transition-colors hover:bg-steel-700/50 hover:text-white"
                aria-label="Clear date"
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
            {/* Calendar icon */}
            <svg
              className={cn('h-4 w-4 text-steel-400 transition-transform', isOpen && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}

        {/* Dropdown */}
        {isOpen && (
          <div
            className={cn(
              'absolute z-50 mt-1 w-72 rounded-lg border border-steel-700/50',
              'bg-steel-800 p-3 shadow-xl shadow-black/20',
              'animate-in fade-in-0 zoom-in-95 duration-150'
            )}
          >
            {calendar}
          </div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
