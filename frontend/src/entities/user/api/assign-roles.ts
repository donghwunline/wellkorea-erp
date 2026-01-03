/**
 * Assign Roles command function.
 *
 * Encapsulates mapping and API call for role assignment.
 */

import { httpClient, USER_ENDPOINTS } from '@/shared/api';
import type { RoleName } from '../model/role';

// =============================================================================
// REQUEST TYPE
// =============================================================================

/**
 * Request type for assigning roles.
 */
interface AssignRolesRequest {
  roles: RoleName[];
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Assign roles input from UI forms.
 */
export interface AssignRolesInput {
  roles: RoleName[];
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map input to API request.
 */
function toAssignRolesRequest(input: AssignRolesInput): AssignRolesRequest {
  return {
    roles: input.roles,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Assign roles to a user.
 *
 * @param id - User ID
 * @param input - Roles to assign
 *
 * @example
 * ```typescript
 * await assignRoles(123, { roles: ['ROLE_ADMIN', 'ROLE_USER'] });
 * ```
 */
export async function assignRoles(id: number, input: AssignRolesInput): Promise<void> {
  const request = toAssignRolesRequest(input);
  await httpClient.put<void>(USER_ENDPOINTS.roles(id), request);
}
