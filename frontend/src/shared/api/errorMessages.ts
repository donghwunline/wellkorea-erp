/**
 * Error message mapping and utilities for user-friendly error handling.
 * Maps backend error codes to localized, user-friendly messages via i18n.
 *
 * Error display strategy based on error type:
 * - Validation errors (VAL_*): Inline near fields
 * - Auth errors (AUTH_*, AUTHZ_*): Banner/modal/dedicated error page
 * - Server errors (SRV_*): Toast notification
 * - Business errors (BUS_*): Context-dependent (inline or toast)
 */

import i18n from '@/app/i18n';
import type { ApiError, ErrorResponse } from './types';

/**
 * Get user-friendly error message for an error using i18n.
 * Falls back to error's original message if no translation exists.
 *
 * @param error Normalized API error or backend error response
 * @returns User-friendly error message in the current language
 */
export function getErrorMessage(error: ApiError | ErrorResponse): string {
  if (error.errorCode) {
    const translationKey = `errors:codes.${error.errorCode}`;
    const translatedMessage = i18n.t(translationKey);

    // If translation exists (key is different from result), return it
    if (translatedMessage !== translationKey) {
      return translatedMessage;
    }
  }

  // Fall back to the error's original message
  return error.message;
}

/**
 * Get a generic error message based on HTTP status or error type.
 *
 * @param statusCode HTTP status code
 * @returns Generic error message for the status
 */
export function getGenericErrorMessage(statusCode?: number): string {
  if (!statusCode) {
    return i18n.t('errors:generic.unknown');
  }

  if (statusCode === 401) {
    return i18n.t('errors:codes.AUTH_001');
  }
  if (statusCode === 403) {
    return i18n.t('errors:codes.AUTHZ_001');
  }
  if (statusCode === 404) {
    return i18n.t('errors:codes.RES_001');
  }
  if (statusCode === 409) {
    return i18n.t('errors:generic.conflict');
  }
  if (statusCode >= 500) {
    return i18n.t('errors:generic.serverError');
  }

  return i18n.t('errors:generic.unknown');
}

/**
 * Check if error is a validation error (should be displayed inline).
 *
 * @param errorCode Error code from backend
 * @returns true if validation error
 */
export function isValidationError(errorCode?: string): boolean {
  return errorCode?.startsWith('VAL_') ?? false;
}

/**
 * Check if error is an authentication error (should redirect or show login modal).
 *
 * @param errorCode Error code from backend
 * @returns true if authentication error
 */
export function isAuthenticationError(errorCode?: string): boolean {
  return errorCode?.startsWith('AUTH_') ?? false;
}

/**
 * Check if error is an authorization error (should show access denied page).
 *
 * @param errorCode Error code from backend
 * @returns true if authorization error
 */
export function isAuthorizationError(errorCode?: string): boolean {
  return errorCode?.startsWith('AUTHZ_') ?? false;
}

/**
 * Check if error is any auth-related error (authentication or authorization).
 *
 * @param errorCode Error code from backend
 * @returns true if any auth error
 */
export function isAuthError(errorCode?: string): boolean {
  return isAuthenticationError(errorCode) || isAuthorizationError(errorCode);
}

/**
 * Check if error is a business logic error (context-dependent display).
 *
 * @param errorCode Error code from backend
 * @returns true if business error
 */
export function isBusinessError(errorCode?: string): boolean {
  return errorCode?.startsWith('BUS_') ?? false;
}

/**
 * Check if error is a server error (should be displayed as toast).
 *
 * @param errorCode Error code from backend
 * @returns true if server error
 */
export function isServerError(errorCode?: string): boolean {
  return errorCode?.startsWith('SRV_') ?? false;
}

/**
 * Check if error is a resource not found error.
 *
 * @param errorCode Error code from backend
 * @returns true if resource not found
 */
export function isNotFoundError(errorCode?: string): boolean {
  return errorCode?.startsWith('RES_') ?? false;
}

/**
 * Determine the appropriate display strategy for an error.
 *
 * @param errorCode Error code from backend (optional)
 * @returns Display strategy: 'inline', 'toast', 'banner', or 'modal'
 */
export function getErrorDisplayStrategy(
  errorCode?: string
): 'inline' | 'toast' | 'banner' | 'modal' {
  if (!errorCode) return 'toast';
  if (isValidationError(errorCode)) {
    return 'inline';
  }
  if (isAuthenticationError(errorCode)) {
    return 'modal'; // Login modal or redirect
  }
  if (isAuthorizationError(errorCode)) {
    return 'banner'; // Access denied banner
  }
  if (isServerError(errorCode) || isBusinessError(errorCode)) {
    return 'toast'; // Global action feedback
  }
  if (isNotFoundError(errorCode)) {
    return 'banner'; // Not found page
  }
  return 'toast'; // Default to toast for unknown errors
}
