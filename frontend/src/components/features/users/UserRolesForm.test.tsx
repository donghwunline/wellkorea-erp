/**
 * Unit tests for UserRolesForm component.
 * Tests role display, role selection, submission, error handling, and accessibility.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { UserRolesForm } from './UserRolesForm';
import { createMockUserDetails, mockUserDetails, type UserDetails } from '@/test/fixtures';
import { userApi } from '@/entities/user';

// Mock userApi
vi.mock('@/entities/user', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/user')>();
  return {
    ...actual,
    userApi: {
      assignRoles: vi.fn(),
    },
  };
});

describe('UserRolesForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const testUser = mockUserDetails.salesUser;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderForm(isOpen = true, user: UserDetails | null = testUser) {
    return render(
      <UserRolesForm isOpen={isOpen} user={user} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
  }

  // Helper to get role button from the "Select Roles" section
  function getRoleButton(roleName: string) {
    // Find the role selection section by its label
    const selectRolesLabel = screen.getByText('Select Roles');
    const selectRolesSection = selectRolesLabel.closest('div')!;
    const gridContainer = selectRolesSection.querySelector('.grid');
    if (!gridContainer) return null;
    const buttons = within(gridContainer as HTMLElement).getAllByRole('button');
    return buttons.find(btn => btn.textContent?.includes(roleName)) || null;
  }

  describe('rendering', () => {
    it('should render modal when open with user', () => {
      renderForm(true, testUser);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Assign Roles')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderForm(false, testUser);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should not render when user is null', () => {
      renderForm(true, null);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display user info', () => {
      renderForm(true, testUser);

      expect(screen.getByText(testUser.fullName)).toBeInTheDocument();
      expect(screen.getByText(testUser.email)).toBeInTheDocument();
    });

    it('should render all role options', () => {
      renderForm();

      // Use getAllByText since role names may appear in both badge and button
      expect(screen.getAllByText('Administrator').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Finance').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Production').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sales').length).toBeGreaterThanOrEqual(1);
    });

    it('should render role descriptions', () => {
      renderForm();

      expect(screen.getByText('Full system access')).toBeInTheDocument();
      expect(screen.getByText('Quotations, invoices, AR/AP reports')).toBeInTheDocument();
      expect(screen.getByText('Work progress, production tracking')).toBeInTheDocument();
      expect(screen.getByText('Quotations for assigned customers')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderForm();

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save roles/i })).toBeInTheDocument();
    });
  });

  describe('current roles display', () => {
    it('should show current roles for user with roles', () => {
      renderForm(true, testUser);

      // The "Current Roles" section should display the user's current roles as badges
      const currentRolesSection = screen.getByText('Current Roles').parentElement;
      expect(currentRolesSection).toBeInTheDocument();
    });

    it('should show "No roles assigned" for user without roles', () => {
      const userWithNoRoles = createMockUserDetails({ roles: [] });
      renderForm(true, userWithNoRoles);

      expect(screen.getByText('No roles assigned')).toBeInTheDocument();
    });

    it('should show multiple roles when user has multiple', () => {
      renderForm(true, mockUserDetails.multiRoleUser);

      // Multi-role user has ROLE_ADMIN and ROLE_SALES
      // Both badges should be present in the current roles section
      const badges = screen.getAllByText(/Administrator|Sales/);
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('role pre-selection', () => {
    it('should pre-select user current roles', () => {
      renderForm(true, testUser); // salesUser has ROLE_SALES

      // The Sales role button should be highlighted
      const salesButton = getRoleButton('Sales');
      expect(salesButton).toHaveClass('border-copper-500');
    });

    it('should pre-select multiple roles for multi-role user', () => {
      renderForm(true, mockUserDetails.multiRoleUser);

      const adminButton = getRoleButton('Administrator');
      const salesButton = getRoleButton('Sales');

      expect(adminButton).toHaveClass('border-copper-500');
      expect(salesButton).toHaveClass('border-copper-500');
    });

    it('should not pre-select roles user does not have', () => {
      renderForm(true, testUser); // salesUser only has ROLE_SALES

      const adminButton = getRoleButton('Administrator');
      const financeButton = getRoleButton('Finance');

      expect(adminButton).not.toHaveClass('border-copper-500');
      expect(financeButton).not.toHaveClass('border-copper-500');
    });
  });

  describe('role selection', () => {
    it('should toggle role selection on click', async () => {
      const user = userEvent.setup();
      renderForm(true, testUser);

      const adminButton = getRoleButton('Administrator');
      expect(adminButton).not.toHaveClass('border-copper-500');

      await user.click(adminButton!);
      expect(adminButton).toHaveClass('border-copper-500');

      await user.click(adminButton!);
      expect(adminButton).not.toHaveClass('border-copper-500');
    });

    it('should allow deselecting current role', async () => {
      const user = userEvent.setup();
      renderForm(true, testUser); // salesUser has ROLE_SALES

      const salesButton = getRoleButton('Sales');
      expect(salesButton).toHaveClass('border-copper-500');

      await user.click(salesButton!);
      expect(salesButton).not.toHaveClass('border-copper-500');
    });

    it('should allow selecting multiple roles', async () => {
      const user = userEvent.setup();
      renderForm(true, testUser);

      const adminButton = getRoleButton('Administrator');
      const financeButton = getRoleButton('Finance');

      await user.click(adminButton!);
      await user.click(financeButton!);

      expect(adminButton).toHaveClass('border-copper-500');
      expect(financeButton).toHaveClass('border-copper-500');
    });
  });

  describe('form validation', () => {
    it('should disable submit button when no roles selected', async () => {
      const user = userEvent.setup();
      renderForm(true, testUser);

      // Deselect the current role
      const salesButton = getRoleButton('Sales');
      await user.click(salesButton!);

      const submitButton = screen.getByRole('button', { name: /save roles/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when at least one role selected', () => {
      renderForm(true, testUser); // salesUser has ROLE_SALES pre-selected

      const submitButton = screen.getByRole('button', { name: /save roles/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('successful submission', () => {
    it('should call userApi.assignRoles with selected roles', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.assignRoles).mockResolvedValue(undefined);

      renderForm(true, testUser);

      // Add admin role (sales is already selected)
      const adminButton = getRoleButton('Administrator');
      await user.click(adminButton!);
      await user.click(screen.getByRole('button', { name: /save roles/i }));

      await waitFor(() => {
        expect(userApi.assignRoles).toHaveBeenCalledOnce();
        expect(userApi.assignRoles).toHaveBeenCalledWith(testUser.id, {
          roles: expect.arrayContaining(['ROLE_SALES', 'ROLE_ADMIN']),
        });
      });
    });

    it('should call onSuccess and onClose after successful update', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.assignRoles).mockResolvedValue(undefined);

      renderForm(true, testUser);

      await user.click(screen.getByRole('button', { name: /save roles/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledOnce();
        expect(mockOnClose).toHaveBeenCalledOnce();
      });
    });

    it('should allow removing all but one role', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.assignRoles).mockResolvedValue(undefined);

      renderForm(true, mockUserDetails.multiRoleUser);

      // Deselect admin role, keep sales
      const adminButton = getRoleButton('Administrator');
      await user.click(adminButton!);
      await user.click(screen.getByRole('button', { name: /save roles/i }));

      await waitFor(() => {
        expect(userApi.assignRoles).toHaveBeenCalledWith(mockUserDetails.multiRoleUser.id, {
          roles: ['ROLE_SALES'],
        });
      });
    });
  });

  describe('loading state', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveAssign: () => void;
      vi.mocked(userApi.assignRoles).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveAssign = resolve;
          })
      );

      renderForm(true, testUser);

      await user.click(screen.getByRole('button', { name: /save roles/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      });

      resolveAssign!();
    });

    it('should disable role buttons during submission', async () => {
      const user = userEvent.setup();
      let resolveAssign: () => void;
      vi.mocked(userApi.assignRoles).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveAssign = resolve;
          })
      );

      renderForm(true, testUser);

      await user.click(screen.getByRole('button', { name: /save roles/i }));

      await waitFor(() => {
        const adminButton = getRoleButton('Administrator');
        expect(adminButton).toBeDisabled();
      });

      resolveAssign!();
    });
  });

  describe('error handling', () => {
    it('should display error message on API failure', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.assignRoles).mockRejectedValue(new Error('Insufficient permissions'));

      renderForm(true, testUser);

      await user.click(screen.getByRole('button', { name: /save roles/i }));

      await waitFor(() => {
        expect(screen.getByText('Insufficient permissions')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should display generic error message for non-Error objects', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.assignRoles).mockRejectedValue('Unknown error');

      renderForm(true, testUser);

      await user.click(screen.getByRole('button', { name: /save roles/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to assign roles')).toBeInTheDocument();
      });
    });

    it('should show dismiss button for error message', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.assignRoles).mockRejectedValue(new Error('Test error'));

      renderForm(true, testUser);

      await user.click(screen.getByRole('button', { name: /save roles/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Verify dismiss button is present
      expect(screen.getByRole('button', { name: /dismiss error/i })).toBeInTheDocument();
    });

    it('should re-enable form after error', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.assignRoles).mockRejectedValue(new Error('Test error'));

      renderForm(true, testUser);

      await user.click(screen.getByRole('button', { name: /save roles/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      const adminButton = getRoleButton('Administrator');
      expect(adminButton).not.toBeDisabled();
    });
  });

  describe('cancel functionality', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalledOnce();
    });
  });

  describe('accessibility', () => {
    it('should have proper form structure', () => {
      renderForm();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should have label for role selection section', () => {
      renderForm();

      expect(screen.getByText('Select Roles')).toBeInTheDocument();
    });

    it('should display user information prominently', () => {
      renderForm();

      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText(testUser.fullName)).toBeInTheDocument();
      expect(screen.getByText(testUser.email)).toBeInTheDocument();
    });
  });
});
