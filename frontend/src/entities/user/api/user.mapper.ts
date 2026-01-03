/**
 * User Response ↔ Domain mappers.
 *
 * Transforms API responses to domain models.
 * Following the same pattern as quotation.mapper.ts
 */

import type { RoleName } from '../model/role';
import type { UserDetails, UserListItem } from '../model/user';

// =============================================================================
// RESPONSE TYPE
// =============================================================================

/**
 * User details as returned by the API.
 */
export interface UserDetailsResponse {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: RoleName[];
  createdAt: string;
  lastLoginAt: string | null;
}

/**
 * User mapper functions.
 */
export const userMapper = {
  /**
   * Map UserDetailsResponse to UserDetails domain model.
   *
   * Normalizes data (lowercase email, trim strings).
   */
  toDomain(response: UserDetailsResponse): UserDetails {
    return {
      id: response.id,
      username: response.username.trim(),
      email: response.email.toLowerCase().trim(),
      fullName: response.fullName.trim(),
      isActive: response.isActive,
      roles: response.roles,
      createdAt: response.createdAt,
      lastLoginAt: response.lastLoginAt,
    };
  },

  /**
   * Map UserDetails to UserListItem (for list views).
   */
  toListItem(user: UserDetails): UserListItem {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      roles: user.roles,
      lastLoginAt: user.lastLoginAt,
    };
  },

  /**
   * Map response directly to list item (optimization for lists).
   */
  responseToListItem(response: UserDetailsResponse): UserListItem {
    return {
      id: response.id,
      username: response.username.trim(),
      fullName: response.fullName.trim(),
      email: response.email.toLowerCase().trim(),
      isActive: response.isActive,
      roles: response.roles,
      lastLoginAt: response.lastLoginAt,
    };
  },
};
