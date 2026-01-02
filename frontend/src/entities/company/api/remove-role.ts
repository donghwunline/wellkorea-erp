/**
 * Remove Role from Company Command.
 *
 * Removes an existing role from a company.
 * Note: Cannot remove the last role from a company (enforced by backend).
 */

import { httpClient, COMPANY_ENDPOINTS } from '@/shared/api';

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Remove role input.
 */
export interface RemoveRoleInput {
  companyId: number;
  roleId: number;
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Remove a role from a company.
 *
 * @param input - Company ID and role ID to remove
 * @throws Error if role cannot be removed (e.g., last role)
 *
 * @example
 * ```typescript
 * await removeRole({ companyId: 123, roleId: 456 });
 * console.log('Role removed successfully');
 * ```
 */
export async function removeRole(input: RemoveRoleInput): Promise<void> {
  await httpClient.delete<void>(COMPANY_ENDPOINTS.role(input.companyId, input.roleId));
}
