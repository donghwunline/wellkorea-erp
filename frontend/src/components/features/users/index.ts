/**
 * User Feature Components
 *
 * Smart components for user management feature.
 * These components own their service calls and manage complex state.
 *
 * Components:
 * - UserManagementTable: Data table with user list, fetches from service, handles activation
 * - UserCreateForm: Modal form for creating users
 * - UserEditForm: Modal form for editing users
 * - UserRolesForm: Modal form for assigning roles
 * - UserPasswordForm: Modal form for changing password
 * - UserCustomersForm: Modal form for assigning customers
 * - UserDeactivateModal: Confirmation modal for deactivating users
 */

// Table component (handles data fetching and user activation)
export { UserManagementTable } from './UserManagementTable';
export type { UserManagementTableProps } from './UserManagementTable';

// Form components (own their service calls)
export { UserCreateForm } from './UserCreateForm';
export type { UserCreateFormProps } from './UserCreateForm';

export { UserEditForm } from './UserEditForm';
export type { UserEditFormProps } from './UserEditForm';

export { UserRolesForm } from './UserRolesForm';
export type { UserRolesFormProps } from './UserRolesForm';

export { UserPasswordForm } from './UserPasswordForm';
export type { UserPasswordFormProps } from './UserPasswordForm';

export { UserCustomersForm } from './UserCustomersForm';
export type { UserCustomersFormProps } from './UserCustomersForm';

// Modal components (own their service calls)
export { UserDeactivateModal } from './UserDeactivateModal';
export type { UserDeactivateModalProps } from './UserDeactivateModal';
