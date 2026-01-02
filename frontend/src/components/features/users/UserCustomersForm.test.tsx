/**
 * Unit tests for UserCustomersForm component.
 * Tests customer loading, customer selection, submission, error handling, and accessibility.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { UserCustomersForm } from './UserCustomersForm';
import { mockUserDetails } from '@/test/fixtures';
import { userService } from '@/services';
import * as sharedApi from '@/shared/api';

// Mock services
vi.mock('@/services', () => ({
  userService: {
    getUserCustomers: vi.fn(),
    assignCustomers: vi.fn(),
  },
}));

// Mock shared API
vi.mock('@/shared/api', async importOriginal => {
  const original = await importOriginal<typeof import('@/shared/api')>();
  return {
    ...original,
    httpClient: {
      ...original.httpClient,
      requestWithMeta: vi.fn(),
    },
  };
});

// Mock customer data for tests (simplified API response format)
interface MockCustomer {
  id: number;
  name: string;
  email: string;
}

const MOCK_CUSTOMERS: MockCustomer[] = [
  { id: 1, name: 'Samsung Electronics', email: 'contact@samsung.com' },
  { id: 2, name: 'LG Display', email: 'info@lgdisplay.com' },
  { id: 3, name: 'Hyundai Motor', email: 'info@hyundai.com' },
  { id: 4, name: 'SK Hynix', email: 'contact@skhynix.com' },
  { id: 5, name: 'POSCO', email: 'contact@posco.com' },
];

const MOCK_API_RESPONSE = {
  data: {
    content: MOCK_CUSTOMERS,
  },
  metadata: {
    page: 0,
    size: 100,
    totalElements: 5,
    totalPages: 1,
    first: true,
    last: true,
  },
};

describe('UserCustomersForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const testUser = mockUserDetails.salesUser;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: return available customers from API
    vi.mocked(sharedApi.httpClient.requestWithMeta).mockResolvedValue(MOCK_API_RESPONSE);
    // Default mock: no customers assigned
    vi.mocked(userService.getUserCustomers).mockResolvedValue([]);
  });

  function renderForm(isOpen = true, user: typeof testUser | null = testUser) {
    return render(
      <UserCustomersForm
        isOpen={isOpen}
        user={user}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  }

  describe('rendering', () => {
    it('should render modal when open with user', async () => {
      renderForm(true, testUser);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      expect(screen.getByText('Assign Customers')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderForm(false, testUser);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should not render when user is null', () => {
      renderForm(true, null);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display user info', async () => {
      renderForm(true, testUser);

      await waitFor(() => {
        expect(screen.getByText(testUser.fullName)).toBeInTheDocument();
      });
      expect(screen.getByText(testUser.email)).toBeInTheDocument();
    });

    it('should render customer list after loading', async () => {
      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });
      expect(screen.getByText('LG Display')).toBeInTheDocument();
      expect(screen.getByText('Hyundai Motor')).toBeInTheDocument();
      expect(screen.getByText('SK Hynix')).toBeInTheDocument();
      // POSCO appears as both name and code, so use getAllByText
      expect(screen.getAllByText('POSCO').length).toBeGreaterThanOrEqual(1);
    });

    it('should render customer emails', async () => {
      renderForm();

      await waitFor(() => {
        expect(screen.getByText('contact@samsung.com')).toBeInTheDocument();
      });
      expect(screen.getByText('info@lgdisplay.com')).toBeInTheDocument();
      expect(screen.getByText('info@hyundai.com')).toBeInTheDocument();
    });

    it('should render action buttons', async () => {
      renderForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /save assignments/i })).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading state while fetching customers', async () => {
      let resolveApiCall: (value: typeof MOCK_API_RESPONSE) => void;
      vi.mocked(sharedApi.httpClient.requestWithMeta).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveApiCall = resolve;
          })
      );

      renderForm();

      expect(screen.getByText('Loading customers...')).toBeInTheDocument();

      resolveApiCall!(MOCK_API_RESPONSE);

      await waitFor(() => {
        expect(screen.queryByText('Loading customers...')).not.toBeInTheDocument();
      });
    });

    it('should fetch customer assignments on modal open', async () => {
      renderForm(true, testUser);

      await waitFor(() => {
        expect(userService.getUserCustomers).toHaveBeenCalledOnce();
        expect(userService.getUserCustomers).toHaveBeenCalledWith(testUser.id);
      });
    });
  });

  describe('customer pre-selection', () => {
    it('should pre-select customers that user is assigned to', async () => {
      vi.mocked(userService.getUserCustomers).mockResolvedValue([1, 3]); // Samsung (1) and Hyundai (3)

      renderForm();

      await waitFor(() => {
        const samsungButton = screen.getByText('Samsung Electronics').closest('button');
        expect(samsungButton).toHaveClass('border-copper-500');
      });

      const hyundaiButton = screen.getByText('Hyundai Motor').closest('button');
      expect(hyundaiButton).toHaveClass('border-copper-500');

      // LG should not be selected
      const lgButton = screen.getByText('LG Display').closest('button');
      expect(lgButton).not.toHaveClass('border-copper-500');
    });

    it('should show checkmark for selected customers', async () => {
      vi.mocked(userService.getUserCustomers).mockResolvedValue([1]);

      renderForm();

      await waitFor(() => {
        const samsungButton = screen.getByText('Samsung Electronics').closest('button');
        expect(samsungButton?.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('should handle empty customer assignments', async () => {
      vi.mocked(userService.getUserCustomers).mockResolvedValue([]);

      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      // No customers should be selected
      const samsungButton = screen.getByText('Samsung Electronics').closest('button');
      expect(samsungButton).not.toHaveClass('border-copper-500');
    });
  });

  describe('customer selection', () => {
    it('should toggle customer selection on click', async () => {
      const user = userEvent.setup();
      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      const samsungButton = screen.getByText('Samsung Electronics').closest('button');
      expect(samsungButton).not.toHaveClass('border-copper-500');

      await user.click(samsungButton!);
      expect(samsungButton).toHaveClass('border-copper-500');

      await user.click(samsungButton!);
      expect(samsungButton).not.toHaveClass('border-copper-500');
    });

    it('should allow selecting multiple customers', async () => {
      const user = userEvent.setup();
      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      const samsungButton = screen.getByText('Samsung Electronics').closest('button');
      const lgButton = screen.getByText('LG Display').closest('button');

      await user.click(samsungButton!);
      await user.click(lgButton!);

      expect(samsungButton).toHaveClass('border-copper-500');
      expect(lgButton).toHaveClass('border-copper-500');
    });

    it('should allow deselecting a pre-selected customer', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.getUserCustomers).mockResolvedValue([1]);

      renderForm();

      await waitFor(() => {
        const samsungButton = screen.getByText('Samsung Electronics').closest('button');
        expect(samsungButton).toHaveClass('border-copper-500');
      });

      const samsungButton = screen.getByText('Samsung Electronics').closest('button');
      await user.click(samsungButton!);
      expect(samsungButton).not.toHaveClass('border-copper-500');
    });
  });

  describe('successful submission', () => {
    it('should call userService.assignCustomers with selected customer IDs', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.assignCustomers).mockResolvedValue(undefined);

      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      // Select Samsung (id: 1) and LG (id: 2)
      await user.click(screen.getByText('Samsung Electronics').closest('button')!);
      await user.click(screen.getByText('LG Display').closest('button')!);
      await user.click(screen.getByRole('button', { name: /save assignments/i }));

      await waitFor(() => {
        expect(userService.assignCustomers).toHaveBeenCalledOnce();
        expect(userService.assignCustomers).toHaveBeenCalledWith(
          testUser.id,
          expect.arrayContaining([1, 2])
        );
      });
    });

    it('should call onSuccess and onClose after successful assignment', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.assignCustomers).mockResolvedValue(undefined);

      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save assignments/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledOnce();
        expect(mockOnClose).toHaveBeenCalledOnce();
      });
    });

    it('should allow saving with no customers selected (unassign all)', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.assignCustomers).mockResolvedValue(undefined);

      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save assignments/i }));

      await waitFor(() => {
        expect(userService.assignCustomers).toHaveBeenCalledWith(testUser.id, []);
      });
    });
  });

  describe('submission loading state', () => {
    it('should disable buttons during submission', async () => {
      const user = userEvent.setup();
      let resolveAssign: () => void;
      vi.mocked(userService.assignCustomers).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveAssign = resolve;
          })
      );

      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save assignments/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      });

      resolveAssign!();
    });

    it('should disable customer buttons during submission', async () => {
      const user = userEvent.setup();
      let resolveAssign: () => void;
      vi.mocked(userService.assignCustomers).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveAssign = resolve;
          })
      );

      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save assignments/i }));

      await waitFor(() => {
        const samsungButton = screen.getByText('Samsung Electronics').closest('button');
        expect(samsungButton).toBeDisabled();
      });

      resolveAssign!();
    });
  });

  describe('error handling', () => {
    it('should display error when loading customers fails', async () => {
      vi.mocked(sharedApi.httpClient.requestWithMeta).mockRejectedValue(new Error('Network error'));

      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Failed to load customer data')).toBeInTheDocument();
      });
    });

    it('should display error message on submission failure', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.assignCustomers).mockRejectedValue(new Error('Permission denied'));

      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save assignments/i }));

      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should display generic error message for non-Error objects', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.assignCustomers).mockRejectedValue('Unknown error');

      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save assignments/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to assign customers')).toBeInTheDocument();
      });
    });

    it('should show dismiss button for error message', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.assignCustomers).mockRejectedValue(new Error('Test error'));

      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save assignments/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Verify dismiss button is present
      expect(screen.getByRole('button', { name: /dismiss error/i })).toBeInTheDocument();
    });

    it('should re-enable form after error', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.assignCustomers).mockRejectedValue(new Error('Test error'));

      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save assignments/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      const samsungButton = screen.getByText('Samsung Electronics').closest('button');
      expect(samsungButton).not.toBeDisabled();
    });
  });

  describe('cancel functionality', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalledOnce();
    });
  });

  describe('different user types', () => {
    it('should work with admin user', async () => {
      renderForm(true, mockUserDetails.adminUser);

      await waitFor(() => {
        expect(userService.getUserCustomers).toHaveBeenCalledWith(mockUserDetails.adminUser.id);
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper modal structure', async () => {
      renderForm();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should have label for customer selection section', async () => {
      renderForm();

      await waitFor(() => {
        expect(screen.getByText('Select Customers')).toBeInTheDocument();
      });
    });

    it('should display user information prominently', async () => {
      renderForm();

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });
      expect(screen.getByText(testUser.fullName)).toBeInTheDocument();
      expect(screen.getByText(testUser.email)).toBeInTheDocument();
    });
  });
});
