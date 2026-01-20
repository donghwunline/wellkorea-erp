/**
 * Accept Quotation API function.
 *
 * Marks a quotation as accepted by customer.
 * Only valid for SENT or APPROVED quotations.
 */

import { httpClient, QUOTATION_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './quotation.mapper';

/**
 * Accept quotation (mark as accepted by customer).
 *
 * Only valid for quotations with status = SENT or APPROVED.
 * Triggers QuotationAcceptedEvent which activates the project.
 *
 * @param id - Quotation ID to accept
 * @returns Command result
 */
export async function acceptQuotation(id: number): Promise<CommandResult> {
  return httpClient.post<CommandResult>(QUOTATION_ENDPOINTS.accept(id));
}
