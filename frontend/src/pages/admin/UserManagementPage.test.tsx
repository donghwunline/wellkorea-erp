/**
 * Unit tests for UserManagementPage component.
 * Tests page rendering, modal state management, search interactions, error display, and accessibility.
 *
 * Following Constitution Principle VI, this tests the page as a composition layer:
 * - Feature components are mocked (they own their service calls)
 * - Shared hooks are mocked
 * - Focus is on modal state, props passing, and page-level interactions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { UserManagementPage } from './UserManagementPage';
import { mockUserDetails } from '@/test/fixtures';
import type { UserDetails } from '@/shared/types/auth';
// Import mocked hook for type-safe assertions
import { usePaginatedSearch } from '@/shared/hooks';

// Helper to render UserManagementPage with BrowserRouter
function renderUserManagementPage() {
  return render(
    <BrowserRouter>
      <UserManagementPage />
    </BrowserRouter>
  );
}

// Track props passed to mocked components (only those used in assertions)
let userTableProps: Record<string, unknown> = {};
let editFormProps: Record<string, unknown> = {};

// Mock shared hooks
const mockSetPage = vi.fn();
const mockHandleSearchChange = vi.fn();
const mockHandleSearchSubmit = vi.fn();
const mockHandleClearSearch = vi.fn();

vi.mock('@/shared/hooks', () => ({
  usePaginatedSearch: vi.fn(() => ({
    page: 0,
    setPage: mockSetPage,
    search: '',
    searchInput: '',
    handleSearchChange: mockHandleSearchChange,
    handleSearchSubmit: mockHandleSearchSubmit,
    handleClearSearch: mockHandleClearSearch,
  })),
}));

// Mock feature components - capture props for assertions
vi.mock('@/components/features/users', () => ({
  UserManagementTable: vi.fn((props: Record<string, unknown>) => {
    userTableProps = props;
    return (
      <div data-testid="user-management-table">
        <button
          data-testid="trigger-edit"
          onClick={() => (props.onEdit as (user: UserDetails) => void)(mockUserDetails.adminUser)}
        >
          Trigger Edit
        </button>
        <button
          data-testid="trigger-delete"
          onClick={() => (props.onDelete as (user: UserDetails) => void)(mockUserDetails.adminUser)}
        >
          Trigger Delete
        </button>
        <button
          data-testid="trigger-roles"
          onClick={() => (props.onRoles as (user: UserDetails) => void)(mockUserDetails.adminUser)}
        >
          Trigger Roles
        </button>
        <button
          data-testid="trigger-password"
          onClick={() =>
            (props.onPassword as (user: UserDetails) => void)(mockUserDetails.adminUser)
          }
        >
          Trigger Password
        </button>
        <button
          data-testid="trigger-customers"
          onClick={() =>
            (props.onCustomers as (user: UserDetails) => void)(mockUserDetails.salesUser)
          }
        >
          Trigger Customers
        </button>
        <button
          data-testid="trigger-error"
          onClick={() => (props.onError as (error: string) => void)('Test error message')}
        >
          Trigger Error
        </button>
      </div>
    );
  }),
  UserCreateForm: vi.fn((props: Record<string, unknown>) => {
    return props.isOpen ? (
      <div data-testid="create-form">
        <button data-testid="create-form-close" onClick={() => (props.onClose as () => void)()}>
          Close
        </button>
        <button data-testid="create-form-success" onClick={() => (props.onSuccess as () => void)()}>
          Success
        </button>
      </div>
    ) : null;
  }),
  UserEditForm: vi.fn((props: Record<string, unknown>) => {
    editFormProps = props;
    return props.isOpen ? (
      <div data-testid="edit-form">
        <span data-testid="edit-form-user">{(props.user as UserDetails | null)?.username}</span>
        <button data-testid="edit-form-close" onClick={() => (props.onClose as () => void)()}>
          Close
        </button>
        <button data-testid="edit-form-success" onClick={() => (props.onSuccess as () => void)()}>
          Success
        </button>
      </div>
    ) : null;
  }),
  UserRolesForm: vi.fn((props: Record<string, unknown>) => {
    return props.isOpen ? (
      <div data-testid="roles-form">
        <span data-testid="roles-form-user">{(props.user as UserDetails | null)?.username}</span>
        <button data-testid="roles-form-close" onClick={() => (props.onClose as () => void)()}>
          Close
        </button>
        <button data-testid="roles-form-success" onClick={() => (props.onSuccess as () => void)()}>
          Success
        </button>
      </div>
    ) : null;
  }),
  UserPasswordForm: vi.fn((props: Record<string, unknown>) => {
    return props.isOpen ? (
      <div data-testid="password-form">
        <span data-testid="password-form-user">{(props.user as UserDetails | null)?.username}</span>
        <button data-testid="password-form-close" onClick={() => (props.onClose as () => void)()}>
          Close
        </button>
        <button
          data-testid="password-form-success"
          onClick={() => (props.onSuccess as () => void)()}
        >
          Success
        </button>
      </div>
    ) : null;
  }),
  UserCustomersForm: vi.fn((props: Record<string, unknown>) => {
    return props.isOpen ? (
      <div data-testid="customers-form">
        <span data-testid="customers-form-user">
          {(props.user as UserDetails | null)?.username}
        </span>
        <button data-testid="customers-form-close" onClick={() => (props.onClose as () => void)()}>
          Close
        </button>
        <button
          data-testid="customers-form-success"
          onClick={() => (props.onSuccess as () => void)()}
        >
          Success
        </button>
      </div>
    ) : null;
  }),
  UserDeactivateModal: vi.fn((props: Record<string, unknown>) => {
    return props.isOpen ? (
      <div data-testid="deactivate-modal">
        <span data-testid="deactivate-modal-user">
          {(props.user as UserDetails | null)?.username}
        </span>
        <button
          data-testid="deactivate-modal-close"
          onClick={() => (props.onClose as () => void)()}
        >
          Close
        </button>
        <button
          data-testid="deactivate-modal-success"
          onClick={() => (props.onSuccess as () => void)()}
        >
          Success
        </button>
      </div>
    ) : null;
  }),
}));

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset captured props
    userTableProps = {};
    editFormProps = {};
  });

  describe('rendering', () => {
    it('should render page header with title and description', () => {
      renderUserManagementPage();

      expect(screen.getByText('사용자 관리')).toBeInTheDocument();
      expect(screen.getByText('Manage system users and their roles')).toBeInTheDocument();
    });

    it('should render Add User button', () => {
      renderUserManagementPage();

      expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
    });

    it('should render search bar', () => {
      renderUserManagementPage();

      expect(
        screen.getByPlaceholderText(/search by username, email, or name/i)
      ).toBeInTheDocument();
    });

    it('should render Search button', () => {
      renderUserManagementPage();

      expect(screen.getByRole('button', { name: /^search$/i })).toBeInTheDocument();
    });

    it('should render UserManagementTable', () => {
      renderUserManagementPage();

      expect(screen.getByTestId('user-management-table')).toBeInTheDocument();
    });

    it('should not render any modals initially', () => {
      renderUserManagementPage();

      expect(screen.queryByTestId('create-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('roles-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('password-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('customers-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('deactivate-modal')).not.toBeInTheDocument();
    });
  });

  describe('props passed to UserManagementTable', () => {
    it('should pass page from usePaginatedSearch', () => {
      renderUserManagementPage();

      expect(userTableProps.page).toBe(0);
    });

    it('should pass search from usePaginatedSearch', () => {
      renderUserManagementPage();

      expect(userTableProps.search).toBe('');
    });

    it('should pass refreshTrigger', () => {
      renderUserManagementPage();

      expect(userTableProps.refreshTrigger).toBe(0);
    });

    it('should pass callback functions', () => {
      renderUserManagementPage();

      expect(typeof userTableProps.onPageChange).toBe('function');
      expect(typeof userTableProps.onEdit).toBe('function');
      expect(typeof userTableProps.onDelete).toBe('function');
      expect(typeof userTableProps.onRoles).toBe('function');
      expect(typeof userTableProps.onPassword).toBe('function');
      expect(typeof userTableProps.onCustomers).toBe('function');
      expect(typeof userTableProps.onError).toBe('function');
    });

    it('should pass custom page value when hook returns different page', () => {
      vi.mocked(usePaginatedSearch).mockReturnValue({
        page: 5,
        setPage: mockSetPage,
        search: 'admin',
        searchInput: 'admin',
        handleSearchChange: mockHandleSearchChange,
        handleSearchSubmit: mockHandleSearchSubmit,
        handleClearSearch: mockHandleClearSearch,
      });

      renderUserManagementPage();

      expect(userTableProps.page).toBe(5);
      expect(userTableProps.search).toBe('admin');
    });
  });

  describe('create modal', () => {
    it('should open create modal when Add User button is clicked', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByRole('button', { name: /add user/i }));

      expect(screen.getByTestId('create-form')).toBeInTheDocument();
    });

    it('should close create modal when onClose is called', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByRole('button', { name: /add user/i }));
      expect(screen.getByTestId('create-form')).toBeInTheDocument();

      await user.click(screen.getByTestId('create-form-close'));
      expect(screen.queryByTestId('create-form')).not.toBeInTheDocument();
    });

    it('should close create modal and increment refresh trigger on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      // Open create modal
      await user.click(screen.getByRole('button', { name: /add user/i }));

      // Verify initial refreshTrigger
      expect(userTableProps.refreshTrigger).toBe(0);

      // Trigger success
      await user.click(screen.getByTestId('create-form-success'));

      // Modal should close
      expect(screen.queryByTestId('create-form')).not.toBeInTheDocument();

      // refreshTrigger should increment
      expect(userTableProps.refreshTrigger).toBe(1);
    });
  });

  describe('edit modal', () => {
    it('should open edit modal with user when onEdit is triggered', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-edit'));

      expect(screen.getByTestId('edit-form')).toBeInTheDocument();
      expect(screen.getByTestId('edit-form-user')).toHaveTextContent(
        mockUserDetails.adminUser.username
      );
    });

    it('should close edit modal when onClose is called', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-edit'));
      await user.click(screen.getByTestId('edit-form-close'));

      expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
    });

    it('should close edit modal and increment refresh trigger on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-edit'));
      expect(userTableProps.refreshTrigger).toBe(0);

      await user.click(screen.getByTestId('edit-form-success'));

      expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
      expect(userTableProps.refreshTrigger).toBe(1);
    });
  });

  describe('roles modal', () => {
    it('should open roles modal with user when onRoles is triggered', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-roles'));

      expect(screen.getByTestId('roles-form')).toBeInTheDocument();
      expect(screen.getByTestId('roles-form-user')).toHaveTextContent(
        mockUserDetails.adminUser.username
      );
    });

    it('should close roles modal and increment refresh trigger on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-roles'));
      await user.click(screen.getByTestId('roles-form-success'));

      expect(screen.queryByTestId('roles-form')).not.toBeInTheDocument();
      expect(userTableProps.refreshTrigger).toBe(1);
    });
  });

  describe('password modal', () => {
    it('should open password modal with user when onPassword is triggered', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-password'));

      expect(screen.getByTestId('password-form')).toBeInTheDocument();
      expect(screen.getByTestId('password-form-user')).toHaveTextContent(
        mockUserDetails.adminUser.username
      );
    });

    it('should close password modal and increment refresh trigger on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-password'));
      await user.click(screen.getByTestId('password-form-success'));

      expect(screen.queryByTestId('password-form')).not.toBeInTheDocument();
      expect(userTableProps.refreshTrigger).toBe(1);
    });
  });

  describe('customers modal', () => {
    it('should open customers modal with user when onCustomers is triggered', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-customers'));

      expect(screen.getByTestId('customers-form')).toBeInTheDocument();
      expect(screen.getByTestId('customers-form-user')).toHaveTextContent(
        mockUserDetails.salesUser.username
      );
    });

    it('should close customers modal and increment refresh trigger on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-customers'));
      await user.click(screen.getByTestId('customers-form-success'));

      expect(screen.queryByTestId('customers-form')).not.toBeInTheDocument();
      expect(userTableProps.refreshTrigger).toBe(1);
    });
  });

  describe('deactivate modal', () => {
    it('should open deactivate modal with user when onDelete is triggered', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-delete'));

      expect(screen.getByTestId('deactivate-modal')).toBeInTheDocument();
      expect(screen.getByTestId('deactivate-modal-user')).toHaveTextContent(
        mockUserDetails.adminUser.username
      );
    });

    it('should close deactivate modal and increment refresh trigger on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-delete'));
      await user.click(screen.getByTestId('deactivate-modal-success'));

      expect(screen.queryByTestId('deactivate-modal')).not.toBeInTheDocument();
      expect(userTableProps.refreshTrigger).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should display error alert when onError is triggered', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-error'));

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should dismiss error alert when close button is clicked', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-error'));
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      // Alert component should have a close button
      const alert = screen.getByRole('alert');
      const closeButton = within(alert).getByRole('button');
      await user.click(closeButton);

      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });
  });

  describe('search interactions', () => {
    it('should call handleSearchSubmit when Search button is clicked', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByRole('button', { name: /^search$/i }));

      expect(mockHandleSearchSubmit).toHaveBeenCalledOnce();
    });

    it('should call handleSearchSubmit when Enter is pressed in search bar', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      const searchInput = screen.getByPlaceholderText(/search by username, email, or name/i);
      await user.type(searchInput, 'admin{Enter}');

      expect(mockHandleSearchSubmit).toHaveBeenCalled();
    });

    it('should pass setPage to onPageChange in UserManagementTable', () => {
      renderUserManagementPage();

      expect(userTableProps.onPageChange).toBe(mockSetPage);
    });
  });

  describe('modal state isolation', () => {
    it('should only show one modal at a time', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      // Open create modal
      await user.click(screen.getByRole('button', { name: /add user/i }));
      expect(screen.getByTestId('create-form')).toBeInTheDocument();

      // Close it
      await user.click(screen.getByTestId('create-form-close'));

      // Open edit modal
      await user.click(screen.getByTestId('trigger-edit'));
      expect(screen.getByTestId('edit-form')).toBeInTheDocument();
      expect(screen.queryByTestId('create-form')).not.toBeInTheDocument();
    });

    it('should clear selected user when modal is closed', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      // Open edit modal with user
      await user.click(screen.getByTestId('trigger-edit'));
      expect(editFormProps.user).toBe(mockUserDetails.adminUser);

      // Close modal
      await user.click(screen.getByTestId('edit-form-close'));

      // selectedUser should be null
      expect(editFormProps.user).toBeNull();
    });
  });

  describe('refresh trigger behavior', () => {
    it('should increment refresh trigger on each form success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      // Initial value
      expect(userTableProps.refreshTrigger).toBe(0);

      // First success
      await user.click(screen.getByRole('button', { name: /add user/i }));
      await user.click(screen.getByTestId('create-form-success'));
      expect(userTableProps.refreshTrigger).toBe(1);

      // Second success
      await user.click(screen.getByTestId('trigger-edit'));
      await user.click(screen.getByTestId('edit-form-success'));
      expect(userTableProps.refreshTrigger).toBe(2);

      // Third success
      await user.click(screen.getByTestId('trigger-roles'));
      await user.click(screen.getByTestId('roles-form-success'));
      expect(userTableProps.refreshTrigger).toBe(3);
    });
  });

  describe('accessibility', () => {
    it('should have accessible page heading', () => {
      renderUserManagementPage();

      expect(screen.getByRole('heading', { name: /사용자 관리/i })).toBeInTheDocument();
    });

    it('should have accessible Add User button', () => {
      renderUserManagementPage();

      const addButton = screen.getByRole('button', { name: /add user/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should have accessible Search button', () => {
      renderUserManagementPage();

      const searchButton = screen.getByRole('button', { name: /^search$/i });
      expect(searchButton).toBeInTheDocument();
    });

    it('should have accessible search input with placeholder', () => {
      renderUserManagementPage();

      const searchInput = screen.getByPlaceholderText(/search by username, email, or name/i);
      expect(searchInput).toBeInTheDocument();
    });
  });
});
