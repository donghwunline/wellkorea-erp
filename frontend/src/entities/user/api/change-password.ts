/**
 * Change Password command function.
 *
 * Admin operation to change a user's password.
 */

import { httpClient, USER_ENDPOINTS } from '@/shared/api';
import type { ChangePasswordRequestDTO } from './user.dto';

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Change password input from UI forms.
 */
export interface ChangePasswordInput {
  newPassword: string;
}

// =============================================================================
// MAPPING
// =============================================================================

/**
 * Map input to API request.
 */
function toChangePasswordRequest(input: ChangePasswordInput): ChangePasswordRequestDTO {
  return {
    newPassword: input.newPassword,
  };
}

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Change a user's password (admin operation).
 *
 * @param id - User ID
 * @param input - New password
 *
 * @example
 * ```typescript
 * await changePassword(123, { newPassword: 'newSecurePassword123' });
 * ```
 */
export async function changePassword(id: number, input: ChangePasswordInput): Promise<void> {
  const request = toChangePasswordRequest(input);
  await httpClient.put<void>(USER_ENDPOINTS.password(id), request);
}
