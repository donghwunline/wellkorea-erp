/**
 * Shared formatting utilities.
 *
 * Provides consistent formatting for dates, currency, numbers, and percentages.
 * All formatters use Korean locale (ko-KR) by default.
 */

// Primary formatters
export {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPercent,
} from './formatters.ts';
export type { FormatDateOptions, FormatCurrencyOptions } from './formatters.ts';

// Extended date utilities (for domain model date handling)
export {
  parseLocalDate,
  parseLocalDateTime,
  formatDate as formatDateAdvanced,
  formatDateTime as formatDateTimeAdvanced,
  isPast,
  getNow,
  daysBetween,
} from './date.ts';
export type { DateFormat } from './date.ts';

// Money utilities (alternative API)
export { Money } from './money.ts';
