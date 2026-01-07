/**
 * Core user type.
 *
 * Basic user representation for authentication context.
 * Shared between auth and user entities.
 *
 * Note: Extended types like UserDetails and UserListItem
 * remain in @/entities/user as they're user-entity specific.
 */

import type { RoleName } from './role';

/**
 * Core user type (for authenticated user context).
 */
export interface User {
  readonly id: number;
  readonly username: string;
  readonly email: string;
  readonly fullName: string;
  readonly roles: RoleName[];
}
