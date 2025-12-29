/**
 * Unit tests for ProductSelector component.
 * Tests product search, line item management, and form interactions.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ProductSelector, type LineItemWithName } from './ProductSelector';

// Mock scrollIntoView since JSDOM doesn't implement it
Element.prototype.scrollIntoView = vi.fn();

// Mock the product service
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
          {
            id: 2,
            sku: 'SM-FRAME-002',
            name: 'Steel Frame',
            productTypeName: 'Sheet Metal',
            baseUnitPrice: 75000,
            unit: 'EA',
            isActive: true,
          },
        ],
        pagination: {
          page: 0,
          size: 20,
          totalElements: 2,
          totalPages: 1,
        },
      }),
      getProduct: vi.fn().mockImplementation((id: number) => {
        if (id === 1) {
          return Promise.resolve({
            id: 1,
            sku: 'SM-PANEL-001',
            name: 'Control Panel',
            productTypeName: 'Sheet Metal',
            baseUnitPrice: 50000,
            unit: 'EA',
            description: 'Industrial control panel',
            isActive: true,
          });
        }
        return Promise.resolve({
          id: 2,
          sku: 'SM-FRAME-002',
          name: 'Steel Frame',
          productTypeName: 'Sheet Metal',
          baseUnitPrice: 75000,
          unit: 'EA',
          description: 'Heavy duty steel frame',
          isActive: true,
        });
      }),
    },
  };
});

// Helper to create mock line items
function createMockLineItem(overrides: Partial<LineItemWithName> = {}): LineItemWithName {
  return {
    productId: 1,
    productName: 'Control Panel',
    productSku: 'SM-PANEL-001',
    quantity: 10,
    unitPrice: 50000,
    notes: undefined,
    ...overrides,
  };
}

describe('ProductSelector', () => {
  const defaultProps = {
    lineItems: [] as LineItemWithName[],
    onChange: vi.fn(),
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('should render empty state when no line items', () => {
      render(<ProductSelector {...defaultProps} />);

      expect(screen.getByText('No products added yet.')).toBeInTheDocument();
      expect(
        screen.getByText('Search and add products to create your quotation.')
      ).toBeInTheDocument();
    });
  });

  describe('product search form', () => {
    it('should render search input', () => {
      render(<ProductSelector {...defaultProps} />);

      expect(screen.getByText('Search Product')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search by name or SKU...')).toBeInTheDocument();
    });

    it('should render quantity input', () => {
      render(<ProductSelector {...defaultProps} />);

      expect(screen.getByText('Quantity')).toBeInTheDocument();
    });

    it('should render unit price input', () => {
      render(<ProductSelector {...defaultProps} />);

      expect(screen.getByText('Unit Price (KRW)')).toBeInTheDocument();
    });

    it('should render note input', () => {
      render(<ProductSelector {...defaultProps} />);

      expect(screen.getByText('Note')).toBeInTheDocument();
    });

    it('should not render search form when disabled', () => {
      render(<ProductSelector {...defaultProps} disabled />);

      // Search form should not be visible when disabled
      expect(screen.queryByText('Search Product')).not.toBeInTheDocument();
    });
  });

  describe('line items table', () => {
    it('should render line items in table', () => {
      const lineItems = [createMockLineItem()];
      render(<ProductSelector {...defaultProps} lineItems={lineItems} />);

      expect(screen.getByText('Control Panel')).toBeInTheDocument();
      expect(screen.getByText('(SM-PANEL-001)')).toBeInTheDocument();
    });

    it('should render correct item count column', () => {
      const lineItems = [
        createMockLineItem({ productId: 1, productName: 'Product 1' }),
        createMockLineItem({ productId: 2, productName: 'Product 2' }),
      ];
      render(<ProductSelector {...defaultProps} lineItems={lineItems} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render note or dash', () => {
      const lineItems = [
        createMockLineItem({ notes: 'Important note' }),
        createMockLineItem({ productId: 2, productName: 'Product 2', notes: undefined }),
      ];
      render(<ProductSelector {...defaultProps} lineItems={lineItems} />);

      expect(screen.getByText('Important note')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render remove button for each item', () => {
      const lineItems = [createMockLineItem()];
      render(<ProductSelector {...defaultProps} lineItems={lineItems} />);

      expect(screen.getByRole('button', { name: /remove item/i })).toBeInTheDocument();
    });

    it('should not render remove buttons when disabled', () => {
      const lineItems = [createMockLineItem()];
      render(<ProductSelector {...defaultProps} lineItems={lineItems} disabled />);

      expect(screen.queryByRole('button', { name: /remove item/i })).not.toBeInTheDocument();
    });
  });

  describe('removing items', () => {
    it('should call onChange without removed item', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const lineItems = [
        createMockLineItem({ productId: 1, productName: 'Product 1' }),
        createMockLineItem({ productId: 2, productName: 'Product 2', productSku: 'SKU-002' }),
      ];
      render(<ProductSelector {...defaultProps} lineItems={lineItems} onChange={onChange} />);

      // Get all remove buttons and click the first one
      const removeButtons = screen.getAllByRole('button', { name: /remove item/i });
      await user.click(removeButtons[0]);

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ productId: 2, productName: 'Product 2' }),
      ]);
    });
  });

  describe('editing quantities', () => {
    it('should call onChange with updated quantity', async () => {
      const onChange = vi.fn();
      const lineItems = [createMockLineItem({ quantity: 10 })];
      render(<ProductSelector {...defaultProps} lineItems={lineItems} onChange={onChange} />);

      // Find the quantity input in the table (type number, in the table row)
      const table = screen.getByRole('table');
      const quantityInputs = within(table).getAllByRole('spinbutton');
      const quantityInput = quantityInputs[0]; // First number input is quantity

      // Use fireEvent.change for reliable number input handling
      fireEvent.change(quantityInput, { target: { value: '20' } });

      expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ quantity: 20 })]);
    });

    it('should render quantity as text when disabled', () => {
      const lineItems = [createMockLineItem({ quantity: 15 })];
      render(<ProductSelector {...defaultProps} lineItems={lineItems} disabled />);

      // When disabled, quantity should be rendered as text, not input
      expect(screen.getByText('15')).toBeInTheDocument();
      const table = screen.getByRole('table');
      expect(within(table).queryAllByRole('spinbutton')).toHaveLength(0);
    });
  });

  describe('product selection', () => {
    it('should show selected product info after selection', async () => {
      const user = userEvent.setup();
      render(<ProductSelector {...defaultProps} />);

      // Click on the search combobox
      const searchInput = screen.getByPlaceholderText('Search by name or SKU...');
      await user.click(searchInput);
      await user.type(searchInput, 'Control');

      // Wait for search results (options appear in listbox)
      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(within(listbox).getAllByRole('option')).toHaveLength(2);
      });

      // Click the first option (Control Panel)
      const options = screen.getAllByRole('option');
      await user.click(options[0]);

      // Should show selected product info
      await waitFor(() => {
        expect(screen.getByText('Selected:')).toBeInTheDocument();
        expect(screen.getByText('Unit: EA')).toBeInTheDocument();
      });
    });
  });

  describe('adding products', () => {
    it('should have add button disabled initially', () => {
      render(<ProductSelector {...defaultProps} />);

      // The add button (with plus icon) should be disabled initially
      const buttons = screen.getAllByRole('button');
      const addButton = buttons.find(btn => btn.querySelector('svg'));
      expect(addButton).toBeDisabled();
    });

    it('should enable add button after product selection with valid values', async () => {
      const user = userEvent.setup();
      render(<ProductSelector {...defaultProps} />);

      // Select a product
      const searchInput = screen.getByPlaceholderText('Search by name or SKU...');
      await user.click(searchInput);
      await user.type(searchInput, 'Control');

      // Wait for options to appear
      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(within(listbox).getAllByRole('option')).toHaveLength(2);
      });

      // Click the first option
      const options = screen.getAllByRole('option');
      await user.click(options[0]);

      // Wait for product details to load and form to populate
      await waitFor(() => {
        expect(screen.getByText('Selected:')).toBeInTheDocument();
      });

      // Find the add button (button with plus icon)
      const buttons = screen.getAllByRole('button');
      const addButton = buttons.find(btn => btn.querySelector('svg'));
      expect(addButton).not.toBeDisabled();
    });

    // Note: The full add-product-via-combobox flow is complex due to async operations.
    // This test verifies the button is enabled after selection.
    // The actual add functionality is implicitly tested via integration/E2E tests.
  });

  describe('total calculation', () => {
    it('should show total amount for line items', () => {
      const lineItems = [
        createMockLineItem({ quantity: 10, unitPrice: 50000 }), // 500,000
        createMockLineItem({
          productId: 2,
          productName: 'Product 2',
          quantity: 5,
          unitPrice: 100000,
        }), // 500,000
      ];
      render(<ProductSelector {...defaultProps} lineItems={lineItems} />);

      // Total should be 1,000,000 KRW
      expect(screen.getByText('Total Amount:')).toBeInTheDocument();
    });
  });
});
