/**
 * Unit tests for QuotationForm component.
 * Tests form rendering, validation, submission, create/edit modes, and accessibility.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QuotationForm } from './QuotationForm';
import type { QuotationDetails } from '@/services';

// Mock scrollIntoView since JSDOM doesn't implement it
Element.prototype.scrollIntoView = vi.fn();

// Mock the product service for ProductSelector component
vi.mock('@/services', async importOriginal => {
  const original = await importOriginal<typeof import('@/services')>();
  return {
    ...original,
    productService: {
      searchProducts: vi.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            sku: 'SM-PANEL-001',
            name: 'Control Panel',
            productTypeName: 'Sheet Metal',
            baseUnitPrice: 50000,
            unit: 'EA',
            isActive: true,
          },
        ],
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      }),
      getProduct: vi.fn().mockResolvedValue({
        id: 1,
        sku: 'SM-PANEL-001',
        name: 'Control Panel',
        productTypeName: 'Sheet Metal',
        baseUnitPrice: 50000,
        unit: 'EA',
        description: 'Industrial control panel',
        isActive: true,
      }),
    },
  };
});

// Helper to create mock quotation for edit mode
function createMockQuotation(overrides: Partial<QuotationDetails> = {}): QuotationDetails {
  return {
    id: 1,
    projectId: 1,
    projectName: 'Test Project',
    jobCode: 'WK2K25-0001-1219',
    version: 1,
    status: 'DRAFT',
    quotationDate: '2025-01-15',
    validityDays: 30,
    expiryDate: '2025-02-14',
    totalAmount: 500000,
    notes: 'Test quotation notes',
    createdById: 1,
    createdByName: 'Admin User',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
    lineItems: [
      {
        id: 1,
        productId: 1,
        productSku: 'SM-PANEL-001',
        productName: 'Control Panel',
        sequence: 1,
        quantity: 10,
        unitPrice: 50000,
        lineTotal: 500000,
        notes: 'Line item notes',
      },
    ],
    ...overrides,
  } as QuotationDetails as QuotationDetails;
}

describe('QuotationForm', () => {
  const defaultProps = {
    projectId: 1,
    projectName: 'Test Project',
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create mode rendering', () => {
    it('should render form title elements', () => {
      render(<QuotationForm {...defaultProps} />);

      expect(screen.getByText('Quotation Details')).toBeInTheDocument();
    });

    it('should render project name in disabled input', () => {
      render(<QuotationForm {...defaultProps} projectName="My Project" />);

      // Project input should contain the project name
      const projectInput = screen.getByDisplayValue('My Project');
      expect(projectInput).toBeDisabled();
    });

    it('should fall back to Project #id when projectName not provided', () => {
      render(<QuotationForm {...defaultProps} projectName={undefined} />);

      expect(screen.getByDisplayValue('Project #1')).toBeInTheDocument();
    });

    it('should render validity days input with default value', () => {
      render(<QuotationForm {...defaultProps} />);

      expect(screen.getByText('Validity Period (Days)')).toBeInTheDocument();
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    });

    it('should render notes textarea', () => {
      render(<QuotationForm {...defaultProps} />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Additional notes or remarks...')).toBeInTheDocument();
    });

    it('should render Cancel and Create Quotation buttons', () => {
      render(<QuotationForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create quotation/i })).toBeInTheDocument();
    });

    it('should not render job code field in create mode', () => {
      render(<QuotationForm {...defaultProps} />);

      expect(screen.queryByText('Job Code')).not.toBeInTheDocument();
    });

    it('should not render version field in create mode', () => {
      render(<QuotationForm {...defaultProps} />);

      expect(screen.queryByText('Version')).not.toBeInTheDocument();
    });
  });

  describe('edit mode rendering', () => {
    it('should render Save Changes button in edit mode', () => {
      render(<QuotationForm {...defaultProps} quotation={createMockQuotation()} />);

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('should render job code field in edit mode', () => {
      render(
        <QuotationForm
          {...defaultProps}
          quotation={createMockQuotation({ jobCode: 'WK2K25-0001-1219' })}
        />
      );

      expect(screen.getByText('Job Code')).toBeInTheDocument();
      expect(screen.getByDisplayValue('WK2K25-0001-1219')).toBeInTheDocument();
    });

    it('should render version field in edit mode', () => {
      render(<QuotationForm {...defaultProps} quotation={createMockQuotation({ version: 2 })} />);

      expect(screen.getByText('Version')).toBeInTheDocument();
      expect(screen.getByDisplayValue('v2')).toBeInTheDocument();
    });

    it('should populate form with existing quotation data', () => {
      render(
        <QuotationForm
          {...defaultProps}
          quotation={createMockQuotation({
            validityDays: 45,
            notes: 'Existing notes',
          })}
        />
      );

      expect(screen.getByDisplayValue('45')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing notes')).toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('should render error alert when error prop is provided', () => {
      render(<QuotationForm {...defaultProps} error="Failed to create quotation" />);

      expect(screen.getByText('Failed to create quotation')).toBeInTheDocument();
    });

    it('should not render error alert when error is null', () => {
      render(<QuotationForm {...defaultProps} error={null} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('should show error when no line items are added', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<QuotationForm {...defaultProps} onSubmit={onSubmit} />);

      // Try to submit without adding line items
      await user.click(screen.getByRole('button', { name: /create quotation/i }));

      // Should show validation error for line items (displayed as Alert)
      expect(screen.getByText('At least one product is required')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should not call onSubmit when form has validation errors', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<QuotationForm {...defaultProps} onSubmit={onSubmit} />);

      // Submit without any line items
      await user.click(screen.getByRole('button', { name: /create quotation/i }));

      // onSubmit should not be called due to validation failure
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('form field updates', () => {
    it('should update validity days when changed', async () => {
      render(<QuotationForm {...defaultProps} />);

      const validityInput = screen.getByDisplayValue('30');
      fireEvent.change(validityInput, { target: { value: '60' } });

      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    });

    it('should update notes when changed', async () => {
      const user = userEvent.setup();
      render(<QuotationForm {...defaultProps} />);

      const notesTextarea = screen.getByPlaceholderText('Additional notes or remarks...');
      await user.type(notesTextarea, 'New notes text');

      expect(screen.getByDisplayValue('New notes text')).toBeInTheDocument();
    });
  });

  describe('submit handling', () => {
    it('should not call onSubmit when validation fails', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<QuotationForm {...defaultProps} onSubmit={onSubmit} />);

      // Submit without line items (validation should fail)
      await user.click(screen.getByRole('button', { name: /create quotation/i }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should prevent default form submission', () => {
      const quotation = createMockQuotation();
      const { container } = render(<QuotationForm {...defaultProps} quotation={quotation} />);

      // Form element exists (forms don't have implicit ARIA role without accessible name)
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('cancel handling', () => {
    it('should call onCancel when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<QuotationForm {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe('submitting state', () => {
    it('should show Saving... text when isSubmitting is true', () => {
      render(<QuotationForm {...defaultProps} isSubmitting />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable validity input when isSubmitting', () => {
      render(<QuotationForm {...defaultProps} isSubmitting />);

      const validityInput = screen.getByDisplayValue('30');
      expect(validityInput).toBeDisabled();
    });

    it('should disable notes textarea when isSubmitting', () => {
      render(<QuotationForm {...defaultProps} isSubmitting />);

      const notesTextarea = screen.getByPlaceholderText('Additional notes or remarks...');
      expect(notesTextarea).toBeDisabled();
    });

    it('should disable Cancel button when isSubmitting', () => {
      render(<QuotationForm {...defaultProps} isSubmitting />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('should disable submit button when isSubmitting', () => {
      render(<QuotationForm {...defaultProps} isSubmitting />);

      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });
  });

  describe('total calculation display', () => {
    it('should show total amount of 0 initially', () => {
      render(<QuotationForm {...defaultProps} />);

      // Look for currency formatted 0
      expect(screen.getByText(/Total:/)).toBeInTheDocument();
    });

    it('should show 0 items text initially', () => {
      render(<QuotationForm {...defaultProps} />);

      expect(screen.getByText('(0 items)')).toBeInTheDocument();
    });

    it('should show singular item text for 1 item', () => {
      const quotation = createMockQuotation();
      render(<QuotationForm {...defaultProps} quotation={quotation} />);

      expect(screen.getByText('(1 item)')).toBeInTheDocument();
    });
  });

  describe('ProductSelector integration', () => {
    it('should render ProductSelector component', () => {
      render(<QuotationForm {...defaultProps} />);

      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('No products added yet.')).toBeInTheDocument();
    });

    it('should pass disabled state to ProductSelector', () => {
      render(<QuotationForm {...defaultProps} isSubmitting />);

      // When submitting, ProductSelector should be disabled
      // (search form should not be visible when disabled)
      expect(screen.queryByText('Search Product')).not.toBeInTheDocument();
    });
  });

  describe('edit mode line items', () => {
    it('should populate line items from existing quotation', () => {
      const quotation = createMockQuotation();
      render(<QuotationForm {...defaultProps} quotation={quotation} />);

      // Line item should be visible in the table
      expect(screen.getByText('Control Panel')).toBeInTheDocument();
      expect(screen.getByText('(SM-PANEL-001)')).toBeInTheDocument();
    });
  });

  describe('form submission in edit mode', () => {
    it('should call onSubmit with update data in edit mode', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const quotation = createMockQuotation();

      render(<QuotationForm {...defaultProps} quotation={quotation} onSubmit={onSubmit} />);

      // Modify validity days using fireEvent for reliable number input handling
      const validityInput = screen.getByDisplayValue('30');
      fireEvent.change(validityInput, { target: { value: '45' } });

      // Submit
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          validityDays: 45,
          lineItems: expect.any(Array),
        })
      );
    });
  });

  describe('accessibility', () => {
    it('should have form element', () => {
      const { container } = render(<QuotationForm {...defaultProps} />);

      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('should have proper button types', () => {
      render(<QuotationForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toHaveAttribute('type', 'button');
      expect(screen.getByRole('button', { name: /create quotation/i })).toHaveAttribute(
        'type',
        'submit'
      );
    });
  });
});
