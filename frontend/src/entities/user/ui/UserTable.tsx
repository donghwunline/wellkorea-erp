/**
 * User Table.
 *
 * Pure display component for user list.
 * Receives data via props - no data fetching.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives all data via props
 * - Delegates actions via callbacks
 */

import type { UserDetails } from '../model/user';
import type { RoleName } from '../model/role';
import { ROLE_LABELS } from '../model/role';
import { formatDateTime } from '@/shared/lib/formatting';
import {
  Badge,
  type BadgeVariant,
  Card,
  EmptyState,
  Icon,
  IconButton,
  Table,
} from '@/shared/ui';

/** Role badge variant mapping */
const ROLE_BADGE_VARIANTS: Record<RoleName, BadgeVariant> = {
  ROLE_ADMIN: 'copper',
  ROLE_FINANCE: 'success',
  ROLE_PRODUCTION: 'info',
  ROLE_SALES: 'purple',
};

export interface UserTableProps {
  /** Users to display */
  users: readonly UserDetails[];
  /** Called when user clicks edit */
  onEdit?: (user: UserDetails) => void;
  /** Called when user clicks deactivate */
  onDeactivate?: (user: UserDetails) => void;
  /** Called when user clicks activate */
  onActivate?: (user: UserDetails) => void;
  /** Called when user clicks manage roles */
  onRoles?: (user: UserDetails) => void;
  /** Called when user clicks change password */
  onPassword?: (user: UserDetails) => void;
  /** Called when user clicks assign customers (for ROLE_SALES users) */
  onCustomers?: (user: UserDetails) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional className */
  className?: string;
}

/**
 * User table component.
 *
 * This is a pure display component that:
 * - Renders user data in a table format
 * - Receives all data via props
 * - Delegates all actions to parent via callbacks
 *
 * @example
 * ```tsx
 * function UserManagementPage() {
 *   const { data, isLoading } = useQuery(userQueries.list({ page, size: 10 }));
 *
 *   if (isLoading) return <UserTableSkeleton />;
 *
 *   return (
 *     <UserTable
 *       users={data?.data ?? []}
 *       onEdit={handleEdit}
 *       onDeactivate={handleDeactivate}
 *       onActivate={handleActivate}
 *       onRoles={handleRoles}
 *       onPassword={handlePassword}
 *       onCustomers={handleCustomers}
 *     />
 *   );
 * }
 * ```
 */
export function UserTable({
  users,
  onEdit,
  onDeactivate,
  onActivate,
  onRoles,
  onPassword,
  onCustomers,
  emptyMessage = 'No users found.',
  className,
}: Readonly<UserTableProps>) {
  return (
    <Card variant="table" className={className}>
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
            <EmptyState variant="table" colspan={5} message={emptyMessage} />
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
                <Table.Cell className="text-steel-400">
                  {formatDateTime(user.lastLoginAt)}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <IconButton
                        onClick={() => onEdit(user)}
                        aria-label="Edit user"
                        title="Edit user"
                      >
                        <Icon name="pencil" className="h-4 w-4" />
                      </IconButton>
                    )}
                    {onRoles && (
                      <IconButton
                        onClick={() => onRoles(user)}
                        aria-label="Manage roles"
                        title="Manage roles"
                      >
                        <Icon name="shield" className="h-4 w-4" />
                      </IconButton>
                    )}
                    {onPassword && (
                      <IconButton
                        onClick={() => onPassword(user)}
                        aria-label="Change password"
                        title="Change password"
                      >
                        <Icon name="key" className="h-4 w-4" />
                      </IconButton>
                    )}
                    {onCustomers && user.roles.includes('ROLE_SALES') && (
                      <IconButton
                        onClick={() => onCustomers(user)}
                        aria-label="Assign customers"
                        title="Assign customers"
                      >
                        <Icon name="users" className="h-4 w-4" />
                      </IconButton>
                    )}
                    {user.isActive ? (
                      onDeactivate && (
                        <IconButton
                          onClick={() => onDeactivate(user)}
                          variant="danger"
                          aria-label="Deactivate user"
                          title="Deactivate user"
                        >
                          <Icon name="ban" className="h-4 w-4" />
                        </IconButton>
                      )
                    ) : (
                      onActivate && (
                        <IconButton
                          onClick={() => onActivate(user)}
                          variant="primary"
                          aria-label="Activate user"
                          title="Activate user"
                        >
                          <Icon name="check-circle" className="h-4 w-4" />
                        </IconButton>
                      )
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Card>
  );
}

/**
 * Loading skeleton for UserTable.
 */
export function UserTableSkeleton({ className }: { className?: string }) {
  return (
    <Card variant="table" className={className}>
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
          {[1, 2, 3, 4, 5].map(i => (
            <Table.Row key={i}>
              <Table.Cell>
                <div className="space-y-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-steel-800" />
                  <div className="h-3 w-24 animate-pulse rounded bg-steel-800" />
                  <div className="h-3 w-40 animate-pulse rounded bg-steel-800" />
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-1">
                  <div className="h-5 w-16 animate-pulse rounded bg-steel-800" />
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="h-5 w-16 animate-pulse rounded bg-steel-800" />
              </Table.Cell>
              <Table.Cell>
                <div className="h-4 w-28 animate-pulse rounded bg-steel-800" />
              </Table.Cell>
              <Table.Cell>
                <div className="flex justify-end gap-2">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="h-8 w-8 animate-pulse rounded bg-steel-800" />
                  ))}
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}
