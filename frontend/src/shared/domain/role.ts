/**
 * Role domain types and constants.
 *
 * Defines user roles and their metadata.
 * Shared between auth and user entities.
 */

/**
 * Available role names in the system.
 */
export type RoleName = 'ROLE_ADMIN' | 'ROLE_FINANCE' | 'ROLE_PRODUCTION' | 'ROLE_SALES';

/**
 * Array of all role names for iteration.
 */
export const ALL_ROLES: readonly RoleName[] = [
  'ROLE_ADMIN',
  'ROLE_FINANCE',
  'ROLE_PRODUCTION',
  'ROLE_SALES',
] as const;

/**
 * Human-readable labels for each role.
 */
export const ROLE_LABELS: Record<RoleName, string> = {
  ROLE_ADMIN: 'Administrator',
  ROLE_FINANCE: 'Finance',
  ROLE_PRODUCTION: 'Production',
  ROLE_SALES: 'Sales',
};

/**
 * Descriptions explaining what each role can do.
 */
export const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  ROLE_ADMIN: 'Full system access',
  ROLE_FINANCE: 'Quotations, invoices, AR/AP reports',
  ROLE_PRODUCTION: 'Work progress, production tracking',
  ROLE_SALES: 'Quotations for assigned customers',
};

/**
 * Badge variant mapping for role display.
 */
export type RoleBadgeVariant = 'copper' | 'success' | 'info' | 'purple';

export const ROLE_BADGE_VARIANTS: Record<RoleName, RoleBadgeVariant> = {
  ROLE_ADMIN: 'copper',
  ROLE_FINANCE: 'success',
  ROLE_PRODUCTION: 'info',
  ROLE_SALES: 'purple',
};
