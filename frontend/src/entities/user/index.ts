/**
 * User Entity - Public API.
 *
 * Exports all user domain types, rules, API, and query hooks.
 *
 * @example
 * ```tsx
 * import { useUsers, userRules, type UserDetails, UserTable } from '@/entities/user';
 *
 * function UserListPage() {
 *   const { data } = useUsers({ page: 0, search: '' });
 *   const users = data?.data ?? [];
 *
 *   return (
 *     <UserTable
 *       users={users}
 *       canEdit={(user) => userRules.canEdit(user)}
 *     />
 *   );
 * }
 * ```
 */

// ==================== MODEL ====================
// Domain types
export type { User, UserDetails, UserListItem } from './model';

// Role types and constants
export type { RoleName, RoleBadgeVariant } from './model';
export {
  ALL_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_BADGE_VARIANTS,
} from './model';

// Business rules
export { userRules } from './model';

// ==================== API ====================
// DTOs (for type compatibility if needed)
export type {
  UserDetailsDTO,
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  AssignRolesRequestDTO,
  ChangePasswordRequestDTO,
  AssignCustomersRequestDTO,
  UserListParamsDTO,
  UserCommandResultDTO,
} from './api';

// Mappers
export { userMapper, userCommandMapper } from './api';
export type {
  CreateUserInput,
  CreateUserCommand,
  UpdateUserInput,
  UpdateUserCommand,
  AssignRolesInput,
  AssignRolesCommand,
  ChangePasswordInput,
  ChangePasswordCommand,
  AssignCustomersInput,
  AssignCustomersCommand,
} from './api';

// API functions
export { userApi, type PaginatedUsersDTO } from './api';

// ==================== QUERY ====================
// Query keys
export { userQueryKeys } from './query';

// Query functions
export { userQueryFns, type UserListParams, type PaginatedUsers } from './query';

// Query hooks
export { useUser, type UseUserOptions } from './query';
export { useUsers, type UseUsersOptions } from './query';
export { useUserCustomers, type UseUserCustomersOptions } from './query';
