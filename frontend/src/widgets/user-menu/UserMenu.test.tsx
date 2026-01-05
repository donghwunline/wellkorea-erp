import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { UserMenu, type UserMenuItem } from './UserMenu';

// Mock useAuth hook
const mockLogout = vi.fn();
vi.mock('@/entities/auth', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Helper to wrap component with MemoryRouter for testing
 */
function renderWithRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Basic Rendering
  // ============================================================================

  describe('Basic Rendering', () => {
    it('renders user avatar with initial', () => {
      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders user name when not collapsed', () => {
      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders user role when not collapsed', () => {
      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin, Manager"
          collapsed={false}
        />
      );

      expect(screen.getByText('Admin, Manager')).toBeInTheDocument();
    });

    it('hides user name and role when collapsed', () => {
      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={true}
        />
      );

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      // Avatar initial should still be visible
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  // ============================================================================
  // Dropdown Behavior
  // ============================================================================

  describe('Dropdown Behavior', () => {
    it('opens dropdown menu on click', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
    });

    it('closes dropdown on second click (toggle)', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.click(trigger);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('sets aria-expanded correctly', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('has aria-haspopup attribute', () => {
      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    });
  });

  // ============================================================================
  // Click Outside Handling
  // ============================================================================

  describe('Click Outside Handling', () => {
    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <div>
          <div data-testid="outside">Outside</div>
          <UserMenu
            userName="John Doe"
            userInitial="J"
            userRole="Admin"
            collapsed={false}
          />
        </div>
      );

      // Open menu
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Click outside (using mousedown event)
      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ESC Key Handling
  // ============================================================================

  describe('ESC Key Handling', () => {
    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      // Open menu
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Press Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('returns focus to trigger button on Escape', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);
      await user.keyboard('{Escape}');

      expect(trigger).toHaveFocus();
    });
  });

  // ============================================================================
  // Menu Items
  // ============================================================================

  describe('Menu Items', () => {
    it('renders custom menu items', async () => {
      const user = userEvent.setup();
      const menuItems: UserMenuItem[] = [
        {
          id: 'profile',
          label: 'Profile',
          icon: 'user',
          onClick: vi.fn(),
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: 'cog',
          onClick: vi.fn(),
        },
      ];

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
          menuItems={menuItems}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
    });

    it('calls onClick handler when menu item clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const menuItems: UserMenuItem[] = [
        {
          id: 'profile',
          label: 'Profile',
          icon: 'user',
          onClick: handleClick,
        },
      ];

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
          menuItems={menuItems}
        />
      );

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('menuitem', { name: /profile/i }));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('closes menu after clicking an item', async () => {
      const user = userEvent.setup();
      const menuItems: UserMenuItem[] = [
        {
          id: 'profile',
          label: 'Profile',
          icon: 'user',
          onClick: vi.fn(),
        },
      ];

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
          menuItems={menuItems}
        />
      );

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('menuitem', { name: /profile/i }));

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('applies danger variant styling', async () => {
      const user = userEvent.setup();
      const menuItems: UserMenuItem[] = [
        {
          id: 'delete',
          label: 'Delete Account',
          icon: 'trash',
          onClick: vi.fn(),
          variant: 'danger',
        },
      ];

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
          menuItems={menuItems}
        />
      );

      await user.click(screen.getByRole('button'));
      const dangerItem = screen.getByRole('menuitem', { name: /delete account/i });

      expect(dangerItem).toHaveClass('text-red-400');
    });

    it('renders separator when menu items exist', async () => {
      const user = userEvent.setup();
      const menuItems: UserMenuItem[] = [
        {
          id: 'profile',
          label: 'Profile',
          icon: 'user',
          onClick: vi.fn(),
        },
      ];

      const { container } = renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
          menuItems={menuItems}
        />
      );

      await user.click(screen.getByRole('button'));

      // Check for separator div
      const separator = container.querySelector('.border-t.border-steel-700\\/50.my-1');
      expect(separator).toBeInTheDocument();
    });

    it('does not render separator when no menu items', async () => {
      const user = userEvent.setup();

      const { container } = renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
          menuItems={[]}
        />
      );

      await user.click(screen.getByRole('button'));

      // Separator should NOT exist
      const separator = container.querySelector('.border-t.border-steel-700\\/50.my-1');
      expect(separator).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Logout
  // ============================================================================

  describe('Logout', () => {
    it('always renders sign out button', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
    });

    it('calls logout and navigates to login on sign out', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('menuitem', { name: /sign out/i }));

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('closes menu after signing out', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('menuitem', { name: /sign out/i }));

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Backdrop
  // ============================================================================

  describe('Backdrop', () => {
    it('renders backdrop when menu is open', async () => {
      const user = userEvent.setup();

      const { container } = renderWithRouter(
        <UserMenu
          userName="John Doe"
          userInitial="J"
          userRole="Admin"
          collapsed={false}
        />
      );

      await user.click(screen.getByRole('button'));

      // Backdrop should have fixed inset-0 and be hidden from accessibility
      const backdrop = container.querySelector('.fixed.inset-0.z-40');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
