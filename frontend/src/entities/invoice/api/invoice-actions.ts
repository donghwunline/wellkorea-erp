/**
 * Invoice action command functions (issue, cancel, record payment).
 * Issue now includes document upload flow.
 */

import { httpClient } from '@/shared/api';
import { INVOICE_ENDPOINTS } from '@/shared/config/endpoints';
import { attachmentRules, ATTACHMENT_MAX_SIZE } from '@/shared/domain';
import type { CommandResult, PaymentCommandResult } from './invoice.mapper';
import type { PaymentMethod } from '../model/payment-method';

/**
 * Response from upload URL endpoint.
 */
interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

/**
 * Input for issuing an invoice with document.
 */
export interface IssueInvoiceInput {
  invoiceId: number;
  file: File;
}

/**
 * Issue an invoice with attached document (DRAFT → ISSUED).
 *
 * This is a 3-step process:
 * 1. Get a presigned upload URL from the backend
 * 2. Upload the file directly to MinIO using the presigned URL
 * 3. Call issue endpoint with document info to atomically register document and issue invoice
 *
 * @throws Error if file type is not allowed (only JPG/PNG/PDF)
 * @throws Error if file size exceeds 10MB limit
 * @throws Error if upload to MinIO fails
 */
export async function issueInvoice(input: IssueInvoiceInput): Promise<CommandResult> {
  const { invoiceId, file } = input;

  if (!invoiceId || invoiceId <= 0) {
    throw new Error('Invalid invoice ID');
  }

  // Validate file type (JPG, PNG, PDF allowed for invoice documents)
  if (!attachmentRules.isAllowed(file.name)) {
    throw new Error('파일 형식이 올바르지 않습니다. JPG, PNG 또는 PDF 파일만 허용됩니다.');
  }

  // Validate file size
  if (!attachmentRules.isValidSize(file.size)) {
    throw new Error(
      `파일 크기가 너무 큽니다. 최대 ${attachmentRules.formatFileSize(ATTACHMENT_MAX_SIZE)}까지 허용됩니다.`
    );
  }

  // Step 1: Get presigned URL from backend
  const contentType = attachmentRules.getContentType(file.name);
  const { uploadUrl, objectKey } = await httpClient.post<UploadUrlResponse>(
    INVOICE_ENDPOINTS.documentUploadUrl(invoiceId),
    {
      fileName: file.name,
      fileSize: file.size,
      contentType,
    }
  );

  // Step 2: Upload file directly to MinIO
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('파일 업로드에 실패했습니다. 다시 시도해 주세요.');
  }

  // Step 3: Issue invoice with document info (atomic operation)
  return httpClient.post<CommandResult>(INVOICE_ENDPOINTS.issue(invoiceId), {
    fileName: file.name,
    fileSize: file.size,
    objectKey,
  });
}

/**
 * Cancel an invoice.
 */
export async function cancelInvoice(invoiceId: number): Promise<CommandResult> {
  if (!invoiceId || invoiceId <= 0) {
    throw new Error('Invalid invoice ID');
  }
  return httpClient.post<CommandResult>(INVOICE_ENDPOINTS.cancel(invoiceId), {});
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
export async function recordPayment(input: RecordPaymentInput): Promise<PaymentCommandResult> {
  validatePaymentInput(input);

  const request: RecordPaymentRequest = {
    paymentDate: input.paymentDate,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    referenceNumber: input.referenceNumber ?? null,
    notes: input.notes ?? null,
  };

  return httpClient.post<PaymentCommandResult>(INVOICE_ENDPOINTS.payments(input.invoiceId), request);
}

/**
 * Update invoice notes.
 */
export async function updateInvoiceNotes(invoiceId: number, notes: string): Promise<CommandResult> {
  if (!invoiceId || invoiceId <= 0) {
    throw new Error('Invalid invoice ID');
  }
  return httpClient.patch<CommandResult>(INVOICE_ENDPOINTS.notes(invoiceId), notes);
}
