/**
 * Get User By ID query function.
 *
 * Fetches a single user by ID.
 * Used by user.queries.ts for TanStack Query integration.
 */

import { httpClient, USER_ENDPOINTS } from '@/shared/api';
import type { UserDetailsResponse } from './user.mapper';

// =============================================================================
// API FUNCTION
// =============================================================================

/**
 * Get user by ID.
 *
 * @param id - User ID
 * @returns User details response
 *
 * @example
 * ```typescript
 * const user = await getUserById(123);
 * ```
 */
export async function getUserById(id: number): Promise<UserDetailsResponse> {
  return httpClient.get<UserDetailsResponse>(USER_ENDPOINTS.byId(id));
}
