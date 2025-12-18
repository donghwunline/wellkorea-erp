/**
 * Shared authentication and user domain types.
 *
 * Only truly shared types belong here. API DTOs (request/response)
 * belong in their respective service type files:
 * - LoginRequest, LoginResponse -> @/services/auth/types
 * - CreateUserRequest, etc. -> @/services/users/types
 */

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: RoleName[];
}

/**
 * Extended user info from admin API (includes more details).
 */
export interface UserDetails {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: RoleName[];
  createdAt: string;
  lastLoginAt: string | null;
}

export type RoleName = 'ROLE_ADMIN' | 'ROLE_FINANCE' | 'ROLE_PRODUCTION' | 'ROLE_SALES';

/**
 * Array of all role names for iteration.
 * Use this instead of manually listing roles.
 */
export const ALL_ROLES: readonly RoleName[] = [
  'ROLE_ADMIN',
  'ROLE_FINANCE',
  'ROLE_PRODUCTION',
  'ROLE_SALES',
] as const;

export const ROLE_LABELS: Record<RoleName, string> = {
  ROLE_ADMIN: 'Administrator',
  ROLE_FINANCE: 'Finance',
  ROLE_PRODUCTION: 'Production',
  ROLE_SALES: 'Sales',
};

export const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  ROLE_ADMIN: 'Full system access',
  ROLE_FINANCE: 'Quotations, invoices, AR/AP reports',
  ROLE_PRODUCTION: 'Work progress, production tracking',
  ROLE_SALES: 'Quotations for assigned customers',
};
