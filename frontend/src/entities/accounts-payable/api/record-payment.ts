/**
 * Record Payment command function for Accounts Payable.
 *
 * Combines validation, mapping, and HTTP POST in one module.
 * Use with useMutation() in the features layer.
 *
 * @example
 * ```tsx
 * // In features layer
 * const mutation = useMutation({
 *   mutationFn: (params: { apId: number; input: RecordPaymentInput }) =>
 *     recordPayment(params.apId, params.input),
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: accountsPayableQueries.lists() });
 *   },
 * });
 *
 * // Call with UI-friendly input
 * mutation.mutate({
 *   apId: 1,
 *   input: {
 *     paymentDate: '2025-01-22',
 *     amount: 100000,
 *     paymentMethod: 'BANK_TRANSFER',
 *     referenceNumber: 'TRX-001',
 *     notes: 'First payment',
 *   },
 * });
 * ```
 */

import { DomainValidationError, httpClient } from '@/shared/api';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Payment methods for vendor payments.
 * Matches backend VendorPaymentMethod enum.
 */
export type VendorPaymentMethod =
  | 'BANK_TRANSFER'
  | 'CHECK'
  | 'CASH'
  | 'PROMISSORY_NOTE'
  | 'OTHER';

/**
 * Result from recording a vendor payment.
 */
export interface RecordPaymentResult {
  id: number;
  accountsPayableId: number;
  remainingBalance: number;
  calculatedStatus: string;
  message: string;
}

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Request for recording a vendor payment.
 */
interface RecordPaymentRequest {
  paymentDate: string;
  amount: number;
  paymentMethod: VendorPaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

// =============================================================================
// INPUT TYPE
// =============================================================================

/**
 * Input type for recording a payment.
 * UI-friendly: allows nulls from form fields before validation.
 */
export interface RecordPaymentInput {
  paymentDate: string;
  amount: number | null;
  paymentMethod: VendorPaymentMethod | null;
  referenceNumber?: string;
  notes?: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateRecordPaymentInput(input: RecordPaymentInput): void {
  if (!input.paymentDate) {
    throw new DomainValidationError(
      'REQUIRED',
      'paymentDate',
      'Payment date is required'
    );
  }

  if (input.amount === null || input.amount === undefined) {
    throw new DomainValidationError('REQUIRED', 'amount', 'Amount is required');
  }

  if (input.amount <= 0) {
    throw new DomainValidationError(
      'INVALID',
      'amount',
      'Amount must be greater than 0'
    );
  }

  if (input.paymentMethod === null) {
    throw new DomainValidationError(
      'REQUIRED',
      'paymentMethod',
      'Payment method is required'
    );
  }
}

// =============================================================================
// MAPPING
// =============================================================================

function toRecordPaymentRequest(input: RecordPaymentInput): RecordPaymentRequest {
  return {
    paymentDate: input.paymentDate,
    amount: input.amount!,
    paymentMethod: input.paymentMethod!,
    referenceNumber: input.referenceNumber?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Record a payment against an accounts payable.
 *
 * Validates input, maps to request, and sends HTTP POST.
 * Returns result with updated balance and status.
 *
 * @param accountsPayableId - The AP to record payment against
 * @param input - Payment details
 * @throws DomainValidationError if validation fails
 */
export async function recordPayment(
  accountsPayableId: number,
  input: RecordPaymentInput
): Promise<RecordPaymentResult> {
  validateRecordPaymentInput(input);
  const request = toRecordPaymentRequest(input);
  return httpClient.post<RecordPaymentResult>(
    `/accounts-payable/${accountsPayableId}/payments`,
    request
  );
}
