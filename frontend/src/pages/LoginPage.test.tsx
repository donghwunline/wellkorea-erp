/**
 * Unit tests for LoginPage component.
 * Tests form rendering, validation, login flow, error handling, and accessibility.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import type { ApiError } from '@/api/types';

// Mock useAuth hook
vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
}));

// Mock getErrorMessage utility
vi.mock('@/services', () => ({
  getErrorMessage: vi.fn((error: ApiError) => {
    if (error.errorCode === 'AUTH_001') return '아이디 또는 비밀번호가 잘못되었습니다';
    if (error.errorCode === 'AUTH_003') return '세션이 만료되었습니다';
    return error.message;
  }),
}));

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
const mockLocation = { state: null };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Import mocked modules
import { useAuth } from '@/hooks';
import { getErrorMessage } from '@/services';

// Helper to render LoginPage with BrowserRouter
function renderLoginPage() {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
}

describe('LoginPage', () => {
  let mockLogin: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Clear localStorage
    localStorage.clear();

    // Reset location state
    mockLocation.state = null;

    // Default mock: not authenticated
    mockLogin = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
      isLoading: false,
    });
  });

  describe('rendering', () => {
    it('should render login form with all fields', () => {
      renderLoginPage();

      // Heading
      expect(screen.getByRole('heading', { name: /WellKorea/i })).toBeInTheDocument();

      // Form fields
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();

      // Submit button
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should have correct input types and autocomplete attributes', () => {
      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(usernameInput).toHaveAttribute('autocomplete', 'username');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    it('should render decorative elements', () => {
      const { container } = renderLoginPage();

      // Logo (WK text)
      expect(container.querySelector('.font-mono')).toHaveTextContent('WK');

      // Version info
      expect(screen.getByText(/v1\.0\.0/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should show error when username is empty', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Submit without filling username
      await user.click(submitButton);

      // Error message shown
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });

      // Login not called
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Fill username but not password
      await user.type(usernameInput, 'testuser');
      await user.click(submitButton);

      // Error message shown
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      // Login not called
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should trim username before validation', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Type only whitespace in username
      await user.type(usernameInput, '   ');
      await user.click(submitButton);

      // Error shown (whitespace-only username is invalid)
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('successful login', () => {
    it('should call login with trimmed credentials and navigate on success', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);

      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Fill form with whitespace around username
      await user.type(usernameInput, '  admin  ');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Login called with trimmed username
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledOnce();
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'admin',
          password: 'password123',
        });
      });

      // Navigate to home
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      let resolveLogin: () => void;
      mockLogin.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolveLogin = resolve;
          })
      );

      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'password');
      await user.click(submitButton);

      // Loading state shown
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });

      // Inputs disabled during loading
      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();

      // Resolve login
      resolveLogin!();

      // Loading state cleared
      await waitFor(() => {
        expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
      });
    });

    it('should navigate to redirect path from location state', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);

      // Set location state with redirect path
      mockLocation.state = { from: { pathname: '/admin/users' } };

      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'password');
      await user.click(submitButton);

      // Navigate to redirect path
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/users', { replace: true });
      });
    });
  });

  describe('error handling', () => {
    it('should display error message on AUTH_001 (invalid credentials)', async () => {
      const user = userEvent.setup();

      const authError: ApiError = {
        status: 401,
        errorCode: 'AUTH_001',
        message: 'Invalid credentials',
      };
      mockLogin.mockRejectedValue(authError);

      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'wrong');
      await user.type(passwordInput, 'wrong');
      await user.click(submitButton);

      // Error message shown (Korean)
      await waitFor(() => {
        expect(
          screen.getByText(/아이디 또는 비밀번호가 잘못되었습니다/i)
        ).toBeInTheDocument();
      });

      // getErrorMessage called
      expect(getErrorMessage).toHaveBeenCalledWith(authError);
    });

    it('should clear password and focus password field on AUTH_001', async () => {
      const user = userEvent.setup();

      const authError: ApiError = {
        status: 401,
        errorCode: 'AUTH_001',
        message: 'Invalid credentials',
      };
      mockLogin.mockRejectedValue(authError);

      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'user');
      await user.type(passwordInput, 'wrong-password');
      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(
          screen.getByText(/아이디 또는 비밀번호가 잘못되었습니다/i)
        ).toBeInTheDocument();
      });

      // Password field cleared
      expect(passwordInput).toHaveValue('');

      // Password field has focus (check if it's the active element)
      await waitFor(() => {
        expect(passwordInput).toHaveFocus();
      });
    });

    it('should NOT clear password on AUTH_003 (expired token)', async () => {
      const user = userEvent.setup();

      const authError: ApiError = {
        status: 401,
        errorCode: 'AUTH_003',
        message: 'Token expired',
      };
      mockLogin.mockRejectedValue(authError);

      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'user');
      await user.type(passwordInput, 'my-password');
      await user.click(submitButton);

      // Error shown
      await waitFor(() => {
        expect(screen.getByText(/세션이 만료되었습니다/i)).toBeInTheDocument();
      });

      // Password NOT cleared (AUTH_003 is different error)
      expect(passwordInput).toHaveValue('my-password');
    });

    it('should allow dismissing error message', async () => {
      const user = userEvent.setup();

      const authError: ApiError = {
        status: 401,
        errorCode: 'AUTH_001',
        message: 'Invalid credentials',
      };
      mockLogin.mockRejectedValue(authError);

      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton); // Trigger validation error first

      // Validation error shown
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });

      // Now fill form and submit with wrong credentials
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(usernameInput, 'wrong');
      await user.type(passwordInput, 'wrong');
      await user.click(submitButton);

      // API error shown
      await waitFor(() => {
        expect(
          screen.getByText(/아이디 또는 비밀번호가 잘못되었습니다/i)
        ).toBeInTheDocument();
      });

      // Find and click dismiss button (ErrorAlert has onDismiss)
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();

      // ErrorAlert component renders a close button - find it within the alert
      const closeButton = errorAlert.querySelector('button');
      if (closeButton) {
        await user.click(closeButton);

        // Error dismissed
        await waitFor(() => {
          expect(
            screen.queryByText(/아이디 또는 비밀번호가 잘못되었습니다/i)
          ).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('remember me functionality', () => {
    it('should save username to localStorage when remember me is checked', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);

      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'password');
      await user.click(rememberMeCheckbox);
      await user.click(submitButton);

      // Wait for login to complete
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      // Username saved to localStorage
      expect(localStorage.getItem('rememberedUsername')).toBe('admin');
    });

    it('should remove username from localStorage when remember me is unchecked', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);

      // Pre-populate localStorage
      localStorage.setItem('rememberedUsername', 'olduser');

      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Remember me should be checked initially (username exists in localStorage)
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      expect(rememberMeCheckbox).toBeChecked();

      // Type new username
      await user.clear(usernameInput);
      await user.type(usernameInput, 'newuser');
      await user.type(passwordInput, 'password');

      // Uncheck remember me
      await user.click(rememberMeCheckbox);
      await user.click(submitButton);

      // Wait for login
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      // Username removed from localStorage
      expect(localStorage.getItem('rememberedUsername')).toBeNull();
    });

    it('should restore remembered username on mount', () => {
      // Set remembered username
      localStorage.setItem('rememberedUsername', 'remembered-user');

      renderLoginPage();

      // Username field pre-filled
      const usernameInput = screen.getByLabelText(/username/i);
      expect(usernameInput).toHaveValue('remembered-user');

      // Remember me checked
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      expect(rememberMeCheckbox).toBeChecked();
    });
  });

  describe('accessibility', () => {
    it('should have proper labels for all form controls', () => {
      renderLoginPage();

      // All form controls have labels
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('should disable all inputs during loading', async () => {
      const user = userEvent.setup();
      let resolveLogin: () => void;
      mockLogin.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolveLogin = resolve;
          })
      );

      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'user');
      await user.type(passwordInput, 'pass');
      await user.click(submitButton);

      // All disabled during loading
      await waitFor(() => {
        expect(usernameInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(rememberMeCheckbox).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });

      // Resolve login
      resolveLogin!();

      // Inputs re-enabled after login
      await waitFor(() => {
        expect(usernameInput).not.toBeDisabled();
      });
    });

    it('should have proper button text for screen readers', () => {
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveTextContent(/sign in/i);
    });
  });

  describe('redirect behavior', () => {
    it('should redirect to home when already authenticated', () => {
      // User is authenticated
      vi.mocked(useAuth).mockReturnValue({
        login: mockLogin,
        isAuthenticated: true,
        user: { id: 1, username: 'admin', email: 'admin@example.com', fullName: 'Admin', roles: ['ROLE_ADMIN'] },
        logout: vi.fn(),
        hasRole: vi.fn(),
        hasAnyRole: vi.fn(),
        isLoading: false,
      });

      renderLoginPage();

      // Navigate called immediately
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });
});
