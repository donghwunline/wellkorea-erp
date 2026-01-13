/**
 * Create invoice command function.
 */

import { httpClient } from '@/shared/api';
import type { CommandResult } from './invoice.mapper';

const INVOICE_ENDPOINTS = {
  BASE: '/invoices',
};

/**
 * Input for creating an invoice line item.
 */
export interface CreateInvoiceLineItemInput {
  productId: number;
  productName: string;
  productSku: string | null;
  quantityInvoiced: number;
  unitPrice: number;
}

/**
 * Input for creating an invoice.
 * 
 * The quotationId explicitly binds the invoice to a specific quotation version,
 * preventing race conditions where the "latest approved" quotation might change
 * between when the user views the data and when they submit the invoice.
 */
export interface CreateInvoiceInput {
  projectId: number;
  quotationId: number; // Explicit binding to prevent race conditions
  deliveryId?: number | null;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  taxRate: number;
  notes?: string | null;
  lineItems: CreateInvoiceLineItemInput[];
}

/**
 * Request DTO for creating an invoice.
 * (Private - matches backend CreateInvoiceRequest)
 */
interface CreateInvoiceRequest {
  projectId: number;
  quotationId: number;
  deliveryId: number | null;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  notes: string | null;
  lineItems: Array<{
    productId: number;
    productName: string;
    productSku: string | null;
    quantityInvoiced: number;
    unitPrice: number;
  }>;
}

/**
 * Validates create invoice input.
 */
function validateCreateInput(input: CreateInvoiceInput): void {
  if (!input.projectId || input.projectId <= 0) {
    throw new Error('Project is required');
  }

  if (!input.quotationId || input.quotationId <= 0) {
    throw new Error('Quotation is required');
  }

  if (!input.issueDate) {
    throw new Error('Issue date is required');
  }

  if (!input.dueDate) {
    throw new Error('Due date is required');
  }

  if (new Date(input.dueDate) < new Date(input.issueDate)) {
    throw new Error('Due date must be on or after issue date');
  }

  if (input.taxRate < 0 || input.taxRate > 100) {
    throw new Error('Tax rate must be between 0 and 100');
  }

  if (!input.lineItems || input.lineItems.length === 0) {
    throw new Error('At least one line item is required');
  }

  for (const item of input.lineItems) {
    if (!item.productId || item.productId <= 0) {
      throw new Error('Product is required for each line item');
    }
    if (item.quantityInvoiced <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (item.unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }
  }
}

/**
 * Converts input to request DTO.
 */
function toCreateRequest(input: CreateInvoiceInput): CreateInvoiceRequest {
  return {
    projectId: input.projectId,
    quotationId: input.quotationId,
    deliveryId: input.deliveryId ?? null,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    taxRate: input.taxRate,
    notes: input.notes ?? null,
    lineItems: input.lineItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      quantityInvoiced: item.quantityInvoiced,
      unitPrice: item.unitPrice,
    })),
  };
}

/**
 * Create a new invoice.
 */
export async function createInvoice(
  input: CreateInvoiceInput
): Promise<CommandResult> {
  validateCreateInput(input);
  const request = toCreateRequest(input);
  return httpClient.post<CommandResult>(INVOICE_ENDPOINTS.BASE, request);
}
