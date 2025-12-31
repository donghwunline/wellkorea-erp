/**
 * Domain validation error handling.
 *
 * Provides structured error types for domain validation that can be
 * mapped to form field errors in the UI layer.
 */

/**
 * DomainValidationError - Structured error for domain validation failures.
 *
 * Use class (not interface casting) for:
 * - Proper instanceof checks
 * - Correct Error.name and stack trace
 * - Type guards that work at runtime
 */
export class DomainValidationError extends Error {
  readonly code: string; // Machine-readable: 'REQUIRED', 'INVALID_FORMAT', 'OUT_OF_RANGE'
  readonly fieldPath: string; // Form field path: 'projectId', 'lineItems[0].quantity'

  constructor(code: string, fieldPath: string, message: string) {
    super(message);
    this.name = 'DomainValidationError';
    this.code = code;
    this.fieldPath = fieldPath;

    // Maintains proper stack trace in V8 environments (Node, Chrome)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((Error as any).captureStackTrace) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Error as any).captureStackTrace(this, DomainValidationError);
    }
  }
}

/**
 * Type guard for DomainValidationError.
 */
export function isDomainValidationError(error: unknown): error is DomainValidationError {
  return error instanceof DomainValidationError;
}

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
