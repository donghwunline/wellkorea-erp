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
} from './formatters';
export type { FormatDateOptions, FormatCurrencyOptions } from './formatters';

// Extended date utilities (for domain model date handling)
export {
  parseLocalDate,
  parseLocalDateTime,
  formatDate as formatDateAdvanced,
  formatDateTime as formatDateTimeAdvanced,
  isPast,
  getNow,
  daysBetween,
} from './date';
export type { DateFormat } from './date';

// Money utilities (alternative API)
export { Money } from './money';
