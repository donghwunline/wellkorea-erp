/**
 * Unit tests for CompanyForm component.
 * Tests form rendering, validation, submission, and mode-specific behavior.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyForm } from './CompanyForm';
import type { CompanyDetails } from '@/services';

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockCompanyDetails(overrides?: Partial<CompanyDetails>): CompanyDetails {
  return {
    id: 1,
    name: 'Test Company',
    registrationNumber: '123-45-67890',
    representative: 'CEO Name',
    businessType: 'Manufacturing',
    businessCategory: 'Electronics',
    contactPerson: 'John Doe',
    phone: '02-1234-5678',
    email: 'contact@test.com',
    address: '123 Test Street',
    bankAccount: 'Test Bank 123-456-789',
    paymentTerms: 'Net 30',
    roles: [
      { id: 1, roleType: 'CUSTOMER', creditLimit: null, defaultPaymentDays: null, notes: null, createdAt: '2025-01-01T00:00:00Z' },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Helper to get input by placeholder text.
 * Using placeholders since FormField doesn't have htmlFor/id association.
 */
const getInputByPlaceholder = (placeholder: string) =>
  screen.getByPlaceholderText(placeholder) as HTMLInputElement;

// ============================================================================
// Tests
// ============================================================================

describe('CompanyForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnDismissError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // CREATE MODE RENDERING
  // ==========================================================================

  describe('create mode', () => {
    it('should render all form fields', () => {
      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      // Basic Information - query by placeholder
      expect(getInputByPlaceholder('Enter company name')).toBeInTheDocument();
      expect(getInputByPlaceholder('000-00-00000')).toBeInTheDocument();
      expect(getInputByPlaceholder('Company representative name')).toBeInTheDocument();
      expect(getInputByPlaceholder('e.g., Manufacturing')).toBeInTheDocument();
      expect(getInputByPlaceholder('e.g., Electronics')).toBeInTheDocument();

      // Contact Information
      expect(getInputByPlaceholder('Primary contact name')).toBeInTheDocument();
      expect(getInputByPlaceholder('02-000-0000')).toBeInTheDocument();
      expect(getInputByPlaceholder('contact@company.com')).toBeInTheDocument();
      expect(getInputByPlaceholder('Company address')).toBeInTheDocument();

      // Financial Information
      expect(getInputByPlaceholder('Bank name, account number')).toBeInTheDocument();
      expect(getInputByPlaceholder('e.g., Net 30')).toBeInTheDocument();
    });

    it('should render role checkboxes in create mode', () => {
      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      expect(screen.getByLabelText('고객사')).toBeInTheDocument();
      expect(screen.getByLabelText('협력업체')).toBeInTheDocument();
      expect(screen.getByLabelText('외주업체')).toBeInTheDocument();
    });

    it('should show "Create Company" button in create mode', () => {
      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      expect(screen.getByRole('button', { name: /create company/i })).toBeInTheDocument();
    });

    it('should initialize with empty form fields', () => {
      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      expect(getInputByPlaceholder('Enter company name')).toHaveValue('');
      expect(getInputByPlaceholder('000-00-00000')).toHaveValue('');
    });
  });

  // ==========================================================================
  // EDIT MODE RENDERING
  // ==========================================================================

  describe('edit mode', () => {
    it('should populate form with initial data', () => {
      const initialData = createMockCompanyDetails({
        name: 'Existing Company',
        registrationNumber: '999-88-77777',
        contactPerson: 'Jane Doe',
      });

      render(
        <CompanyForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      expect(getInputByPlaceholder('Enter company name')).toHaveValue('Existing Company');
      expect(getInputByPlaceholder('000-00-00000')).toHaveValue('999-88-77777');
      expect(getInputByPlaceholder('Primary contact name')).toHaveValue('Jane Doe');
    });

    it('should not render role checkboxes in edit mode', () => {
      render(
        <CompanyForm
          mode="edit"
          initialData={createMockCompanyDetails()}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      expect(screen.queryByLabelText('고객사')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('협력업체')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('외주업체')).not.toBeInTheDocument();
    });

    it('should show "Save Changes" button in edit mode', () => {
      render(
        <CompanyForm
          mode="edit"
          initialData={createMockCompanyDetails()}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('should handle null optional fields', () => {
      const initialData = createMockCompanyDetails({
        registrationNumber: null,
        representative: null,
        contactPerson: null,
        phone: null,
        email: null,
      });

      render(
        <CompanyForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      expect(getInputByPlaceholder('000-00-00000')).toHaveValue('');
      expect(getInputByPlaceholder('Primary contact name')).toHaveValue('');
    });
  });

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  describe('validation', () => {
    it('should disable submit button when name is empty', () => {
      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create company/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when no role is selected in create mode', async () => {
      const user = userEvent.setup();

      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      // Fill in name but no role
      await user.type(getInputByPlaceholder('Enter company name'), 'Test Company');

      const submitButton = screen.getByRole('button', { name: /create company/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when name and role are provided', async () => {
      const user = userEvent.setup();

      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      // Fill in name and select role
      await user.type(getInputByPlaceholder('Enter company name'), 'Test Company');
      await user.click(screen.getByLabelText('고객사'));

      const submitButton = screen.getByRole('button', { name: /create company/i });
      expect(submitButton).toBeEnabled();
    });

    it('should show validation message when no role selected', async () => {
      const user = userEvent.setup();

      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      // Fill in name but no role
      await user.type(getInputByPlaceholder('Enter company name'), 'Test Company');

      expect(screen.getByText(/please select at least one role/i)).toBeInTheDocument();
    });

    it('should not require role in edit mode', async () => {
      const user = userEvent.setup();

      render(
        <CompanyForm
          mode="edit"
          initialData={createMockCompanyDetails()}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      // Clear name and type new one
      const nameInput = getInputByPlaceholder('Enter company name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).toBeEnabled();
    });

    it('should show error for whitespace-only name', async () => {
      const user = userEvent.setup();

      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      // Type only whitespace
      await user.type(getInputByPlaceholder('Enter company name'), '   ');

      expect(screen.getByText(/cannot be whitespace only/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ROLE SELECTION
  // ==========================================================================

  describe('role selection', () => {
    it('should toggle role on click', async () => {
      const user = userEvent.setup();

      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      const customerCheckbox = screen.getByLabelText('고객사');

      // Initially unchecked
      expect(customerCheckbox).not.toBeChecked();

      // Click to check
      await user.click(customerCheckbox);
      expect(customerCheckbox).toBeChecked();

      // Click to uncheck
      await user.click(customerCheckbox);
      expect(customerCheckbox).not.toBeChecked();
    });

    it('should allow multiple roles to be selected', async () => {
      const user = userEvent.setup();

      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      await user.click(screen.getByLabelText('고객사'));
      await user.click(screen.getByLabelText('협력업체'));
      await user.click(screen.getByLabelText('외주업체'));

      expect(screen.getByLabelText('고객사')).toBeChecked();
      expect(screen.getByLabelText('협력업체')).toBeChecked();
      expect(screen.getByLabelText('외주업체')).toBeChecked();
    });
  });

  // ==========================================================================
  // FORM SUBMISSION
  // ==========================================================================

  describe('form submission', () => {
    it('should call onSubmit with create request data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      // Fill form
      await user.type(getInputByPlaceholder('Enter company name'), 'New Company');
      await user.type(getInputByPlaceholder('000-00-00000'), '111-22-33333');
      await user.type(getInputByPlaceholder('Primary contact name'), 'Jane Doe');
      await user.type(getInputByPlaceholder('contact@company.com'), 'jane@example.com');
      await user.click(screen.getByLabelText('고객사'));
      await user.click(screen.getByLabelText('협력업체'));

      // Submit
      await user.click(screen.getByRole('button', { name: /create company/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledOnce();
      });

      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.name).toBe('New Company');
      expect(submittedData.registrationNumber).toBe('111-22-33333');
      expect(submittedData.contactPerson).toBe('Jane Doe');
      expect(submittedData.email).toBe('jane@example.com');
      expect(submittedData.roles).toEqual(['CUSTOMER', 'VENDOR']);
    });

    it('should trim whitespace from string fields', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      await user.type(getInputByPlaceholder('Enter company name'), '  Company With Spaces  ');
      await user.type(getInputByPlaceholder('Primary contact name'), '  John  ');
      await user.click(screen.getByLabelText('고객사'));

      await user.click(screen.getByRole('button', { name: /create company/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledOnce();
      });

      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.name).toBe('Company With Spaces');
      expect(submittedData.contactPerson).toBe('John');
    });

    it('should convert empty strings to null', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      await user.type(getInputByPlaceholder('Enter company name'), 'Minimal Company');
      await user.click(screen.getByLabelText('외주업체'));

      await user.click(screen.getByRole('button', { name: /create company/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledOnce();
      });

      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.registrationNumber).toBeNull();
      expect(submittedData.email).toBeNull();
      expect(submittedData.phone).toBeNull();
    });

    it('should call onSubmit with update request data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <CompanyForm
          mode="edit"
          initialData={createMockCompanyDetails()}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      // Update name
      const nameInput = getInputByPlaceholder('Enter company name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Company');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledOnce();
      });

      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.name).toBe('Updated Company');
      // Note: roles are not included in update request
      expect(submittedData).not.toHaveProperty('roles');
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnCancel).toHaveBeenCalledOnce();
    });
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  describe('loading state', () => {
    it('should disable all inputs when submitting', () => {
      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={true}
        />
      );

      expect(getInputByPlaceholder('Enter company name')).toBeDisabled();
      expect(getInputByPlaceholder('000-00-00000')).toBeDisabled();
      expect(getInputByPlaceholder('Primary contact name')).toBeDisabled();
    });

    it('should disable role checkboxes when submitting', () => {
      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={true}
        />
      );

      expect(screen.getByLabelText('고객사')).toBeDisabled();
      expect(screen.getByLabelText('협력업체')).toBeDisabled();
      expect(screen.getByLabelText('외주업체')).toBeDisabled();
    });

    it('should disable buttons when submitting', () => {
      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={true}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /create company/i })).toBeDisabled();
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe('error handling', () => {
    it('should display error message when provided', () => {
      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
          error="Company name already exists"
        />
      );

      expect(screen.getByText(/company name already exists/i)).toBeInTheDocument();
    });

    it('should call onDismissError when error is dismissed', async () => {
      const user = userEvent.setup();

      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
          error="Some error"
          onDismissError={mockOnDismissError}
        />
      );

      // Find and click dismiss button in ErrorAlert
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(mockOnDismissError).toHaveBeenCalledOnce();
    });

    it('should not show error when not provided', () => {
      render(
        <CompanyForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={false}
        />
      );

      // ErrorAlert should not be present
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
