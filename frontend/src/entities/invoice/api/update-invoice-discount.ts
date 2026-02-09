/**
 * Update invoice discount command function.
 */

import { DomainValidationError, httpClient } from '@/shared/api';
import type { CommandResult } from './invoice.mapper';

const INVOICE_ENDPOINTS = {
  DISCOUNT: (id: number) => `/invoices/${id}/discount`,
};

/**
 * Input for updating an invoice's discount amount.
 */
export interface UpdateInvoiceDiscountInput {
  invoiceId: number;
  quotationId: number;
  discountAmount: number;
}

/**
 * Request DTO for updating discount.
 * (Private - matches backend UpdateDiscountRequest)
 */
interface UpdateDiscountRequest {
  quotationId: number;
  discountAmount: number;
}

/**
 * Validates update discount input.
 *
 * @throws DomainValidationError if validation fails
 */
function validateInput(input: UpdateInvoiceDiscountInput): void {
  if (!input.invoiceId || input.invoiceId <= 0) {
    throw new DomainValidationError('REQUIRED', 'invoiceId', 'Invoice is required');
  }

  if (!input.quotationId || input.quotationId <= 0) {
    throw new DomainValidationError('REQUIRED', 'quotationId', 'Quotation is required');
  }

  if (input.discountAmount < 0) {
    throw new DomainValidationError(
      'OUT_OF_RANGE',
      'discountAmount',
      'Discount amount must be non-negative'
    );
  }
}

/**
 * Update the discount amount on a DRAFT invoice.
 */
export async function updateInvoiceDiscount(
  input: UpdateInvoiceDiscountInput
): Promise<CommandResult> {
  validateInput(input);
  const request: UpdateDiscountRequest = {
    quotationId: input.quotationId,
    discountAmount: input.discountAmount,
  };
  return httpClient.patch<CommandResult>(
    INVOICE_ENDPOINTS.DISCOUNT(input.invoiceId),
    request
  );
}
