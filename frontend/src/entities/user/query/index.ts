/**
 * User Query - Public API.
 *
 * Exports query keys, functions, and hooks.
 */

// Query keys
export { userQueryKeys } from './query-keys';

// Query functions (for prefetchQuery and setQueryData)
export { userQueryFns, type UserListParams, type PaginatedUsers } from './query-fns';

// Query hooks
export { useUser, type UseUserOptions } from './use-user';
export { useUsers, type UseUsersOptions } from './use-users';
export { useUserCustomers, type UseUserCustomersOptions } from './use-user-customers';
