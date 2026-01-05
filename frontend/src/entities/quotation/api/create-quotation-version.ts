/**
 * Create New Quotation Version API function.
 *
 * Creates a new version from an existing quotation.
 */

import { httpClient, QUOTATION_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './quotation.mapper';

/**
 * Create a new version from an existing quotation.
 *
 * Clones the quotation with incremented version number.
 * Available for APPROVED, REJECTED, or SENT quotations.
 *
 * @param id - Source quotation ID
 * @returns Command result with new version ID
 */
export async function createQuotationVersion(id: number): Promise<CommandResult> {
  return httpClient.post<CommandResult>(QUOTATION_ENDPOINTS.versions(id));
}
