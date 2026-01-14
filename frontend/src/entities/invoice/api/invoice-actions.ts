/**
 * Invoice action command functions (issue, cancel, record payment).
 */

import { httpClient } from '@/shared/api';
import type { CommandResult, PaymentCommandResult } from './invoice.mapper';
import type { PaymentMethod } from '../model/payment-method';

const INVOICE_ENDPOINTS = {
  ISSUE: (id: number) => `/invoices/${id}/issue`,
  CANCEL: (id: number) => `/invoices/${id}/cancel`,
  PAYMENTS: (id: number) => `/invoices/${id}/payments`,
  NOTES: (id: number) => `/invoices/${id}/notes`,
};

/**
 * Issue an invoice (DRAFT → ISSUED).
 */
export async function issueInvoice(invoiceId: number): Promise<CommandResult> {
  if (!invoiceId || invoiceId <= 0) {
    throw new Error('Invalid invoice ID');
  }
  return httpClient.post<CommandResult>(INVOICE_ENDPOINTS.ISSUE(invoiceId), {});
}

/**
 * Cancel an invoice.
 */
export async function cancelInvoice(invoiceId: number): Promise<CommandResult> {
  if (!invoiceId || invoiceId <= 0) {
    throw new Error('Invalid invoice ID');
  }
  return httpClient.post<CommandResult>(INVOICE_ENDPOINTS.CANCEL(invoiceId), {});
}

/**
 * Input for recording a payment.
 */
export interface RecordPaymentInput {
  invoiceId: number;
  paymentDate: string; // ISO date string
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
}

/**
 * Request DTO for recording payment.
 * (Private - matches backend RecordPaymentRequest)
 */
interface RecordPaymentRequest {
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
}

/**
 * Validates record payment input.
 */
function validatePaymentInput(input: RecordPaymentInput): void {
  if (!input.invoiceId || input.invoiceId <= 0) {
    throw new Error('Invalid invoice ID');
  }

  if (!input.paymentDate) {
    throw new Error('Payment date is required');
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }

  if (!input.paymentMethod) {
    throw new Error('Payment method is required');
  }
}

/**
 * Record a payment against an invoice.
 */
export async function recordPayment(
  input: RecordPaymentInput
): Promise<PaymentCommandResult> {
  validatePaymentInput(input);

  const request: RecordPaymentRequest = {
    paymentDate: input.paymentDate,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    referenceNumber: input.referenceNumber ?? null,
    notes: input.notes ?? null,
  };

  return httpClient.post<PaymentCommandResult>(
    INVOICE_ENDPOINTS.PAYMENTS(input.invoiceId),
    request
  );
}

/**
 * Update invoice notes.
 */
export async function updateInvoiceNotes(
  invoiceId: number,
  notes: string
): Promise<CommandResult> {
  if (!invoiceId || invoiceId <= 0) {
    throw new Error('Invalid invoice ID');
  }
  return httpClient.patch<CommandResult>(
    INVOICE_ENDPOINTS.NOTES(invoiceId),
    notes
  );
}
