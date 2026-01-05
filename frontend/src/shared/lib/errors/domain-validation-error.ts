/**
 * Domain Validation Error.
 *
 * Structured error type for domain validation failures.
 * Maps to form field errors in the UI layer.
 *
 * @example
 * ```typescript
 * throw new DomainValidationError('REQUIRED', 'projectId', 'Project is required');
 * throw new DomainValidationError('OUT_OF_RANGE', 'lineItems[0].quantity', 'Quantity must be positive');
 * ```
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
