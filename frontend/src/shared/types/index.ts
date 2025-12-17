/**
 * Shared types barrel export.
 *
 * Type definitions used across multiple layers.
 * Types are the "lowest layer" - no runtime dependencies.
 */

export type {
  User,
  UserDetails,
  RoleName,
  LoginRequest,
  LoginResponse,
  AuthState,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRolesRequest,
  ChangePasswordRequest,
} from './auth';

export { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from './auth';
