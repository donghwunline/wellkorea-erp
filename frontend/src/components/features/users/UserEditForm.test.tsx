/**
 * Unit tests for UserEditForm component.
 * Tests form rendering, pre-population, submission, error handling, and accessibility.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { UserEditForm } from './UserEditForm';
import { createMockUserDetails, mockUserDetails, type UserDetails } from '@/test/fixtures';
import { getInputByLabel } from '@/test/helpers';
import { userService } from '@/services';

// Mock userService
vi.mock('@/services', () => ({
  userService: {
    updateUser: vi.fn(),
  },
}));

describe('UserEditForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const testUser = mockUserDetails.adminUser;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderForm(isOpen = true, user: UserDetails | null = testUser) {
    return render(
      <UserEditForm isOpen={isOpen} user={user} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
  }

  describe('rendering', () => {
    it('should render modal when open with user', () => {
      renderForm(true, testUser);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderForm(false, testUser);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should not render when user is null', () => {
      renderForm(true, null);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render form fields', () => {
      renderForm();

      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Full Name')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderForm();

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('form pre-population', () => {
    it('should pre-populate username field (disabled)', () => {
      renderForm(true, testUser);

      const usernameInput = getInputByLabel('Username');
      expect(usernameInput).toHaveValue(testUser.username);
      expect(usernameInput).toBeDisabled();
    });

    it('should pre-populate email field', () => {
      renderForm(true, testUser);

      const emailInput = getInputByLabel('Email');
      expect(emailInput).toHaveValue(testUser.email);
    });

    it('should pre-populate full name field', () => {
      renderForm(true, testUser);

      const fullNameInput = getInputByLabel('Full Name');
      expect(fullNameInput).toHaveValue(testUser.fullName);
    });
  });

  describe('form interaction', () => {
    it('should allow editing email', async () => {
      const user = userEvent.setup();
      renderForm();

      const emailInput = getInputByLabel('Email');
      await user.clear(emailInput);
      await user.type(emailInput, 'newemail@example.com');

      expect(emailInput).toHaveValue('newemail@example.com');
    });

    it('should allow editing full name', async () => {
      const user = userEvent.setup();
      renderForm();

      const fullNameInput = getInputByLabel('Full Name');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'New Name');

      expect(fullNameInput).toHaveValue('New Name');
    });

    it('should not allow editing username', async () => {
      const user = userEvent.setup();
      renderForm();

      const usernameInput = getInputByLabel('Username');
      expect(usernameInput).toBeDisabled();

      // Attempting to type should not change the value
      await user.type(usernameInput, 'newusername');
      expect(usernameInput).toHaveValue(testUser.username);
    });
  });

  describe('successful submission', () => {
    it('should call userService.updateUser with form data', async () => {
      const user = userEvent.setup();
      const updatedUser = createMockUserDetails({
        ...testUser,
        email: 'updated@example.com',
        fullName: 'Updated Name',
      });
      vi.mocked(userService.updateUser).mockResolvedValue(updatedUser);

      renderForm();

      const emailInput = getInputByLabel('Email');
      const fullNameInput = getInputByLabel('Full Name');

      await user.clear(emailInput);
      await user.type(emailInput, 'updated@example.com');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Updated Name');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(userService.updateUser).toHaveBeenCalledOnce();
        expect(userService.updateUser).toHaveBeenCalledWith(testUser.id, {
          email: 'updated@example.com',
          fullName: 'Updated Name',
        });
      });
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.updateUser).mockResolvedValue(createMockUserDetails());

      renderForm();

      const emailInput = getInputByLabel('Email');
      const fullNameInput = getInputByLabel('Full Name');

      await user.clear(emailInput);
      await user.type(emailInput, '  updated@example.com  ');
      await user.clear(fullNameInput);
      await user.type(fullNameInput, '  Updated Name  ');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(userService.updateUser).toHaveBeenCalledWith(testUser.id, {
          email: 'updated@example.com',
          fullName: 'Updated Name',
        });
      });
    });

    it('should call onSuccess and onClose after successful update', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.updateUser).mockResolvedValue(createMockUserDetails());

      renderForm();

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledOnce();
        expect(mockOnClose).toHaveBeenCalledOnce();
      });
    });
  });

  describe('loading state', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveUpdate: () => void;
      vi.mocked(userService.updateUser).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveUpdate = () => resolve(createMockUserDetails());
          })
      );

      renderForm();

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const emailInput = getInputByLabel('Email');
        const fullNameInput = getInputByLabel('Full Name');
        expect(emailInput).toBeDisabled();
        expect(fullNameInput).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      });

      resolveUpdate!();
    });
  });

  describe('error handling', () => {
    it('should display error message on API failure', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.updateUser).mockRejectedValue(new Error('Email already exists'));

      renderForm();

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should display generic error message for non-Error objects', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.updateUser).mockRejectedValue('Unknown error');

      renderForm();

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to update user')).toBeInTheDocument();
      });
    });

    it('should show dismiss button for error message', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.updateUser).mockRejectedValue(new Error('Test error'));

      renderForm();

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Verify dismiss button is present
      expect(screen.getByRole('button', { name: /dismiss error/i })).toBeInTheDocument();
    });

    it('should re-enable form after error', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.updateUser).mockRejectedValue(new Error('Test error'));

      renderForm();

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      const emailInput = getInputByLabel('Email');
      const fullNameInput = getInputByLabel('Full Name');
      expect(emailInput).not.toBeDisabled();
      expect(fullNameInput).not.toBeDisabled();
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

  describe('different user types', () => {
    it('should handle user with sales role', () => {
      renderForm(true, mockUserDetails.salesUser);

      const usernameInput = getInputByLabel('Username');
      const emailInput = getInputByLabel('Email');
      expect(usernameInput).toHaveValue(mockUserDetails.salesUser.username);
      expect(emailInput).toHaveValue(mockUserDetails.salesUser.email);
    });

    it('should handle inactive user', () => {
      renderForm(true, mockUserDetails.inactiveUser);

      const usernameInput = getInputByLabel('Username');
      expect(usernameInput).toHaveValue(mockUserDetails.inactiveUser.username);
    });
  });

  describe('accessibility', () => {
    it('should have proper form structure', () => {
      renderForm();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should have labels for all input fields', () => {
      renderForm();

      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Full Name')).toBeInTheDocument();
    });

    it('should have correct input types', () => {
      renderForm();

      const emailInput = getInputByLabel('Email');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should indicate disabled username field', () => {
      renderForm();

      const usernameInput = getInputByLabel('Username');
      expect(usernameInput).toBeDisabled();
    });
  });
});
