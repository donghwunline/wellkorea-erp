/**
 * User domain model.
 *
 * Represents the core user entity in the system.
 * Dates are stored as ISO strings for React Query cache serialization.
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

/**
 * Extended user details (for admin user management).
 *
 * Includes status and timestamps not needed in auth context.
 */
export interface UserDetails {
  readonly id: number;
  readonly username: string;
  readonly email: string;
  readonly fullName: string;
  readonly isActive: boolean;
  readonly roles: RoleName[];
  /** ISO datetime when user was created */
  readonly createdAt: string;
  /** ISO datetime of last login, null if never logged in */
  readonly lastLoginAt: string | null;
}

/**
 * Lightweight user list item for summary views.
 *
 * Used in tables where full details aren't needed.
 */
export interface UserListItem {
  readonly id: number;
  readonly username: string;
  readonly fullName: string;
  readonly email: string;
  readonly isActive: boolean;
  readonly roles: RoleName[];
  readonly lastLoginAt: string | null;
}
