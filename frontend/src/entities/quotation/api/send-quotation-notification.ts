/**
 * Send Quotation Notification API function.
 *
 * Sends revision notification email to customer with optional TO override and CC recipients.
 */

import { httpClient, QUOTATION_ENDPOINTS } from '@/shared/api';

/**
 * Input for sending quotation notification.
 */
export interface SendNotificationInput {
  /** Quotation ID */
  quotationId: number;
  /** Optional TO email override (if not provided, uses customer email) */
  to?: string;
  /** Optional list of CC recipients */
  ccEmails?: string[];
}

/**
 * Request body for send notification API.
 */
interface SendNotificationRequest {
  to?: string;
  ccEmails?: string[];
}

/**
 * Send revision notification email.
 *
 * Admin only - notifies customer about new quotation version.
 *
 * @param input - Notification input with optional TO override and CC recipients
 */
export async function sendQuotationNotification(input: SendNotificationInput): Promise<void> {
  const request: SendNotificationRequest = {};

  if (input.to?.trim()) {
    request.to = input.to.trim();
  }

  if (input.ccEmails && input.ccEmails.length > 0) {
    request.ccEmails = input.ccEmails.filter(e => e.trim()).map(e => e.trim());
  }

  await httpClient.post<string>(QUOTATION_ENDPOINTS.sendNotification(input.quotationId), request);
}
