/**
 * Money formatting utilities.
 *
 * Provides consistent currency formatting across the application.
 * Default locale is Korean (ko-KR) with KRW currency.
 */

/**
 * Money formatting options.
 */
interface FormatOptions {
  locale?: string;
  currency?: string;
  showCurrency?: boolean;
}

const DEFAULT_OPTIONS: Required<FormatOptions> = {
  locale: 'ko-KR',
  currency: 'KRW',
  showCurrency: true,
};

/**
 * Money formatting utilities.
 */
export const Money = {
  /**
   * Format a number as currency.
   *
   * @param amount - The amount to format
   * @param options - Formatting options
   * @returns Formatted currency string
   *
   * @example
   * Money.format(1500000) // "₩1,500,000"
   * Money.format(1500000, { showCurrency: false }) // "1,500,000"
   */
  format(amount: number, options?: FormatOptions): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    if (!opts.showCurrency) {
      return new Intl.NumberFormat(opts.locale).format(amount);
    }

    return new Intl.NumberFormat(opts.locale, {
      style: 'currency',
      currency: opts.currency,
      maximumFractionDigits: 0, // KRW doesn't use decimals
    }).format(amount);
  },

  /**
   * Format a number with thousand separators (no currency symbol).
   *
   * @param amount - The amount to format
   * @param locale - Locale for formatting
   * @returns Formatted number string
   */
  formatNumber(amount: number, locale = 'ko-KR'): string {
    return new Intl.NumberFormat(locale).format(amount);
  },

  /**
   * Parse a formatted currency string back to number.
   *
   * @param formatted - The formatted string
   * @returns Parsed number
   */
  parse(formatted: string): number {
    // Remove currency symbols, whitespace, and thousand separators
    const cleaned = formatted.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  },
};
