/**
 * Shared formatter utilities for dates, currency, and numbers.
 *
 * Centralizes formatting logic to ensure consistency across the application.
 * All formatters use Korean locale (ko-KR) by default.
 */

/**
 * Format options for date formatting.
 */
export interface FormatDateOptions {
  /** Include time (hour:minute) in the output. Default: false */
  includeTime?: boolean;
  /** Placeholder to show when date is null/undefined. Default: '-' */
  placeholder?: string;
}

/**
 * Formats a date string for display.
 *
 * @param dateStr - ISO date string or null
 * @param options - Formatting options
 * @returns Formatted date string in ko-KR locale (e.g., "2025. 01. 15." or "2025. 01. 15. 14:30")
 *
 * @example
 * formatDate('2025-01-15T14:30:00Z') // "2025. 01. 15."
 * formatDate('2025-01-15T14:30:00Z', { includeTime: true }) // "2025. 01. 15. 14:30"
 * formatDate(null) // "-"
 */
export function formatDate(
  dateStr: string | null | undefined,
  options: FormatDateOptions = {}
): string {
  const { includeTime = false, placeholder = '-' } = options;

  if (!dateStr) return placeholder;

  const formatOptions: Intl.DateTimeFormatOptions = includeTime
    ? {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }
    : {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };

  return new Date(dateStr).toLocaleDateString('ko-KR', formatOptions);
}

/**
 * Formats a date string with time included.
 * Convenience wrapper for formatDate with includeTime: true.
 *
 * @param dateStr - ISO date string or null
 * @returns Formatted date string with time (e.g., "2025. 01. 15. 14:30")
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  return formatDate(dateStr, { includeTime: true });
}

/**
 * Format options for currency formatting.
 */
export interface FormatCurrencyOptions {
  /** Currency code (ISO 4217). Default: 'KRW' */
  currency?: string;
  /** Whether to show currency symbol. Default: true */
  showSymbol?: boolean;
}

/**
 * Formats a number as currency.
 *
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "₩1,234,567")
 *
 * @example
 * formatCurrency(1234567) // "₩1,234,567"
 * formatCurrency(1234567, { showSymbol: false }) // "1,234,567"
 */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
): string {
  const { currency = 'KRW', showSymbol = true } = options;

  if (showSymbol) {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a number with thousands separators.
 *
 * @param num - The number to format
 * @param decimals - Number of decimal places. Default: 0
 * @returns Formatted number string (e.g., "1,234,567")
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.567, 2) // "1,234.57"
 */
export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formats a percentage value.
 *
 * @param value - The decimal value (0.5 = 50%)
 * @param decimals - Number of decimal places. Default: 0
 * @returns Formatted percentage string (e.g., "50%")
 *
 * @example
 * formatPercent(0.5) // "50%"
 * formatPercent(0.1234, 1) // "12.3%"
 */
export function formatPercent(value: number, decimals = 0): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
