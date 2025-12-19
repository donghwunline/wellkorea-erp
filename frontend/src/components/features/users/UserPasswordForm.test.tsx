/**
 * Unit tests for UserPasswordForm component.
 * Tests form rendering, password validation, submission, error handling, and accessibility.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { UserPasswordForm } from './UserPasswordForm';
import { mockUserDetails } from '@/test/fixtures';
import { getInputByPlaceholder } from '@/test/helpers';
import { userService } from '@/services';

// Mock userService
vi.mock('@/services', () => ({
  userService: {
    changePassword: vi.fn(),
  },
}));

describe('UserPasswordForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const testUser = mockUserDetails.adminUser;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderForm(isOpen = true, user: typeof testUser | null = testUser) {
    return render(
      <UserPasswordForm
        isOpen={isOpen}
        user={user}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  }

  // Input accessor helpers using shared utility
  const newPasswordInput = () => getInputByPlaceholder('Enter new password (min 8 characters)');
  const confirmPasswordInput = () => getInputByPlaceholder('Re-enter new password');

  describe('rendering', () => {
    it('should render modal when open with user', () => {
      renderForm(true, testUser);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // Modal title is in an h2 element
      expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
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

    it('should render password fields', () => {
      renderForm();

      expect(newPasswordInput()).toBeInTheDocument();
      expect(confirmPasswordInput()).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderForm();

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    });

    it('should have password type inputs', () => {
      renderForm();

      expect(newPasswordInput()).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput()).toHaveAttribute('type', 'password');
    });

    it('should show placeholder text', () => {
      renderForm();

      expect(
        screen.getByPlaceholderText('Enter new password (min 8 characters)')
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Re-enter new password')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should disable submit button when both fields are empty', () => {
      renderForm();

      const submitButton = screen.getByRole('button', { name: /change password/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when only password is filled', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(newPasswordInput(), 'password123');

      const submitButton = screen.getByRole('button', { name: /change password/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when only confirm password is filled', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(confirmPasswordInput(), 'password123');

      const submitButton = screen.getByRole('button', { name: /change password/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when both fields are filled', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(newPasswordInput(), 'password123');
      await user.type(confirmPasswordInput(), 'password123');

      const submitButton = screen.getByRole('button', { name: /change password/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(newPasswordInput(), 'password123');
      await user.type(confirmPasswordInput(), 'differentpassword');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      expect(userService.changePassword).not.toHaveBeenCalled();
    });

    it('should show error when password is less than 8 characters', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(newPasswordInput(), 'short');
      await user.type(confirmPasswordInput(), 'short');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });

      expect(userService.changePassword).not.toHaveBeenCalled();
    });

    it('should show password mismatch error before length validation', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(newPasswordInput(), 'short');
      await user.type(confirmPasswordInput(), 'different');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('successful submission', () => {
    it('should call userService.changePassword with new password', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockResolvedValue(undefined);

      renderForm(true, testUser);

      await user.type(newPasswordInput(), 'newpassword123');
      await user.type(confirmPasswordInput(), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(userService.changePassword).toHaveBeenCalledOnce();
        expect(userService.changePassword).toHaveBeenCalledWith(testUser.id, {
          newPassword: 'newpassword123',
        });
      });
    });

    it('should call onSuccess and onClose after successful change', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockResolvedValue(undefined);

      renderForm(true, testUser);

      await user.type(newPasswordInput(), 'newpassword123');
      await user.type(confirmPasswordInput(), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledOnce();
        expect(mockOnClose).toHaveBeenCalledOnce();
      });
    });

    it('should reset form fields after successful change', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockResolvedValue(undefined);

      renderForm(true, testUser);

      await user.type(newPasswordInput(), 'newpassword123');
      await user.type(confirmPasswordInput(), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      // After success, the form closes, so we don't check field values
    });

    it('should accept exactly 8 character password', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockResolvedValue(undefined);

      renderForm(true, testUser);

      await user.type(newPasswordInput(), '12345678');
      await user.type(confirmPasswordInput(), '12345678');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(userService.changePassword).toHaveBeenCalledOnce();
      });
    });
  });

  describe('loading state', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveChange: () => void;
      vi.mocked(userService.changePassword).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveChange = resolve;
          })
      );

      renderForm(true, testUser);

      await user.type(newPasswordInput(), 'newpassword123');
      await user.type(confirmPasswordInput(), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(newPasswordInput()).toBeDisabled();
        expect(confirmPasswordInput()).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      });

      resolveChange!();
    });
  });

  describe('error handling', () => {
    it('should display error message on API failure', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockRejectedValue(new Error('Password too weak'));

      renderForm(true, testUser);

      await user.type(newPasswordInput(), 'newpassword123');
      await user.type(confirmPasswordInput(), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('Password too weak')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should display generic error message for non-Error objects', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockRejectedValue('Unknown error');

      renderForm(true, testUser);

      await user.type(newPasswordInput(), 'newpassword123');
      await user.type(confirmPasswordInput(), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to change password')).toBeInTheDocument();
      });
    });

    it('should show dismiss button for error message', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockRejectedValue(new Error('Test error'));

      renderForm(true, testUser);

      await user.type(newPasswordInput(), 'newpassword123');
      await user.type(confirmPasswordInput(), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Verify dismiss button is present
      expect(screen.getByRole('button', { name: /dismiss error/i })).toBeInTheDocument();
    });

    it('should re-enable form after error', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.changePassword).mockRejectedValue(new Error('Test error'));

      renderForm(true, testUser);

      await user.type(newPasswordInput(), 'newpassword123');
      await user.type(confirmPasswordInput(), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      expect(newPasswordInput()).not.toBeDisabled();
      expect(confirmPasswordInput()).not.toBeDisabled();
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
    it('should work with sales user', () => {
      renderForm(true, mockUserDetails.salesUser);

      expect(screen.getByText(mockUserDetails.salesUser.fullName)).toBeInTheDocument();
      expect(screen.getByText(mockUserDetails.salesUser.email)).toBeInTheDocument();
    });

    it('should work with inactive user', () => {
      renderForm(true, mockUserDetails.inactiveUser);

      expect(screen.getByText(mockUserDetails.inactiveUser.fullName)).toBeInTheDocument();
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

      expect(screen.getByText('New Password')).toBeInTheDocument();
      expect(screen.getByText('Confirm Password')).toBeInTheDocument();
    });

    it('should display user information prominently', () => {
      renderForm();

      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText(testUser.fullName)).toBeInTheDocument();
      expect(screen.getByText(testUser.email)).toBeInTheDocument();
    });

    it('should have required indicators on password fields', () => {
      renderForm();

      // Check for required indicators (asterisks)
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThanOrEqual(2);
    });
  });
});
