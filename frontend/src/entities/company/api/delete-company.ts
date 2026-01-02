/**
 * Delete (Deactivate) Company Command.
 *
 * Soft-deletes a company by setting isActive to false.
 */

import { httpClient, COMPANY_ENDPOINTS } from '@/shared/api';

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Delete company input.
 */
export interface DeleteCompanyInput {
  id: number;
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Delete (deactivate) a company.
 *
 * @param input - Company ID to delete
 * @throws Error if company cannot be deleted
 *
 * @example
 * ```typescript
 * await deleteCompany({ id: 123 });
 * console.log('Company deactivated successfully');
 * ```
 */
export async function deleteCompany(input: DeleteCompanyInput): Promise<void> {
  await httpClient.delete<void>(COMPANY_ENDPOINTS.byId(input.id));
}
