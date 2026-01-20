/**
 * Add Role to Company Command.
 *
 * Adds a new role (CUSTOMER, VENDOR, OUTSOURCE) to an existing company.
 */

import { httpClient, COMPANY_ENDPOINTS } from '@/shared/api';
import type { RoleType } from '../model/role-type';
import type { CommandResult } from './company.mapper';

// =============================================================================
// REQUEST TYPE (internal)
// =============================================================================

/**
 * Add role to company request.
 */
interface AddRoleRequest {
  roleType: RoleType;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Add role input from UI forms.
 */
export interface AddRoleInput {
  companyId: number;
  roleType: RoleType;
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map add role input to API request.
 */
function toAddRoleRequest(input: AddRoleInput): AddRoleRequest {
  return {
    roleType: input.roleType,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Add a role to a company.
 *
 * @param input - Role input with company ID
 * @returns Command result with created role ID
 *
 * @example
 * ```typescript
 * const result = await addRole({
 *   companyId: 123,
 *   roleType: 'VENDOR',
 * });
 * console.log(`Added role: ${result.id}`);
 * ```
 */
export async function addRole(input: AddRoleInput): Promise<CommandResult> {
  const request = toAddRoleRequest(input);
  return httpClient.post<CommandResult>(COMPANY_ENDPOINTS.roles(input.companyId), request);
}
