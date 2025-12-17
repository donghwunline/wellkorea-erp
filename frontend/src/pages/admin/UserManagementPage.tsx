/**
 * User Management Page - Admin Only
 *
 * Pure composition layer following Constitution Principle VI:
 * - Composes features and UI components
 * - No direct service calls (feature components own their service calls)
 * - 4-Tier State Separation:
 *   Tier 1 (Local UI State): Modal open/close, selected user -> Local state in page
 *   Tier 2 (Page UI State): Search/pagination -> usePaginatedSearch hook
 *   Tier 3 (Server State): User list data -> Feature components (forms, table)
 *   Tier 4 (App Global State): Auth -> authStore via useAuth (not needed here)
 *
 * Import Policy:
 * - pages -> features: YES (via @/components/features/users)
 * - pages -> ui: YES (via @/components/ui)
 * - pages -> shared/hooks: YES (via @/shared/hooks)
 * - pages -> services: NO (feature components handle this)
 * - pages -> stores: NO (use shared hooks instead)
 */

import { useReducer, useState } from 'react';
import { Alert, Button, Icon, PageHeader, SearchBar } from '@/components/ui';
import {
  UserCreateForm,
  UserCustomersForm,
  UserDeactivateModal,
  UserEditForm,
  UserManagementTable,
  UserPasswordForm,
  UserRolesForm,
} from '@/components/features/users';
import { usePaginatedSearch } from '@/shared/hooks';
import type { UserDetails } from '@/shared/types';

type ModalType = 'create' | 'edit' | 'roles' | 'password' | 'delete' | 'customers' | null;

export function UserManagementPage() {
  // Page UI State (Tier 2) - pagination and search
  const {
    page,
    setPage,
    search,
    searchInput,
    handleSearchChange,
    handleSearchSubmit,
    handleClearSearch,
  } = usePaginatedSearch();

  // Refresh trigger - increment to signal table to refetch
  const [refreshTrigger, triggerRefresh] = useReducer((x: number) => x + 1, 0);

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

  // Success handler for forms/modals - triggers refresh after operation completes
  const handleFormSuccess = () => {
    triggerRefresh();
    closeModal();
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

      {/* Feature Table Component (handles data fetching and activation) */}
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
        onError={setError}
      />

      {/* Modals - Feature components own their service calls */}
      <UserCreateForm
        isOpen={modalType === 'create'}
        onClose={closeModal}
        onSuccess={handleFormSuccess}
      />

      <UserEditForm
        isOpen={modalType === 'edit'}
        user={selectedUser}
        onClose={closeModal}
        onSuccess={handleFormSuccess}
      />

      <UserRolesForm
        isOpen={modalType === 'roles'}
        user={selectedUser}
        onClose={closeModal}
        onSuccess={handleFormSuccess}
      />

      <UserPasswordForm
        isOpen={modalType === 'password'}
        user={selectedUser}
        onClose={closeModal}
        onSuccess={handleFormSuccess}
      />

      <UserCustomersForm
        isOpen={modalType === 'customers'}
        user={selectedUser}
        onClose={closeModal}
        onSuccess={handleFormSuccess}
      />

      <UserDeactivateModal
        isOpen={modalType === 'delete'}
        user={selectedUser}
        onClose={closeModal}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
