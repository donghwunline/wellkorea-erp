/**
 * User Management Page - Admin Only
 *
 * Refactored following Constitution Principle VI:
 * - Pure composition layer (no inline markup complexity)
 * - No business logic (delegated to services and form components)
 * - 4-Tier State Separation:
 *   Tier 1 (Local UI State): Modal open/close, form inputs → In form components
 *   Tier 2 (Page UI State): Search/pagination → useUserManagementPage hook
 *   Tier 3 (Server State): User list data → Direct service calls (TODO: migrate to React Query)
 *   Tier 4 (App Global State): Auth → authStore (already implemented)
 */

import { useCallback, useEffect, useState } from 'react';
import { type CreateUserRequest, type UpdateUserRequest, type UserDetails, userService, } from '@/services';
import { ROLE_LABELS, type RoleName } from '@/types/auth';
import type { PaginationMetadata } from '@/api/types';
import {
  Alert,
  Badge,
  type BadgeVariant,
  Button,
  Card,
  ConfirmationModal,
  EmptyState,
  IconButton,
  LoadingState,
  PageHeader,
  Pagination,
  SearchBar,
  Table,
} from '@/components/ui';
import { UserCreateForm, UserCustomersForm, UserEditForm, UserPasswordForm, UserRolesForm, } from '@/components/forms';
import { useUserManagementPage } from './_hooks/useUserManagementPage';

type ModalType = 'create' | 'edit' | 'roles' | 'password' | 'delete' | 'customers' | null;

// Role badge variant mapping (follows pattern from AuditLogPage.tsx)
const ROLE_BADGE_VARIANTS: Record<RoleName, BadgeVariant> = {
  ROLE_ADMIN: 'copper',
  ROLE_FINANCE: 'success',
  ROLE_PRODUCTION: 'info',
  ROLE_SALES: 'purple',
};

export function UserManagementPage() {
  // Page UI State (Tier 2) - from page hook
  const {
    page,
    setPage,
    search,
    searchInput,
    handleSearchChange,
    handleSearchSubmit,
    handleClearSearch,
  } = useUserManagementPage();

  // Server State (Tier 3) - TODO: Move to React Query
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local UI State (Tier 1) - Modal type and selected user
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userService.getUsers({
        page,
        size: 10,
        search: search || undefined,
      });
      setUsers(result.data);
      setPagination(result.pagination);
    } catch {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Format date utility
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Modal handlers
  const openModal = (type: ModalType, user?: UserDetails) => {
    setModalType(type);
    setSelectedUser(user || null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
  };

  // CRUD operations (delegate to service, refresh on success)
  const handleCreateUser = async (data: CreateUserRequest) => {
    await userService.createUser(data);
    fetchUsers();
  };

  const handleUpdateUser = async (id: number, data: UpdateUserRequest) => {
    await userService.updateUser(id, data);
    fetchUsers();
  };

  const handleAssignRoles = async (id: number, roles: RoleName[]) => {
    await userService.assignRoles(id, { roles });
    fetchUsers();
  };

  const handleChangePassword = async (id: number, password: string) => {
    await userService.changePassword(id, { newPassword: password });
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;
    await userService.deleteUser(selectedUser.id);
    closeModal();
    fetchUsers();
  };

  const handleActivateUser = async (user: UserDetails) => {
    try {
      await userService.activateUser(user.id);
      fetchUsers();
    } catch {
      setError('Failed to activate user');
    }
  };

  const handleAssignCustomers = async (id: number, customerIds: number[]) => {
    await userService.assignCustomers(id, customerIds);
  };

  // Render table body based on loading/empty/data state
  const renderTableBody = () => {
    if (isLoading) {
      return <LoadingState variant="table" colspan={5} message="Loading users..." />;
    }

    if (users.length === 0) {
      return (
        <EmptyState
          variant="table"
          colspan={5}
          message={search ? 'No users found matching your search.' : 'No users found.'}
        />
      );
    }

    return users.map(user => (
      <Table.Row key={user.id}>
        <Table.Cell>
          <div>
            <div className="font-medium text-white">{user.fullName}</div>
            <div className="text-sm text-steel-400">{user.username}</div>
            <div className="text-xs text-steel-500">{user.email}</div>
          </div>
        </Table.Cell>
        <Table.Cell>
          <div className="flex flex-wrap gap-1">
            {user.roles.map(role => (
              <Badge key={role} variant={ROLE_BADGE_VARIANTS[role] || 'purple'}>
                {ROLE_LABELS[role]}
              </Badge>
            ))}
          </div>
        </Table.Cell>
        <Table.Cell>
          <Badge variant={user.isActive ? 'success' : 'danger'} dot>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </Table.Cell>
        <Table.Cell className="text-steel-400">{formatDate(user.lastLoginAt)}</Table.Cell>
        <Table.Cell>
          <div className="flex justify-end gap-2">
            <IconButton
              onClick={() => openModal('edit', user)}
              aria-label="Edit user"
              title="Edit user"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </IconButton>
            <IconButton
              onClick={() => openModal('roles', user)}
              aria-label="Manage roles"
              title="Manage roles"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </IconButton>
            <IconButton
              onClick={() => openModal('password', user)}
              aria-label="Change password"
              title="Change password"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </IconButton>
            {user.roles.includes('ROLE_SALES') && (
              <IconButton
                onClick={() => openModal('customers', user)}
                aria-label="Assign customers"
                title="Assign customers"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </IconButton>
            )}
            {user.isActive ? (
              <IconButton
                onClick={() => openModal('delete', user)}
                variant="danger"
                aria-label="Deactivate user"
                title="Deactivate user"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </IconButton>
            ) : (
              <IconButton
                onClick={() => handleActivateUser(user)}
                variant="primary"
                aria-label="Activate user"
                title="Activate user"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </IconButton>
            )}
          </div>
        </Table.Cell>
      </Table.Row>
    ));
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
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
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

      {/* Users Table */}
      <Card variant="table">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>User</Table.HeaderCell>
              <Table.HeaderCell>Roles</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Last Login</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>{renderTableBody()}</Table.Body>
        </Table>
      </Card>

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
