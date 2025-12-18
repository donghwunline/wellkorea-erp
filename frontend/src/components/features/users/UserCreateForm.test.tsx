/**
 * Unit tests for UserCreateForm component.
 * Tests form rendering, validation, submission, error handling, and accessibility.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { UserCreateForm } from './UserCreateForm';
import { createMockUserDetails, type UserDetails } from '@/test/fixtures';
import { userService } from '@/services';

// Mock userService
vi.mock('@/services', () => ({
  userService: {
    createUser: vi.fn(),
  },
}));

describe('UserCreateForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderForm(isOpen = true) {
    return render(
      <UserCreateForm isOpen={isOpen} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
  }

  // Helper to get input by placeholder
  function getInput(placeholder: string) {
    return screen.getByPlaceholderText(placeholder);
  }

  const usernameInput = () => getInput('Enter username');
  const emailInput = () => getInput('user@example.com');
  const fullNameInput = () => getInput('Enter full name');
  const passwordInput = () => getInput('Enter password');

  describe('rendering', () => {
    it('should render modal when open', () => {
      renderForm(true);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New User')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderForm(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderForm();

      expect(usernameInput()).toBeInTheDocument();
      expect(emailInput()).toBeInTheDocument();
      expect(fullNameInput()).toBeInTheDocument();
      expect(passwordInput()).toBeInTheDocument();
    });

    it('should render all role options', () => {
      renderForm();

      expect(screen.getByText('Administrator')).toBeInTheDocument();
      expect(screen.getByText('Finance')).toBeInTheDocument();
      expect(screen.getByText('Production')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    it('should render role descriptions', () => {
      renderForm();

      expect(screen.getByText('Full system access')).toBeInTheDocument();
      expect(screen.getByText('Quotations, invoices, AR/AP reports')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderForm();

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
    });

    it('should have required indicators on fields', () => {
      renderForm();

      // Username, Email, Full Name, Password are required
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('form validation', () => {
    it('should disable submit button when form is empty', () => {
      renderForm();

      const submitButton = screen.getByRole('button', { name: /create user/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when no roles selected', async () => {
      const user = userEvent.setup();
      renderForm();

      // Fill all fields except roles
      await user.type(usernameInput(), 'testuser');
      await user.type(emailInput(), 'test@example.com');
      await user.type(fullNameInput(), 'Test User');
      await user.type(passwordInput(), 'password123');

      const submitButton = screen.getByRole('button', { name: /create user/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when all fields are filled', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(usernameInput(), 'testuser');
      await user.type(emailInput(), 'test@example.com');
      await user.type(fullNameInput(), 'Test User');
      await user.type(passwordInput(), 'password123');
      await user.click(screen.getByText('Administrator'));

      const submitButton = screen.getByRole('button', { name: /create user/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('role selection', () => {
    it('should toggle role selection on click', async () => {
      const user = userEvent.setup();
      renderForm();

      const adminButton = screen.getByText('Administrator').closest('button');
      expect(adminButton).not.toHaveClass('border-copper-500');

      await user.click(adminButton!);
      expect(adminButton).toHaveClass('border-copper-500');

      await user.click(adminButton!);
      expect(adminButton).not.toHaveClass('border-copper-500');
    });

    it('should allow multiple role selection', async () => {
      const user = userEvent.setup();
      renderForm();

      const adminButton = screen.getByText('Administrator').closest('button');
      const financeButton = screen.getByText('Finance').closest('button');

      await user.click(adminButton!);
      await user.click(financeButton!);

      expect(adminButton).toHaveClass('border-copper-500');
      expect(financeButton).toHaveClass('border-copper-500');
    });
  });

  describe('successful submission', () => {
    it('should call userService.createUser with form data', async () => {
      const user = userEvent.setup();
      const mockCreatedUser = createMockUserDetails({ username: 'newuser' });
      vi.mocked(userService.createUser).mockResolvedValue(mockCreatedUser);

      renderForm();

      await user.type(usernameInput(), 'newuser');
      await user.type(emailInput(), 'new@example.com');
      await user.type(fullNameInput(), 'New User');
      await user.type(passwordInput(), 'password123');
      await user.click(screen.getByText('Sales'));
      await user.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(userService.createUser).toHaveBeenCalledOnce();
        expect(userService.createUser).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'new@example.com',
          fullName: 'New User',
          password: 'password123',
          roles: ['ROLE_SALES'],
        });
      });
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.createUser).mockResolvedValue(createMockUserDetails());

      renderForm();

      await user.type(usernameInput(), '  newuser  ');
      await user.type(emailInput(), '  new@example.com  ');
      await user.type(fullNameInput(), '  New User  ');
      await user.type(passwordInput(), 'password123');
      await user.click(screen.getByText('Sales'));
      await user.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(userService.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'newuser',
            email: 'new@example.com',
            fullName: 'New User',
          })
        );
      });
    });

    it('should call onSuccess and onClose after successful creation', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.createUser).mockResolvedValue(createMockUserDetails());

      renderForm();

      await user.type(usernameInput(), 'newuser');
      await user.type(emailInput(), 'new@example.com');
      await user.type(fullNameInput(), 'New User');
      await user.type(passwordInput(), 'password123');
      await user.click(screen.getByText('Sales'));
      await user.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledOnce();
        expect(mockOnClose).toHaveBeenCalledOnce();
      });
    });

    it('should reset form after successful creation', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.createUser).mockResolvedValue(createMockUserDetails());

      const { rerender } = renderForm();

      await user.type(usernameInput(), 'newuser');
      await user.type(emailInput(), 'new@example.com');
      await user.type(fullNameInput(), 'New User');
      await user.type(passwordInput(), 'password123');
      await user.click(screen.getByText('Sales'));
      await user.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      // Rerender to simulate reopening the modal
      rerender(<UserCreateForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Form should be reset (check submit button is disabled since form is empty)
      expect(screen.getByRole('button', { name: /create user/i })).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: UserDetails) => void;
      vi.mocked(userService.createUser).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveCreate = resolve;
          })
      );

      renderForm();

      await user.type(usernameInput(), 'newuser');
      await user.type(emailInput(), 'new@example.com');
      await user.type(fullNameInput(), 'New User');
      await user.type(passwordInput(), 'password123');
      await user.click(screen.getByText('Sales'));
      await user.click(screen.getByRole('button', { name: /create user/i }));

      // Form fields should be disabled during submission
      await waitFor(() => {
        expect(usernameInput()).toBeDisabled();
        expect(emailInput()).toBeDisabled();
        expect(fullNameInput()).toBeDisabled();
        expect(passwordInput()).toBeDisabled();
      });

      // Cancel button should be disabled
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

      // Resolve the promise
      resolveCreate!(createMockUserDetails());
    });

    it('should disable role buttons during submission', async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: UserDetails) => void;
      vi.mocked(userService.createUser).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveCreate = resolve;
          })
      );

      renderForm();

      await user.type(usernameInput(), 'newuser');
      await user.type(emailInput(), 'new@example.com');
      await user.type(fullNameInput(), 'New User');
      await user.type(passwordInput(), 'password123');
      await user.click(screen.getByText('Sales'));
      await user.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        const adminButton = screen.getByText('Administrator').closest('button');
        expect(adminButton).toBeDisabled();
      });

      resolveCreate!(createMockUserDetails());
    });
  });

  describe('error handling', () => {
    it('should display error message on API failure', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.createUser).mockRejectedValue(new Error('Username already exists'));

      renderForm();

      await user.type(usernameInput(), 'existing');
      await user.type(emailInput(), 'test@example.com');
      await user.type(fullNameInput(), 'Test User');
      await user.type(passwordInput(), 'password123');
      await user.click(screen.getByText('Sales'));
      await user.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText('Username already exists')).toBeInTheDocument();
      });

      // onSuccess and onClose should NOT be called
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should display generic error message for non-Error objects', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.createUser).mockRejectedValue('Unknown error');

      renderForm();

      await user.type(usernameInput(), 'newuser');
      await user.type(emailInput(), 'test@example.com');
      await user.type(fullNameInput(), 'Test User');
      await user.type(passwordInput(), 'password123');
      await user.click(screen.getByText('Sales'));
      await user.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create user')).toBeInTheDocument();
      });
    });

    it('should show dismiss button for error message', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.createUser).mockRejectedValue(new Error('Test error'));

      renderForm();

      await user.type(usernameInput(), 'newuser');
      await user.type(emailInput(), 'test@example.com');
      await user.type(fullNameInput(), 'Test User');
      await user.type(passwordInput(), 'password123');
      await user.click(screen.getByText('Sales'));
      await user.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Verify dismiss button is present
      expect(screen.getByRole('button', { name: /dismiss error/i })).toBeInTheDocument();
    });

    it('should re-enable form after error', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.createUser).mockRejectedValue(new Error('Test error'));

      renderForm();

      await user.type(usernameInput(), 'newuser');
      await user.type(emailInput(), 'test@example.com');
      await user.type(fullNameInput(), 'Test User');
      await user.type(passwordInput(), 'password123');
      await user.click(screen.getByText('Sales'));
      await user.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Form fields should be re-enabled
      expect(usernameInput()).not.toBeDisabled();
      expect(emailInput()).not.toBeDisabled();
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

    it('should have labels for all input fields', () => {
      renderForm();

      // Labels are rendered as text elements
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('should have correct input types', () => {
      renderForm();

      expect(emailInput()).toHaveAttribute('type', 'email');
      expect(passwordInput()).toHaveAttribute('type', 'password');
    });

    it('should have placeholder text for inputs', () => {
      renderForm();

      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter full name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    });
  });
});
