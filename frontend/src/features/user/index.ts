/**
 * User Features - Public API.
 *
 * All user action features exported from a single location.
 */

// Create user
export { useCreateUser, type UseCreateUserOptions } from './create';

// Update user
export {
  useUpdateUser,
  type UseUpdateUserOptions,
  type UpdateUserMutationInput,
} from './update';

// Assign roles
export {
  useAssignRoles,
  type UseAssignRolesOptions,
  type AssignRolesMutationInput,
} from './assign-roles';

// Change password
export {
  useChangePassword,
  type UseChangePasswordOptions,
  type ChangePasswordMutationInput,
} from './change-password';

// Assign customers
export {
  useAssignCustomers,
  type UseAssignCustomersOptions,
  type AssignCustomersMutationInput,
} from './assign-customers';

// Deactivate user
export { useDeactivateUser, type UseDeactivateUserOptions } from './deactivate';

// Activate user
export { useActivateUser, type UseActivateUserOptions } from './activate';
