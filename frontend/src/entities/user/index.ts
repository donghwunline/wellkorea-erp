/**
 * User Entity - Public API.
 *
 * This is the ONLY entry point for importing from the user entity.
 * Internal modules (model/, api/) should never be imported directly.
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
// COMMAND FUNCTIONS
// =============================================================================

export { createUser, type CreateUserInput } from './api/create-user';
export { updateUser, type UpdateUserInput } from './api/update-user';
export { assignRoles, type AssignRolesInput } from './api/assign-roles';
export { changePassword, type ChangePasswordInput } from './api/change-password';
export {
  assignCustomers,
  getCustomerAssignments,
  type AssignCustomersInput,
} from './api/assign-customers';
export { activateUser } from './api/activate-user';
export { deactivateUser } from './api/deactivate-user';

// =============================================================================
// UI COMPONENTS
// Display-only components with no side effects
// =============================================================================

export { UserTable, UserTableSkeleton, type UserTableProps } from './ui/UserTable';
export { UserCombobox, type UserComboboxProps } from './ui/UserCombobox';
