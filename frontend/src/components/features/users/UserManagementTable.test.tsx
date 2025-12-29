/**
 * Unit tests for UserManagementTable component.
 * Tests data fetching, table rendering, pagination, user actions, loading/error states, and accessibility.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { UserManagementTable } from './UserManagementTable';
import { createMockUserDetails, mockUserDetails } from '@/test/fixtures';
import type { Paginated } from '@/api/types';
import type { UserDetails } from '@/shared/types/auth';
import { userService } from '@/services';

// Mock userService while preserving other exports
vi.mock('@/services', async importOriginal => {
  const actual = await importOriginal<typeof import('@/services')>();
  return {
    ...actual,
    userService: {
      getUsers: vi.fn(),
      activateUser: vi.fn(),
    },
  };
});

// Helper to create paginated response
function createPaginatedUsers(
  users: UserDetails[],
  options: { page?: number; totalPages?: number; totalElements?: number } = {}
): Paginated<UserDetails> {
  const { page = 0, totalPages = 1, totalElements = users.length } = options;
  return {
    data: users,
    pagination: {
      page,
      size: 10,
      totalElements,
      totalPages,
      first: page === 0,
      last: page === totalPages - 1,
    },
  };
}

describe('UserManagementTable', () => {
  const mockOnPageChange = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnRoles = vi.fn();
  const mockOnPassword = vi.fn();
  const mockOnCustomers = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderTable(props: Partial<React.ComponentProps<typeof UserManagementTable>> = {}) {
    const defaultProps = {
      page: 0,
      search: '',
      refreshTrigger: 0,
      onPageChange: mockOnPageChange,
      onEdit: mockOnEdit,
      onDelete: mockOnDelete,
      onRoles: mockOnRoles,
      onPassword: mockOnPassword,
      onCustomers: mockOnCustomers,
      onError: mockOnError,
    };
    return render(<UserManagementTable {...defaultProps} {...props} />);
  }

  describe('data fetching', () => {
    it('should fetch users on mount', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(createPaginatedUsers([]));

      renderTable();

      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledOnce();
        expect(userService.getUsers).toHaveBeenCalledWith({ page: 0, size: 10, search: undefined });
      });
    });

    it('should fetch users with search parameter', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(createPaginatedUsers([]));

      renderTable({ search: 'admin' });

      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledWith({ page: 0, size: 10, search: 'admin' });
      });
    });

    it('should fetch users with page parameter', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(createPaginatedUsers([]));

      renderTable({ page: 2 });

      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledWith({ page: 2, size: 10, search: undefined });
      });
    });

    it('should refetch when refreshTrigger changes', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(createPaginatedUsers([]));

      const { rerender } = renderTable({ refreshTrigger: 0 });

      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledTimes(1);
      });

      rerender(
        <UserManagementTable
          page={0}
          search=""
          refreshTrigger={1}
          onPageChange={mockOnPageChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRoles={mockOnRoles}
          onPassword={mockOnPassword}
          onCustomers={mockOnCustomers}
        />
      );

      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch when search changes', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(createPaginatedUsers([]));

      const { rerender } = renderTable({ search: '' });

      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledTimes(1);
      });

      rerender(
        <UserManagementTable
          page={0}
          search="new search"
          refreshTrigger={0}
          onPageChange={mockOnPageChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onRoles={mockOnRoles}
          onPassword={mockOnPassword}
          onCustomers={mockOnCustomers}
        />
      );

      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('loading state', () => {
    it('should show loading state while fetching', async () => {
      let resolveUsers: (value: Paginated<UserDetails>) => void;
      vi.mocked(userService.getUsers).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveUsers = resolve;
          })
      );

      renderTable();

      expect(screen.getByText('Loading users...')).toBeInTheDocument();

      resolveUsers!(createPaginatedUsers([]));

      await waitFor(() => {
        expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
      });
    });

    it('should render table header during loading', () => {
      vi.mocked(userService.getUsers).mockImplementation(() => new Promise(() => {}));

      renderTable();

      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Roles')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Last Login')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message when fetch fails', async () => {
      vi.mocked(userService.getUsers).mockRejectedValue(new Error('Network error'));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Failed to load users')).toBeInTheDocument();
      });
    });

    it('should call onError callback when fetch fails', async () => {
      vi.mocked(userService.getUsers).mockRejectedValue(new Error('Network error'));

      renderTable();

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to load users');
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(userService.getUsers).mockRejectedValue(new Error('Network error'));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should refetch when retry is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.getUsers).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(userService.getUsers).mockResolvedValueOnce(createPaginatedUsers([]));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('empty state', () => {
    it('should show empty message when no users', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(createPaginatedUsers([]));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('No users found.')).toBeInTheDocument();
      });
    });

    it('should show search-specific message when search has no results', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(createPaginatedUsers([]));

      renderTable({ search: 'nonexistent' });

      await waitFor(() => {
        expect(screen.getByText('No users found matching your search.')).toBeInTheDocument();
      });
    });
  });

  describe('table rendering', () => {
    it('should render user data in table', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText(mockUserDetails.adminUser.fullName)).toBeInTheDocument();
      });
      expect(screen.getByText(mockUserDetails.adminUser.username)).toBeInTheDocument();
      expect(screen.getByText(mockUserDetails.adminUser.email)).toBeInTheDocument();
    });

    it('should render user roles as badges', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });
    });

    it('should render multiple roles for multi-role user', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.multiRoleUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    it('should render active status badge', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should render inactive status badge', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.inactiveUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });

    it('should format last login date', async () => {
      const userWithLogin = createMockUserDetails({
        lastLoginAt: '2025-01-15T10:30:00Z',
      });
      vi.mocked(userService.getUsers).mockResolvedValue(createPaginatedUsers([userWithLogin]));

      renderTable();

      await waitFor(() => {
        // Date is formatted in Korean locale (ko-KR)
        expect(screen.getByText(/2025/)).toBeInTheDocument();
      });
    });

    it('should show dash for null last login', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.neverLoggedIn])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument();
      });
    });

    it('should render multiple users', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([
          mockUserDetails.adminUser,
          mockUserDetails.salesUser,
          mockUserDetails.financeUser,
        ])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText(mockUserDetails.adminUser.fullName)).toBeInTheDocument();
      });
      expect(screen.getByText(mockUserDetails.salesUser.fullName)).toBeInTheDocument();
      expect(screen.getByText(mockUserDetails.financeUser.fullName)).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should render edit button for each user', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit user/i })).toBeInTheDocument();
      });
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit user/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit user/i }));

      expect(mockOnEdit).toHaveBeenCalledOnce();
      expect(mockOnEdit).toHaveBeenCalledWith(mockUserDetails.adminUser);
    });

    it('should call onRoles when manage roles button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /manage roles/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /manage roles/i }));

      expect(mockOnRoles).toHaveBeenCalledOnce();
      expect(mockOnRoles).toHaveBeenCalledWith(mockUserDetails.adminUser);
    });

    it('should call onPassword when change password button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /change password/i }));

      expect(mockOnPassword).toHaveBeenCalledOnce();
      expect(mockOnPassword).toHaveBeenCalledWith(mockUserDetails.adminUser);
    });

    it('should show assign customers button only for sales users', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.salesUser, mockUserDetails.financeUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText(mockUserDetails.salesUser.fullName)).toBeInTheDocument();
      });

      // Only one "assign customers" button for the sales user
      const customersButtons = screen.getAllByRole('button', { name: /assign customers/i });
      expect(customersButtons).toHaveLength(1);
    });

    it('should call onCustomers when assign customers button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.salesUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /assign customers/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /assign customers/i }));

      expect(mockOnCustomers).toHaveBeenCalledOnce();
      expect(mockOnCustomers).toHaveBeenCalledWith(mockUserDetails.salesUser);
    });
  });

  describe('deactivate/activate functionality', () => {
    it('should show deactivate button for active users', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /deactivate user/i })).toBeInTheDocument();
      });
    });

    it('should call onDelete when deactivate button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /deactivate user/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /deactivate user/i }));

      expect(mockOnDelete).toHaveBeenCalledOnce();
      expect(mockOnDelete).toHaveBeenCalledWith(mockUserDetails.adminUser);
    });

    it('should show activate button for inactive users', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.inactiveUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /activate user/i })).toBeInTheDocument();
      });
    });

    it('should call userService.activateUser when activate button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.inactiveUser])
      );
      vi.mocked(userService.activateUser).mockResolvedValue(undefined);

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /activate user/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /activate user/i }));

      await waitFor(() => {
        expect(userService.activateUser).toHaveBeenCalledOnce();
        expect(userService.activateUser).toHaveBeenCalledWith(mockUserDetails.inactiveUser.id);
      });
    });

    it('should refetch users after activation', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.inactiveUser])
      );
      vi.mocked(userService.activateUser).mockResolvedValue(undefined);

      renderTable();

      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledTimes(1);
      });

      await user.click(screen.getByRole('button', { name: /activate user/i }));

      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledTimes(2);
      });
    });

    it('should call onError if activation fails', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.inactiveUser])
      );
      vi.mocked(userService.activateUser).mockRejectedValue(new Error('Activation failed'));

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /activate user/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /activate user/i }));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to activate user');
      });
    });
  });

  describe('pagination', () => {
    it('should not render pagination when only one page', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser], { totalPages: 1 })
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText(mockUserDetails.adminUser.fullName)).toBeInTheDocument();
      });

      // Pagination should not be visible
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should render pagination when multiple pages', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser], { totalPages: 3, totalElements: 30 })
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText(mockUserDetails.adminUser.fullName)).toBeInTheDocument();
      });

      // Look for pagination elements
      expect(screen.getByText(/users/i)).toBeInTheDocument();
    });
  });

  describe('table header', () => {
    it('should render all column headers', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });
      expect(screen.getByText('Roles')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Last Login')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper table structure', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should have action buttons with aria-labels', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.salesUser])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit user/i })).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /manage roles/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /assign customers/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /deactivate user/i })).toBeInTheDocument();
    });

    it('should have title attributes on action buttons', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue(
        createPaginatedUsers([mockUserDetails.adminUser])
      );

      renderTable();

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit user/i });
        expect(editButton).toHaveAttribute('title', 'Edit user');
      });
    });
  });
});
