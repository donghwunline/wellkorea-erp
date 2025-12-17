/**
 * Shared types barrel export.
 *
 * Only truly shared domain types belong here.
 * API DTOs (request/response) belong in service type files.
 */

export type { User, UserDetails, RoleName } from './auth';

export { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from './auth';
