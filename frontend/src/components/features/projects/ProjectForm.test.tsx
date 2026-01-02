/**
 * Unit tests for ProjectForm component.
 * Tests form rendering, validation, submission, create/edit modes, and accessibility.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ProjectForm } from './ProjectForm';
import type { Project } from '@/entities/project';

// Alias for backward compatibility in tests
type ProjectDetails = Project;

// Mock scrollIntoView since JSDOM doesn't implement it
Element.prototype.scrollIntoView = vi.fn();

// Mock the shared API used by the Combobox components
vi.mock('@/shared/api', async importOriginal => {
  const original = await importOriginal<typeof import('@/shared/api')>();
  return {
    ...original,
    httpClient: {
      ...original.httpClient,
      requestWithMeta: vi.fn().mockImplementation(async (config: { url: string }) => {
        // Return mock data for company API calls
        if (config.url.includes('companies')) {
          return {
            data: {
              content: [
                { id: 1, name: 'Samsung Electronics', email: 'contact@samsung.com', roles: [{ id: 1, roleType: 'CUSTOMER' }], isActive: true, createdAt: '2025-01-01' },
                { id: 2, name: 'LG Display', email: 'contact@lgdisplay.com', roles: [{ id: 2, roleType: 'CUSTOMER' }], isActive: true, createdAt: '2025-01-01' },
                { id: 3, name: 'SK Hynix', email: 'contact@skhynix.com', roles: [{ id: 3, roleType: 'CUSTOMER' }], isActive: true, createdAt: '2025-01-01' },
              ],
            },
            metadata: {
              page: 0,
              size: 20,
              totalElements: 3,
              totalPages: 1,
              first: true,
              last: true,
            },
          };
        }
        throw new Error(`Unhandled URL: ${config.url}`);
      }),
    },
  };
});

// Mock the userApi used by UserCombobox
vi.mock('@/entities/user', async importOriginal => {
  const original = await importOriginal<typeof import('@/entities/user')>();
  return {
    ...original,
    userApi: {
      getList: vi.fn().mockResolvedValue({
        data: [
          { id: 1, username: 'minjun', fullName: 'Kim Minjun (Admin)', email: 'minjun@test.com', roles: [] },
          { id: 2, username: 'jiwon', fullName: 'Lee Jiwon (Sales)', email: 'jiwon@test.com', roles: [] },
          { id: 3, username: 'seohyun', fullName: 'Park Seohyun (Finance)', email: 'seohyun@test.com', roles: [] },
        ],
        pagination: {
          page: 0,
          size: 20,
          totalElements: 3,
          totalPages: 1,
          first: true,
          last: true,
        },
      }),
    },
  };
});

// Helper to create mock project for edit mode
function createMockProject(overrides: Partial<ProjectDetails> = {}): ProjectDetails {
  return {
    id: 1,
    jobCode: 'WK2-2025-001-0115',
    customerId: 1,
    customerName: 'Test Customer',
    projectName: 'Test Project',
    requesterName: 'John Doe',
    dueDate: '2025-02-15',
    internalOwnerId: 2,
    internalOwnerName: 'Internal Owner',
    status: 'ACTIVE',
    createdById: 1,
    createdByName: 'Creator',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-16T14:45:00Z',
    ...overrides,
  };
}

describe('ProjectForm', () => {
  const defaultProps = {
    mode: 'create' as const,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Use fake timers to control "today" for date picker
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering (create mode)', () => {
    it('should render customer combobox', () => {
      render(<ProjectForm {...defaultProps} />);

      expect(screen.getByText('Customer')).toBeInTheDocument();
    });

    it('should render project name field', () => {
      render(<ProjectForm {...defaultProps} />);

      expect(screen.getByText('Project Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter project name')).toBeInTheDocument();
    });

    it('should render requester name field', () => {
      render(<ProjectForm {...defaultProps} />);

      expect(screen.getByText('Requester Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter requester name (optional)')).toBeInTheDocument();
    });

    it('should render due date picker', () => {
      render(<ProjectForm {...defaultProps} />);

      expect(screen.getByText('Due Date')).toBeInTheDocument();
    });

    it('should render internal owner combobox', () => {
      render(<ProjectForm {...defaultProps} />);

      expect(screen.getByText('Internal Owner')).toBeInTheDocument();
    });

    it('should render Create Project button', () => {
      render(<ProjectForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(<ProjectForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not render job code field in create mode', () => {
      render(<ProjectForm {...defaultProps} />);

      expect(screen.queryByText('Job Code')).not.toBeInTheDocument();
    });
  });

  describe('rendering (edit mode)', () => {
    it('should pre-fill form with initial data', async () => {
      vi.useRealTimers();
      const initialData = createMockProject({
        customerId: 1,
        projectName: 'Existing Project',
        requesterName: 'Jane Smith',
        dueDate: '2025-03-01',
        internalOwnerId: 2,
      });

      render(<ProjectForm {...defaultProps} mode="edit" initialData={initialData} />);

      // Project name should be pre-filled
      expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();

      // Requester name should be pre-filled
      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
    });

    it('should render Save Changes button in edit mode', () => {
      render(<ProjectForm {...defaultProps} mode="edit" initialData={createMockProject()} />);

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('should render Job Code field in edit mode', () => {
      render(
        <ProjectForm
          {...defaultProps}
          mode="edit"
          initialData={createMockProject({ jobCode: 'WK2-2025-042-0120' })}
        />
      );

      expect(screen.getByText('Job Code')).toBeInTheDocument();
      expect(screen.getByText('WK2-2025-042-0120')).toBeInTheDocument();
    });

    it('should show help text that customer cannot be changed', () => {
      render(<ProjectForm {...defaultProps} mode="edit" initialData={createMockProject()} />);

      expect(screen.getByText('Customer cannot be changed after creation')).toBeInTheDocument();
    });

    it('should show help text that internal owner cannot be changed', () => {
      render(<ProjectForm {...defaultProps} mode="edit" initialData={createMockProject()} />);

      expect(
        screen.getByText('Internal owner cannot be changed after creation')
      ).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('should disable submit button when form is incomplete', () => {
      render(<ProjectForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /create project/i })).toBeDisabled();
    });

    it('should enable submit button when form is complete', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<ProjectForm {...defaultProps} />);

      // Fill in all required fields
      // Select customer (first combobox)
      const customerInput = screen.getAllByRole('combobox')[0];
      await user.click(customerInput);
      await user.click(screen.getByText('Samsung Electronics'));

      // Enter project name
      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'New Project');

      // Select due date - click the button to open, then select a future date
      const dateButton = screen.getByRole('button', { name: /select due date/i });
      await user.click(dateButton);
      // Navigate to next month to ensure dates are in the future
      const nextMonthButton = screen.getByRole('button', { name: /next month/i });
      await user.click(nextMonthButton);
      // Click day 15 - find by aria-label containing "15," (e.g., "January 15, 2026")
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      nextMonthDate.setDate(15);
      const expectedLabel = nextMonthDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const day15Button = screen.getByRole('button', { name: new RegExp(expectedLabel, 'i') });
      await user.click(day15Button);

      // Select internal owner (second combobox)
      const ownerInput = screen.getAllByRole('combobox')[1];
      await user.click(ownerInput);
      await user.click(screen.getByText('Lee Jiwon (Sales)'));

      expect(screen.getByRole('button', { name: /create project/i })).not.toBeDisabled();
    });

    it('should show validation error for whitespace-only project name', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<ProjectForm {...defaultProps} />);

      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, '   ');

      expect(screen.getByText('Project name cannot be whitespace only')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should call onSubmit with form data in create mode', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<ProjectForm {...defaultProps} onSubmit={onSubmit} />);

      // Fill form
      // Select customer (first combobox)
      const customerInput = screen.getAllByRole('combobox')[0];
      await user.click(customerInput);
      await user.click(screen.getByText('Samsung Electronics'));

      // Enter project name
      await user.type(screen.getByPlaceholderText('Enter project name'), 'New Project');

      // Enter requester name
      await user.type(screen.getByPlaceholderText('Enter requester name (optional)'), 'John');

      // Select due date - navigate to next month and pick day 15
      const dateButton = screen.getByRole('button', { name: /select due date/i });
      await user.click(dateButton);
      const nextMonthButton = screen.getByRole('button', { name: /next month/i });
      await user.click(nextMonthButton);
      // Click day 15 - dynamically calculate next month's date
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      nextMonthDate.setDate(15);
      const expectedLabel = nextMonthDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const day15Button = screen.getByRole('button', { name: new RegExp(expectedLabel, 'i') });
      await user.click(day15Button);

      // Select internal owner (second combobox)
      const ownerInput = screen.getAllByRole('combobox')[1];
      await user.click(ownerInput);
      await user.click(screen.getByText('Lee Jiwon (Sales)'));

      // Submit
      await user.click(screen.getByRole('button', { name: /create project/i }));

      // Calculate expected due date string (YYYY-MM-15)
      const expectedDueDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-15`;

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          customerId: 1,
          projectName: 'New Project',
          requesterName: 'John',
          dueDate: expectedDueDate,
          internalOwnerId: 2,
        });
      });
    });

    it('should call onSubmit with form data in edit mode', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const initialData = createMockProject();

      render(
        <ProjectForm {...defaultProps} mode="edit" initialData={initialData} onSubmit={onSubmit} />
      );

      // Modify project name
      const projectNameInput = screen.getByDisplayValue('Test Project');
      await user.clear(projectNameInput);
      await user.type(projectNameInput, 'Updated Project');

      // Submit
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          projectName: 'Updated Project',
          requesterName: 'John Doe',
          dueDate: '2025-02-15',
        });
      });
    });

    it('should trim project name before submission', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<ProjectForm {...defaultProps} onSubmit={onSubmit} />);

      // Fill form with spaces
      const customerInput = screen.getAllByRole('combobox')[0];
      await user.click(customerInput);
      await user.click(screen.getByText('Samsung Electronics'));

      await user.type(screen.getByPlaceholderText('Enter project name'), '  New Project  ');

      // Select due date - navigate to next month and pick day 15
      const dateButton = screen.getByRole('button', { name: /select due date/i });
      await user.click(dateButton);
      const nextMonthButton = screen.getByRole('button', { name: /next month/i });
      await user.click(nextMonthButton);
      // Click day 15 - dynamically calculate next month's date
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      nextMonthDate.setDate(15);
      const expectedLabel = nextMonthDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const day15Button = screen.getByRole('button', { name: new RegExp(expectedLabel, 'i') });
      await user.click(day15Button);

      const ownerInput = screen.getAllByRole('combobox')[1];
      await user.click(ownerInput);
      await user.click(screen.getByText('Lee Jiwon (Sales)'));

      await user.click(screen.getByRole('button', { name: /create project/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            projectName: 'New Project',
          })
        );
      });
    });

    it('should omit requester name if empty', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<ProjectForm {...defaultProps} onSubmit={onSubmit} />);

      // Fill form without requester
      const customerInput = screen.getAllByRole('combobox')[0];
      await user.click(customerInput);
      await user.click(screen.getByText('Samsung Electronics'));

      await user.type(screen.getByPlaceholderText('Enter project name'), 'Project');

      // Select due date - navigate to next month and pick day 15
      const dateButton = screen.getByRole('button', { name: /select due date/i });
      await user.click(dateButton);
      const nextMonthButton = screen.getByRole('button', { name: /next month/i });
      await user.click(nextMonthButton);
      // Click day 15 - dynamically calculate next month's date
      const nextMonthDate2 = new Date();
      nextMonthDate2.setMonth(nextMonthDate2.getMonth() + 1);
      nextMonthDate2.setDate(15);
      const expectedLabel2 = nextMonthDate2.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const day15Button = screen.getByRole('button', { name: new RegExp(expectedLabel2, 'i') });
      await user.click(day15Button);

      const ownerInput = screen.getAllByRole('combobox')[1];
      await user.click(ownerInput);
      await user.click(screen.getByText('Lee Jiwon (Sales)'));

      await user.click(screen.getByRole('button', { name: /create project/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            requesterName: undefined,
          })
        );
      });
    });
  });

  describe('cancel button', () => {
    it('should call onCancel when clicked', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<ProjectForm {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe('submitting state', () => {
    it('should disable all inputs when submitting', () => {
      render(<ProjectForm {...defaultProps} isSubmitting />);

      // Combobox inputs should be disabled
      const comboboxes = screen.getAllByRole('combobox');
      comboboxes.forEach(input => {
        expect(input).toBeDisabled();
      });

      // Text inputs should be disabled
      const textboxes = screen.getAllByRole('textbox');
      textboxes.forEach(input => {
        expect(input).toBeDisabled();
      });
    });

    it('should disable buttons when submitting', () => {
      render(<ProjectForm {...defaultProps} isSubmitting />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /create project/i })).toBeDisabled();
    });

    it('should show loading state on submit button', () => {
      render(<ProjectForm {...defaultProps} isSubmitting />);

      // Button should have loading indicator (controlled by Button component)
      const submitButton = screen.getByRole('button', { name: /create project/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('should display error message when error prop provided', () => {
      render(<ProjectForm {...defaultProps} error="Failed to create project" />);

      expect(screen.getByText('Failed to create project')).toBeInTheDocument();
    });

    it('should call onDismissError when error is dismissed', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const onDismissError = vi.fn();
      render(
        <ProjectForm {...defaultProps} error="Error message" onDismissError={onDismissError} />
      );

      // Find and click dismiss button (ErrorAlert has close button)
      const alert = screen.getByRole('alert');
      const closeButton = alert.querySelector('button');
      if (closeButton) {
        await user.click(closeButton);
        expect(onDismissError).toHaveBeenCalledOnce();
      }
    });
  });

  describe('required field indicators', () => {
    it('should mark customer as required', () => {
      render(<ProjectForm {...defaultProps} />);

      const customerLabel = screen.getByText('Customer');
      const requiredIndicator = customerLabel.parentElement?.querySelector('.text-red-400');
      expect(requiredIndicator).toBeInTheDocument();
    });

    it('should mark project name as required', () => {
      render(<ProjectForm {...defaultProps} />);

      const label = screen.getByText('Project Name');
      const requiredIndicator = label.parentElement?.querySelector('.text-red-400');
      expect(requiredIndicator).toBeInTheDocument();
    });

    it('should mark due date as required', () => {
      render(<ProjectForm {...defaultProps} />);

      const label = screen.getByText('Due Date');
      const requiredIndicator = label.parentElement?.querySelector('.text-red-400');
      expect(requiredIndicator).toBeInTheDocument();
    });

    it('should mark internal owner as required', () => {
      render(<ProjectForm {...defaultProps} />);

      const label = screen.getByText('Internal Owner');
      const requiredIndicator = label.parentElement?.querySelector('.text-red-400');
      expect(requiredIndicator).toBeInTheDocument();
    });

    it('should not mark requester name as required', () => {
      render(<ProjectForm {...defaultProps} />);

      const label = screen.getByText('Requester Name');
      const requiredIndicator = label.parentElement?.querySelector('.text-red-400');
      expect(requiredIndicator).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have form element', () => {
      const { container } = render(<ProjectForm {...defaultProps} />);

      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('should have proper button types', () => {
      render(<ProjectForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toHaveAttribute('type', 'button');
      expect(screen.getByRole('button', { name: /create project/i })).toHaveAttribute(
        'type',
        'submit'
      );
    });
  });

  describe('disabled fields in edit mode', () => {
    it('should disable customer field in edit mode', () => {
      render(<ProjectForm {...defaultProps} mode="edit" initialData={createMockProject()} />);

      // Customer is the first combobox
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes[0]).toBeDisabled();
    });

    it('should disable internal owner field in edit mode', () => {
      render(<ProjectForm {...defaultProps} mode="edit" initialData={createMockProject()} />);

      // Internal owner is the second combobox
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes[1]).toBeDisabled();
    });
  });
});
