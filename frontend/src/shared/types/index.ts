/**
 * Shared types barrel export.
 *
 * NOTE: User and auth types have moved to @/entities/user.
 * This re-exports for backwards compatibility.
 * Prefer importing from @/entities/user directly.
 */

export type { User, UserDetails, RoleName } from '@/entities/user';
export { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/entities/user';
