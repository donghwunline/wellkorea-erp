/**
 * API Error Handling.
 *
 * Bridges API error responses to domain validation errors.
 * Converts backend 400 responses to structured DomainValidationError.
 */

import {
  DomainValidationError,
  isDomainValidationError,
} from '@/shared/lib/errors/domain-validation-error';

// Re-export for backward compatibility
// TODO: Update imports to use '@/shared/lib/errors/domain-validation-error' directly
export { DomainValidationError, isDomainValidationError };

// =============================================================================
// API Error Types
// =============================================================================

/**
 * API validation error shape (from backend 400 responses).
 */
interface ApiValidationError {
  code: string;
  field?: string;
  message: string;
}

/**
 * API error response shape.
 */
interface ApiErrorResponse {
  errors: ApiValidationError[];
}

// =============================================================================
// API Error Utilities
// =============================================================================

/**
 * Check if an object is an API error response.
 */
function isApiErrorResponse(obj: unknown): obj is ApiErrorResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'errors' in obj &&
    Array.isArray((obj as ApiErrorResponse).errors)
  );
}

/**
 * Normalize API 400 errors to DomainValidationError array.
 * Backend should return: { errors: [{ code, field, message }] }
 */
export function normalizeApiErrors(apiResponse: unknown): DomainValidationError[] {
  if (!isApiErrorResponse(apiResponse)) {
    return [new DomainValidationError('UNKNOWN', '', 'Unknown error occurred')];
  }

  return apiResponse.errors.map(
    (err: ApiValidationError) =>
      new DomainValidationError(err.code, err.field ?? '', err.message)
  );
}

/**
 * Extract error message from unknown error.
 *
 * @param err - Unknown error
 * @param fallbackMessage - Message to use if error has no message
 */
export function extractErrorMessage(err: unknown, fallbackMessage: string): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  return fallbackMessage;
}
