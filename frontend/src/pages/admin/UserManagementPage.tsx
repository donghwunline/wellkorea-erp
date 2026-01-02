/**
 * User Management Page - Admin Only
 *
 * Pure composition layer following FSD principles:
 * - Uses Query Factory for data fetching
 * - Composes entity UI components and feature forms
 * - No direct service calls in page layer
 *
 * 4-Tier State Separation:
 * - Tier 1 (Local UI State): Modal open/close, selected user
 * - Tier 2 (Page UI State): Search/pagination via usePaginatedSearch
 * - Tier 3 (Server State): User list via Query Factory
 * - Tier 4 (App Global State): Not needed here
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Icon, PageHeader, Pagination, SearchBar } from '@/shared/ui';
import { usePaginatedSearch } from '@/shared/lib/pagination';
import {
  userQueries,
  UserTable,
  UserTableSkeleton,
  type UserDetails,
} from '@/entities/user';
import { UserCreateForm } from '@/features/user/create';
import { UserEditForm } from '@/features/user/update';
import { UserDeactivateModal } from '@/features/user/deactivate';
import { UserPasswordForm } from '@/features/user/change-password';
import { UserRolesForm } from '@/features/user/assign-roles';
import { UserCustomersForm } from '@/features/user/assign-customers';
import { useActivateUser } from '@/features/user/activate';

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

  // Server State (Tier 3) - Query Factory pattern
  const {
    data,
    isLoading,
    error: queryError,
  } = useQuery(
    userQueries.list({
      page,
      size: 10,
      search,
    })
  );

  const users = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  // Local UI State (Tier 1) - Modal type and selected user
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Activate user mutation
  const { mutate: activateUser } = useActivateUser({
    onError: (err) => setError(err.message),
  });

  // Modal handlers
  const openModal = (type: ModalType, user?: UserDetails) => {
    setModalType(type);
    setSelectedUser(user || null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
  };

  // Success handler for forms/modals
  const handleFormSuccess = () => {
    // Query cache is automatically invalidated by mutation hooks
    closeModal();
  };

  // Handle activate user
  const handleActivate = (user: UserDetails) => {
    activateUser(user.id);
  };

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title="사용자 관리" description="Manage system users and their roles" />
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
      {(error || queryError) && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error || 'Failed to load users'}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && <UserTableSkeleton />}

      {/* User Table */}
      {!isLoading && !queryError && (
        <>
          <UserTable
            users={users}
            onEdit={user => openModal('edit', user)}
            onDeactivate={user => openModal('delete', user)}
            onActivate={handleActivate}
            onRoles={user => openModal('roles', user)}
            onPassword={user => openModal('password', user)}
            onCustomers={user => openModal('customers', user)}
            emptyMessage={search ? 'No users found matching your search.' : 'No users found.'}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalItems={pagination.totalElements}
                itemsPerPage={pagination.size}
                onPageChange={setPage}
                isFirst={pagination.first}
                isLast={pagination.last}
                itemLabel="users"
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
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
