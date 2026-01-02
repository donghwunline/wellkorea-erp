/**
 * User Entity - Public API.
 *
 * This is the ONLY entry point for importing from the user entity.
 * Internal modules (model/, api/, query/) should never be imported directly.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 *
 * @see docs/architecture/fsd-public-api-guidelines.md
 */

// =============================================================================
// DOMAIN TYPES
// Types that appear in component props, state, or function signatures
// =============================================================================

export type { User, UserDetails, UserListItem } from './model/user';
export type { RoleName, RoleBadgeVariant } from './model/role';

// =============================================================================
// ROLE CONSTANTS
// Role labels, descriptions, and configuration
// =============================================================================

export { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_BADGE_VARIANTS } from './model/role';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic
// =============================================================================

export { userRules } from './model/user-rules';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// Use with useQuery() directly - no custom hooks needed
// =============================================================================

export { userQueries, type UserListQueryParams } from './api/user.queries';

// =============================================================================
// FORM TYPES
// Input types for forms (used by features layer)
// =============================================================================

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
} from './api/user.command-mapper';

// =============================================================================
// API ACCESS (for features layer mutations only)
// These are needed by features/user/* for CRUD operations
// =============================================================================

export { userApi } from './api/user.api';
export { userMapper } from './api/user.mapper';
export { userCommandMapper } from './api/user.command-mapper';

// DTO types for low-level access if needed
export type {
  UserDetailsDTO,
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  AssignRolesRequestDTO,
  ChangePasswordRequestDTO,
  AssignCustomersRequestDTO,
  UserListParamsDTO,
  UserCommandResultDTO,
} from './api/user.dto';

// =============================================================================
// UI COMPONENTS
// Display-only components with no side effects
// =============================================================================

export { UserTable, UserTableSkeleton, type UserTableProps } from './ui/UserTable';
export { UserCombobox, type UserComboboxProps } from './ui/UserCombobox';
