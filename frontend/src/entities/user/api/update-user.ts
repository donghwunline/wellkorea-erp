/**
 * Update User command function.
 *
 * Encapsulates validation, mapping, and API call in one module.
 * Follows FSD pattern: entities/{entity}/api/update-{entity}.ts
 */

import { httpClient, USER_ENDPOINTS } from '@/shared/api';
import type { UserDetailsResponse } from './user.mapper';

// =============================================================================
// REQUEST TYPE
// =============================================================================

/**
 * Request type for updating user details.
 */
interface UpdateUserRequest {
  fullName: string;
  email: string;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Update user input from UI forms.
 */
export interface UpdateUserInput {
  fullName: string;
  email: string;
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map update input to API request.
 */
function toUpdateRequest(input: UpdateUserInput): UpdateUserRequest {
  return {
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Update user details.
 *
 * @param id - User ID
 * @param input - UI form input
 * @returns Updated user details
 *
 * @example
 * ```typescript
 * const user = await updateUser(123, {
 *   fullName: 'John Doe Updated',
 *   email: 'john.updated@example.com',
 * });
 * ```
 */
export async function updateUser(id: number, input: UpdateUserInput): Promise<UserDetailsResponse> {
  const request = toUpdateRequest(input);
  return httpClient.put<UserDetailsResponse>(USER_ENDPOINTS.byId(id), request);
}
