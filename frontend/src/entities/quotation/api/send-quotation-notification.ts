/**
 * Send Quotation Notification API function.
 *
 * Sends revision notification email to customer.
 */

import { httpClient, QUOTATION_ENDPOINTS } from '@/shared/api';

/**
 * Send revision notification email.
 *
 * Admin only - notifies customer about new quotation version.
 *
 * @param id - Quotation ID
 */
export async function sendQuotationNotification(id: number): Promise<void> {
  await httpClient.post<string>(QUOTATION_ENDPOINTS.sendNotification(id));
}
