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

export type { User, UserDetails, UserListItem, RoleName } from './model';

// =============================================================================
// ROLE CONSTANTS
// Role labels, descriptions, and configuration
// =============================================================================

export { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from './model';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic
// =============================================================================

export { userRules } from './model';

// =============================================================================
// QUERY HOOKS
// Main data access interface - prefer these over direct API calls
// =============================================================================

export { useUser, useUsers, useUserCustomers } from './query';

// Query keys for cache invalidation (used by features for mutations)
export { userQueryKeys } from './query';

// =============================================================================
// FORM TYPES
// Input types for forms (used by features layer)
// =============================================================================

export type {
  CreateUserInput,
  UpdateUserInput,
  AssignRolesInput,
  ChangePasswordInput,
  AssignCustomersInput,
} from './api';

// =============================================================================
// API ACCESS (for features layer mutations only)
// These are needed by features/user/* for CRUD operations
// =============================================================================

export { userApi } from './api';
export { userMapper, userCommandMapper } from './api';
