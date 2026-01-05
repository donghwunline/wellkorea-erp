/**
 * Submit Quotation for Approval API function.
 *
 * Submits a DRAFT quotation to start the approval workflow.
 */

import { httpClient, QUOTATION_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './quotation.mapper';

/**
 * Submit quotation for approval.
 *
 * Only valid for quotations with status = DRAFT.
 * Creates an approval request via event-driven architecture.
 *
 * @param id - Quotation ID to submit
 * @returns Command result
 */
export async function submitQuotation(id: number): Promise<CommandResult> {
  return httpClient.post<CommandResult>(QUOTATION_ENDPOINTS.submit(id));
}
