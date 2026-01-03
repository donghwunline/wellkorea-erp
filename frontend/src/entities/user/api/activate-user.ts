/**
 * Activate User command function.
 *
 * Reactivates a previously deactivated user.
 */

import { httpClient, USER_ENDPOINTS } from '@/shared/api';

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Activate a deactivated user.
 *
 * @param id - User ID
 *
 * @example
 * ```typescript
 * await activateUser(123);
 * ```
 */
export async function activateUser(id: number): Promise<void> {
  await httpClient.post<void>(USER_ENDPOINTS.activate(id));
}
