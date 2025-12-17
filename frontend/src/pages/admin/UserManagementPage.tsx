/**
 * User Management Page - Admin Only
 *
 * Refactored following Constitution Principle VI:
 * - Pure composition layer (composes features and UI components)
 * - No direct service calls (uses feature hooks instead)
 * - 4-Tier State Separation:
 *   Tier 1 (Local UI State): Modal open/close, selected user -> Local state in page
 *   Tier 2 (Page UI State): Search/pagination -> useUserManagementPage hook
 *   Tier 3 (Server State): User list data -> UserManagementTable component
 *   Tier 4 (App Global State): Auth -> authStore via useAuth (not needed here)
 *
 * Import Policy:
 * - pages -> features: YES (via @/components/features/users)
 * - pages -> ui: YES (via @/components/ui)
 * - pages -> shared/hooks: YES (via @/shared/hooks) - for useAuth if needed
 * - pages -> services: NO (use feature hooks instead)
 * - pages -> stores: NO (use shared hooks instead)
 */

import { useState } from 'react';
import { Alert, Button, ConfirmationModal, Icon, PageHeader, SearchBar } from '@/components/ui';
import {
  UserCreateForm,
  UserCustomersForm,
  UserEditForm,
  UserManagementTable,
  UserPasswordForm,
  UserRolesForm,
  useUserManagementActions,
  useUserManagementPage,
} from '@/components/features/users';
import type { CreateUserRequest, RoleName, UpdateUserRequest, UserDetails } from '@/shared/types';

type ModalType = 'create' | 'edit' | 'roles' | 'password' | 'delete' | 'customers' | null;

export function UserManagementPage() {
  // Page UI State (Tier 2) - from feature hook
  const {
    page,
    setPage,
    search,
    searchInput,
    handleSearchChange,
    handleSearchSubmit,
    handleClearSearch,
  } = useUserManagementPage();

  // Feature actions - from feature hook (NO direct service imports)
  const {
    createUser,
    updateUser,
    deleteUser,
    activateUser,
    assignRoles,
    changePassword,
    assignCustomers,
    refreshTrigger,
  } = useUserManagementActions();

  // Local UI State (Tier 1) - Modal type and selected user
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal handlers
  const openModal = (type: ModalType, user?: UserDetails) => {
    setModalType(type);
    setSelectedUser(user || null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
  };

  // CRUD handlers (delegate to feature hook)
  const handleCreateUser = async (data: CreateUserRequest) => {
    await createUser(data);
  };

  const handleUpdateUser = async (id: number, data: UpdateUserRequest) => {
    await updateUser(id, data);
  };

  const handleAssignRoles = async (id: number, roles: RoleName[]) => {
    await assignRoles(id, roles);
  };

  const handleChangePassword = async (id: number, password: string) => {
    await changePassword(id, password);
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;
    await deleteUser(selectedUser.id);
    closeModal();
  };

  const handleActivateUser = async (user: UserDetails) => {
    try {
      await activateUser(user.id);
    } catch {
      setError('Failed to activate user');
    }
  };

  const handleAssignCustomers = async (id: number, customerIds: number[]) => {
    await assignCustomers(id, customerIds);
  };

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="User Management"
          description="Manage system users and their roles"
        />
        <PageHeader.Actions>
          <Button onClick={() => openModal('create')}>
            <Icon name="plus" className="h-5 w-5" />
            Add User
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Search Bar */}
      <div className="mb-6 flex gap-3">
        <SearchBar
          value={searchInput}
          onValueChange={handleSearchChange}
          onClear={handleClearSearch}
          placeholder="Search by username, email, or name..."
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
        />
        <Button variant="secondary" onClick={handleSearchSubmit}>
          Search
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Feature Table Component (handles data fetching) */}
      <UserManagementTable
        page={page}
        search={search}
        refreshTrigger={refreshTrigger}
        onPageChange={setPage}
        onEdit={user => openModal('edit', user)}
        onDelete={user => openModal('delete', user)}
        onRoles={user => openModal('roles', user)}
        onPassword={user => openModal('password', user)}
        onCustomers={user => openModal('customers', user)}
        onActivate={handleActivateUser}
        onError={setError}
      />

      {/* Modals - Each is self-contained with local UI state */}
      <UserCreateForm
        isOpen={modalType === 'create'}
        onClose={closeModal}
        onSubmit={handleCreateUser}
      />

      <UserEditForm
        isOpen={modalType === 'edit'}
        user={selectedUser}
        onClose={closeModal}
        onSubmit={handleUpdateUser}
      />

      <UserRolesForm
        isOpen={modalType === 'roles'}
        user={selectedUser}
        onClose={closeModal}
        onSubmit={handleAssignRoles}
      />

      <UserPasswordForm
        isOpen={modalType === 'password'}
        user={selectedUser}
        onClose={closeModal}
        onSubmit={handleChangePassword}
      />

      <UserCustomersForm
        isOpen={modalType === 'customers'}
        user={selectedUser}
        onClose={closeModal}
        onSubmit={handleAssignCustomers}
      />

      <ConfirmationModal
        isOpen={modalType === 'delete'}
        onClose={closeModal}
        onConfirm={handleDeactivateUser}
        title="Deactivate User"
        message={
          selectedUser
            ? `Are you sure you want to deactivate ${selectedUser.fullName}? This user will no longer be able to log in.`
            : ''
        }
        confirmLabel="Deactivate"
        variant="danger"
      />
    </div>
  );
}
