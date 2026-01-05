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
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { UserManagementPage } from './UserManagementPage';
import { mockUserDetails } from '@/test/fixtures';
import type { UserDetails } from '@/entities/user';

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

vi.mock('@/shared/lib/pagination', () => ({
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

// Mock entity components
vi.mock('@/entities/user', () => ({
  userQueries: {
    list: vi.fn(() => ({ queryKey: ['users', 'list'] })),
  },
  UserTable: vi.fn((props: Record<string, unknown>) => {
    userTableProps = props;
    return (
      <div data-testid="user-table">
        <button
          data-testid="trigger-edit"
          onClick={() => (props.onEdit as (user: UserDetails) => void)(mockUserDetails.adminUser)}
        >
          Trigger Edit
        </button>
        <button
          data-testid="trigger-deactivate"
          onClick={() =>
            (props.onDeactivate as (user: UserDetails) => void)(mockUserDetails.adminUser)
          }
        >
          Trigger Deactivate
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
      </div>
    );
  }),
  UserTableSkeleton: vi.fn(() => <div data-testid="user-table-skeleton">Loading...</div>),
}));

// Mock useQuery
const mockRefetch = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: {
      data: [mockUserDetails.adminUser, mockUserDetails.salesUser],
      pagination: {
        page: 0,
        size: 10,
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      },
    },
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  })),
}));

// Mock feature forms
vi.mock('@/features/user/create', () => ({
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
}));

vi.mock('@/features/user/update', () => ({
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
}));

vi.mock('@/features/user/deactivate', () => ({
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

vi.mock('@/features/user/change-password', () => ({
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
}));

vi.mock('@/features/user/assign-roles', () => ({
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
}));

vi.mock('@/features/user/assign-customers', () => ({
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
}));

// Mock useActivateUser hook
const mockActivateMutate = vi.fn();
vi.mock('@/features/user/activate', () => ({
  useActivateUser: vi.fn(() => ({
    mutate: mockActivateMutate,
    isPending: false,
  })),
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

    it('should render UserTable', () => {
      renderUserManagementPage();

      expect(screen.getByTestId('user-table')).toBeInTheDocument();
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

  describe('props passed to UserTable', () => {
    it('should pass users array', () => {
      renderUserManagementPage();

      expect(Array.isArray(userTableProps.users)).toBe(true);
    });

    it('should pass callback functions', () => {
      renderUserManagementPage();

      expect(typeof userTableProps.onEdit).toBe('function');
      expect(typeof userTableProps.onDeactivate).toBe('function');
      expect(typeof userTableProps.onActivate).toBe('function');
      expect(typeof userTableProps.onRoles).toBe('function');
      expect(typeof userTableProps.onPassword).toBe('function');
      expect(typeof userTableProps.onCustomers).toBe('function');
    });

    it('should pass emptyMessage', () => {
      renderUserManagementPage();

      expect(typeof userTableProps.emptyMessage).toBe('string');
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

    it('should close create modal on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      // Open create modal
      await user.click(screen.getByRole('button', { name: /add user/i }));

      // Trigger success
      await user.click(screen.getByTestId('create-form-success'));

      // Modal should close
      expect(screen.queryByTestId('create-form')).not.toBeInTheDocument();
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

    it('should close edit modal on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-edit'));
      await user.click(screen.getByTestId('edit-form-success'));

      expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
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

    it('should close roles modal on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-roles'));
      await user.click(screen.getByTestId('roles-form-success'));

      expect(screen.queryByTestId('roles-form')).not.toBeInTheDocument();
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

    it('should close password modal on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-password'));
      await user.click(screen.getByTestId('password-form-success'));

      expect(screen.queryByTestId('password-form')).not.toBeInTheDocument();
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

    it('should close customers modal on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-customers'));
      await user.click(screen.getByTestId('customers-form-success'));

      expect(screen.queryByTestId('customers-form')).not.toBeInTheDocument();
    });
  });

  describe('deactivate modal', () => {
    it('should open deactivate modal with user when onDelete is triggered', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-deactivate'));

      expect(screen.getByTestId('deactivate-modal')).toBeInTheDocument();
      expect(screen.getByTestId('deactivate-modal-user')).toHaveTextContent(
        mockUserDetails.adminUser.username
      );
    });

    it('should close deactivate modal on success', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await user.click(screen.getByTestId('trigger-deactivate'));
      await user.click(screen.getByTestId('deactivate-modal-success'));

      expect(screen.queryByTestId('deactivate-modal')).not.toBeInTheDocument();
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
