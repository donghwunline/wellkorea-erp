/**
 * Shared utilities barrel export.
 *
 * Pure utility functions with no dependencies.
 * Utilities are the "lowest layer" - no runtime dependencies on other layers.
 */

export { storage, authStorage } from './storage';
export { navigation } from './navigation';
export { cn } from './cn';

// Error message utilities
export {
  errorMessages,
  getErrorMessage,
  getErrorDisplayStrategy,
  isValidationError,
  isAuthenticationError,
  isAuthorizationError,
  isAuthError,
  isBusinessError,
  isServerError,
  isNotFoundError,
} from './errorMessages';

// Formatting utilities
export {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPercent,
} from './formatters';
export type { FormatDateOptions, FormatCurrencyOptions } from './formatters';
