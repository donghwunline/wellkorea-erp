/**
 * User Management Table - Smart Feature Component
 *
 * Responsibilities:
 * - Fetch user list data from userService
 * - Display users in table format
 * - Delegate actions to parent via callbacks
 * - Respond to refreshTrigger changes
 *
 * This component owns Server State (Tier 3) for the user list.
 */

import { useCallback, useEffect, useState } from 'react';
import { ROLE_LABELS, type RoleName, type UserDetails, userService } from '@/services';
import { formatDateTime } from '@/shared/formatting';
import type { PaginationMetadata } from '@/shared/api/types';
import {
  Badge,
  type BadgeVariant,
  Card,
  EmptyState,
  Icon,
  IconButton,
  LoadingState,
  Pagination,
  Table,
} from '@/shared/ui';

// Role badge variant mapping
const ROLE_BADGE_VARIANTS: Record<RoleName, BadgeVariant> = {
  ROLE_ADMIN: 'copper',
  ROLE_FINANCE: 'success',
  ROLE_PRODUCTION: 'info',
  ROLE_SALES: 'purple',
};

export interface UserManagementTableProps {
  /** Current page (0-indexed) */
  page: number;
  /** Search query string */
  search: string;
  /** Increment to trigger data refetch */
  refreshTrigger: number;
  /** Called when page changes */
  onPageChange: (page: number) => void;
  /** Called when user clicks edit */
  onEdit: (user: UserDetails) => void;
  /** Called when user clicks delete/deactivate */
  onDelete: (user: UserDetails) => void;
  /** Called when user clicks manage roles */
  onRoles: (user: UserDetails) => void;
  /** Called when user clicks change password */
  onPassword: (user: UserDetails) => void;
  /** Called when user clicks assign customers (for ROLE_SALES users) */
  onCustomers: (user: UserDetails) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

/**
 * Smart table component that fetches and displays users.
 *
 * @example
 * ```tsx
 * <UserManagementTable
 *   page={page}
 *   search={search}
 *   refreshTrigger={refreshTrigger}
 *   onPageChange={setPage}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   ...
 * />
 * ```
 */
export function UserManagementTable({
  page,
  search,
  refreshTrigger,
  onPageChange,
  onEdit,
  onDelete,
  onRoles,
  onPassword,
  onCustomers,
  onError,
}: Readonly<UserManagementTableProps>) {
  // Server State (Tier 3) - managed here in feature component
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const errorMsg = 'Failed to load users';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, onError]);

  // Refetch when page, search, or refreshTrigger changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshTrigger]);

  // Handle user activation (owned by this component)
  const handleActivate = useCallback(
    async (user: UserDetails) => {
      try {
        await userService.activateUser(user.id);
        await fetchUsers();
      } catch {
        onError?.('Failed to activate user');
      }
    },
    [fetchUsers, onError]
  );

  // Render loading state
  if (isLoading) {
    return (
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
          <Table.Body>
            <LoadingState variant="table" colspan={5} message="Loading users..." />
          </Table.Body>
        </Table>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card variant="table">
        <div className="p-8 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => fetchUsers()}
            className="mt-4 text-sm text-copper-500 hover:underline"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
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
          <Table.Body>
            {users.length === 0 ? (
              <EmptyState
                variant="table"
                colspan={5}
                message={search ? 'No users found matching your search.' : 'No users found.'}
              />
            ) : (
              users.map(user => (
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
                  <Table.Cell className="text-steel-400">{formatDateTime(user.lastLoginAt)}</Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end gap-2">
                      <IconButton
                        onClick={() => onEdit(user)}
                        aria-label="Edit user"
                        title="Edit user"
                      >
                        <Icon name="pencil" className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        onClick={() => onRoles(user)}
                        aria-label="Manage roles"
                        title="Manage roles"
                      >
                        <Icon name="shield" className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        onClick={() => onPassword(user)}
                        aria-label="Change password"
                        title="Change password"
                      >
                        <Icon name="key" className="h-4 w-4" />
                      </IconButton>
                      {user.roles.includes('ROLE_SALES') && (
                        <IconButton
                          onClick={() => onCustomers(user)}
                          aria-label="Assign customers"
                          title="Assign customers"
                        >
                          <Icon name="users" className="h-4 w-4" />
                        </IconButton>
                      )}
                      {user.isActive ? (
                        <IconButton
                          onClick={() => onDelete(user)}
                          variant="danger"
                          aria-label="Deactivate user"
                          title="Deactivate user"
                        >
                          <Icon name="ban" className="h-4 w-4" />
                        </IconButton>
                      ) : (
                        <IconButton
                          onClick={() => handleActivate(user)}
                          variant="primary"
                          aria-label="Activate user"
                          title="Activate user"
                        >
                          <Icon name="check-circle" className="h-4 w-4" />
                        </IconButton>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalItems={pagination.totalElements}
            itemsPerPage={pagination.size}
            onPageChange={onPageChange}
            isFirst={pagination.first}
            isLast={pagination.last}
            itemLabel="users"
          />
        </div>
      )}
    </>
  );
}
