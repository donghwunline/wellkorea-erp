/**
 * Deactivate User command function.
 *
 * Soft-deletes a user by deactivating their account.
 */

import { httpClient, USER_ENDPOINTS } from '@/shared/api';

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Deactivate a user.
 *
 * @param id - User ID
 *
 * @example
 * ```typescript
 * await deactivateUser(123);
 * ```
 */
export async function deactivateUser(id: number): Promise<void> {
  await httpClient.delete<void>(USER_ENDPOINTS.byId(id));
}
