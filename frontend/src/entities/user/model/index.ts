/**
 * User Model - Public API.
 *
 * Exports domain types and business rules.
 */

// Domain types
export type { User, UserDetails, UserListItem } from './user';

// Role types and constants
export type { RoleName, RoleBadgeVariant } from './role';
export {
  ALL_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_BADGE_VARIANTS,
} from './role';

// Business rules
export { userRules } from './user-rules';
