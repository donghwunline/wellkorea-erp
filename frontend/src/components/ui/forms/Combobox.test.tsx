/**
 * Unit tests for Combobox component.
 * Tests rendering, selection, filtering, keyboard navigation, async loading, and accessibility.
 */

import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Combobox, type ComboboxOption } from './Combobox';

// Mock scrollIntoView since JSDOM doesn't implement it
Element.prototype.scrollIntoView = vi.fn();

// Mock getBoundingClientRect for portal positioning
const mockRect = {
  bottom: 100,
  height: 40,
  left: 0,
  right: 200,
  top: 60,
  width: 200,
  x: 0,
  y: 60,
  toJSON: () => ({}),
};

Element.prototype.getBoundingClientRect = vi.fn(() => mockRect);

// Mock options for testing
const mockOptions: ComboboxOption[] = [
  { id: 1, label: 'Samsung Electronics' },
  { id: 2, label: 'LG Display' },
  { id: 3, label: 'SK Hynix' },
  { id: 4, label: 'Hyundai Motor' },
  { id: 5, label: 'POSCO', description: 'Steel manufacturer' },
];

describe('Combobox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with label', () => {
      render(<Combobox label="Customer" value={null} onChange={vi.fn()} options={mockOptions} />);

      expect(screen.getByText('Customer')).toBeInTheDocument();
    });

    it('should render required indicator when required', () => {
      render(
        <Combobox label="Customer" value={null} onChange={vi.fn()} options={mockOptions} required />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render placeholder when no value', () => {
      render(
        <Combobox
          value={null}
          onChange={vi.fn()}
          options={mockOptions}
          placeholder="Select customer..."
        />
      );

      expect(screen.getByPlaceholderText('Select customer...')).toBeInTheDocument();
    });

    it('should render selected option label when value provided', () => {
      render(<Combobox value={1} onChange={vi.fn()} options={mockOptions} />);

      expect(screen.getByDisplayValue('Samsung Electronics')).toBeInTheDocument();
    });

    it('should render error message when error provided', () => {
      render(
        <Combobox value={null} onChange={vi.fn()} options={mockOptions} error="Selection required" />
      );

      expect(screen.getByText('Selection required')).toBeInTheDocument();
    });

    it('should render help text when provided', () => {
      render(
        <Combobox
          value={null}
          onChange={vi.fn()}
          options={mockOptions}
          helpText="Choose a customer from the list"
        />
      );

      expect(screen.getByText('Choose a customer from the list')).toBeInTheDocument();
    });

    it('should not render dropdown initially', () => {
      render(<Combobox value={null} onChange={vi.fn()} options={mockOptions} />);

      expect(screen.queryByText('Samsung Electronics')).not.toBeInTheDocument();
    });
  });

  describe('dropdown interaction', () => {
    it('should open dropdown when input is clicked', async () => {
      const user = userEvent.setup();
      render(<Combobox value={null} onChange={vi.fn()} options={mockOptions} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      expect(screen.getByText('LG Display')).toBeInTheDocument();
    });

    it('should open dropdown when input is focused', async () => {
      const user = userEvent.setup();
      render(<Combobox value={null} onChange={vi.fn()} options={mockOptions} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Combobox value={null} onChange={vi.fn()} options={mockOptions} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      // Open dropdown
      await user.click(screen.getByRole('textbox'));
      expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByTestId('outside'));

      // Dropdown should be closed
      await waitFor(() => {
        expect(screen.queryByText('Samsung Electronics')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when Escape is pressed', async () => {
      const user = userEvent.setup();
      render(<Combobox value={null} onChange={vi.fn()} options={mockOptions} />);

      // Open dropdown
      await user.click(screen.getByRole('textbox'));
      expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();

      // Press Escape
      await user.keyboard('{Escape}');

      expect(screen.queryByText('Samsung Electronics')).not.toBeInTheDocument();
    });

    it('should close dropdown when Tab is pressed', async () => {
      const user = userEvent.setup();
      render(<Combobox value={null} onChange={vi.fn()} options={mockOptions} />);

      // Open dropdown
      await user.click(screen.getByRole('textbox'));
      expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();

      // Press Tab
      await user.keyboard('{Tab}');

      expect(screen.queryByText('Samsung Electronics')).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('should call onChange when option is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Combobox value={null} onChange={handleChange} options={mockOptions} />);

      // Open dropdown
      await user.click(screen.getByRole('textbox'));

      // Click option
      await user.click(screen.getByText('LG Display'));

      expect(handleChange).toHaveBeenCalledWith(2, mockOptions[1]);
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<Combobox value={null} onChange={vi.fn()} options={mockOptions} />);

      // Open dropdown
      await user.click(screen.getByRole('textbox'));

      // Click option
      await user.click(screen.getByText('LG Display'));

      expect(screen.queryByText('Samsung Electronics')).not.toBeInTheDocument();
    });

    it('should highlight selected option', async () => {
      const user = userEvent.setup();
      render(<Combobox value={2} onChange={vi.fn()} options={mockOptions} />);

      // Open dropdown
      await user.click(screen.getByRole('textbox'));

      // Find LG Display option - it should have selected styling
      const option = screen.getByText('LG Display').closest('li');
      expect(option).toHaveClass('bg-copper-500/10');
    });

    it('should show checkmark on selected option', async () => {
      const user = userEvent.setup();
      render(<Combobox value={2} onChange={vi.fn()} options={mockOptions} />);

      // Open dropdown
      await user.click(screen.getByRole('textbox'));

      // Selected option should have checkmark (SVG)
      const option = screen.getByText('LG Display').closest('li');
      const checkmark = option?.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
    });
  });

  describe('clear selection', () => {
    it('should show clear button when value is selected', () => {
      render(<Combobox value={1} onChange={vi.fn()} options={mockOptions} />);

      expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument();
    });

    it('should not show clear button when no value', () => {
      render(<Combobox value={null} onChange={vi.fn()} options={mockOptions} />);

      expect(screen.queryByRole('button', { name: /clear selection/i })).not.toBeInTheDocument();
    });

    it('should call onChange with null when clear is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Combobox value={1} onChange={handleChange} options={mockOptions} />);

      await user.click(screen.getByRole('button', { name: /clear selection/i }));

      expect(handleChange).toHaveBeenCalledWith(null, null);
    });
  });

  describe('filtering', () => {
    it('should filter options as user types', async () => {
      const user = userEvent.setup();
      render(
        <Combobox value={null} onChange={vi.fn()} options={mockOptions} />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.type(input, 'LG');

      // Check that only LG Display is in the list (text is split by <mark>)
      // Portal renders to document.body
      const listItems = document.body.querySelectorAll('li');
      expect(listItems).toHaveLength(1);
      expect(listItems[0].textContent).toContain('LG Display');
      expect(screen.queryByText('Samsung Electronics')).not.toBeInTheDocument();
    });

    it('should show no results message when no matches', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          value={null}
          onChange={vi.fn()}
          options={mockOptions}
          noResultsText="No customers found"
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.type(input, 'xyz');

      expect(screen.getByText('No customers found')).toBeInTheDocument();
    });

    it('should filter by description if provided', async () => {
      const user = userEvent.setup();
      render(
        <Combobox value={null} onChange={vi.fn()} options={mockOptions} />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.type(input, 'Steel');

      // POSCO has "Steel manufacturer" as description
      // Portal renders to document.body
      const listItems = document.body.querySelectorAll('li');
      expect(listItems).toHaveLength(1);
      expect(listItems[0].textContent).toContain('POSCO');
      expect(listItems[0].textContent).toContain('Steel manufacturer');
    });

    it('should highlight matching text in options', async () => {
      const user = userEvent.setup();
      render(<Combobox value={null} onChange={vi.fn()} options={mockOptions} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.type(input, 'Sam');

      // Check for mark element highlighting
      const mark = screen.getByText('Sam');
      expect(mark.tagName).toBe('MARK');
    });
  });

  describe('keyboard navigation', () => {
    it('should open dropdown on ArrowDown when closed', async () => {
      const user = userEvent.setup();
      render(<Combobox value={null} onChange={vi.fn()} options={mockOptions} />);

      const input = screen.getByRole('textbox');
      input.focus();
      await user.keyboard('{ArrowDown}');

      expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
    });

    it('should navigate down with ArrowDown', async () => {
      const user = userEvent.setup();
      render(
        <Combobox value={null} onChange={vi.fn()} options={mockOptions} />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);

      // First option should be highlighted by default
      let highlighted = document.body.querySelector('[data-highlighted="true"]');
      expect(highlighted?.textContent).toContain('Samsung Electronics');

      // Navigate down
      await user.keyboard('{ArrowDown}');

      highlighted = document.body.querySelector('[data-highlighted="true"]');
      expect(highlighted?.textContent).toContain('LG Display');
    });

    it('should navigate up with ArrowUp', async () => {
      const user = userEvent.setup();
      render(
        <Combobox value={null} onChange={vi.fn()} options={mockOptions} />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);

      // Navigate to third option
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      // Navigate back up
      await user.keyboard('{ArrowUp}');

      const highlighted = document.body.querySelector('[data-highlighted="true"]');
      expect(highlighted?.textContent).toContain('LG Display');
    });

    it('should select highlighted option on Enter', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Combobox value={null} onChange={handleChange} options={mockOptions} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      // Navigate to second option
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(handleChange).toHaveBeenCalledWith(2, mockOptions[1]);
    });

    it('should not navigate past last option', async () => {
      const user = userEvent.setup();
      render(
        <Combobox value={null} onChange={vi.fn()} options={mockOptions} />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);

      // Navigate past all options
      for (let i = 0; i < 10; i++) {
        await user.keyboard('{ArrowDown}');
      }

      const highlighted = document.body.querySelector('[data-highlighted="true"]');
      expect(highlighted?.textContent).toContain('POSCO');
    });

    it('should not navigate before first option', async () => {
      const user = userEvent.setup();
      render(
        <Combobox value={null} onChange={vi.fn()} options={mockOptions} />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);

      // Try to navigate up from first option
      await user.keyboard('{ArrowUp}');

      const highlighted = document.body.querySelector('[data-highlighted="true"]');
      expect(highlighted?.textContent).toContain('Samsung Electronics');
    });
  });

  describe('async loading', () => {
    it('should show loading indicator when loading async options', async () => {
      const user = userEvent.setup();
      const loadOptions = vi.fn(
        () => new Promise<ComboboxOption[]>(() => {}) // Never resolves
      );
      render(
        <Combobox
          value={null}
          onChange={vi.fn()}
          loadOptions={loadOptions}
          loadingText="Loading customers..."
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Loading customers...')).toBeInTheDocument();
      });
    });

    it('should display async loaded options', async () => {
      const user = userEvent.setup();
      const loadOptions = vi.fn().mockResolvedValue(mockOptions);
      render(<Combobox value={null} onChange={vi.fn()} loadOptions={loadOptions} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });
    });

    it('should call loadOptions with search query', async () => {
      const user = userEvent.setup();
      const loadOptions = vi.fn().mockResolvedValue([]);
      render(<Combobox value={null} onChange={vi.fn()} loadOptions={loadOptions} debounceMs={0} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(loadOptions).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('create new option', () => {
    it('should show create option when onCreateNew provided and no exact match', async () => {
      const user = userEvent.setup();
      const handleCreateNew = vi.fn();
      render(
        <Combobox
          value={null}
          onChange={vi.fn()}
          options={mockOptions}
          onCreateNew={handleCreateNew}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.type(input, 'New Company');

      expect(screen.getByText(/Create "New Company"/)).toBeInTheDocument();
    });

    it('should not show create option when exact match exists', async () => {
      const user = userEvent.setup();
      const handleCreateNew = vi.fn();
      render(
        <Combobox
          value={null}
          onChange={vi.fn()}
          options={mockOptions}
          onCreateNew={handleCreateNew}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.type(input, 'Samsung Electronics');

      expect(screen.queryByText(/Create/)).not.toBeInTheDocument();
    });

    it('should call onCreateNew when create option is clicked', async () => {
      const user = userEvent.setup();
      const handleCreateNew = vi.fn();
      render(
        <Combobox
          value={null}
          onChange={vi.fn()}
          options={mockOptions}
          onCreateNew={handleCreateNew}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.type(input, 'New Company');
      await user.click(screen.getByText(/Create "New Company"/));

      expect(handleCreateNew).toHaveBeenCalledWith('New Company');
    });
  });

  describe('disabled state', () => {
    it('should not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(<Combobox value={null} onChange={vi.fn()} options={mockOptions} disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();

      await user.click(input);

      expect(screen.queryByText('Samsung Electronics')).not.toBeInTheDocument();
    });

    it('should not show clear button when disabled', () => {
      render(<Combobox value={1} onChange={vi.fn()} options={mockOptions} disabled />);

      expect(screen.queryByRole('button', { name: /clear selection/i })).not.toBeInTheDocument();
    });

    it('should apply disabled styling', () => {
      const { container } = render(
        <Combobox value={null} onChange={vi.fn()} options={mockOptions} disabled />
      );

      const wrapper = container.querySelector('.opacity-50');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('disabled options', () => {
    it('should not select disabled option', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const optionsWithDisabled: ComboboxOption[] = [
        { id: 1, label: 'Active Option' },
        { id: 2, label: 'Disabled Option', disabled: true },
      ];
      render(<Combobox value={null} onChange={handleChange} options={optionsWithDisabled} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.click(screen.getByText('Disabled Option'));

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should apply disabled styling to disabled options', async () => {
      const user = userEvent.setup();
      const optionsWithDisabled: ComboboxOption[] = [
        { id: 1, label: 'Active Option' },
        { id: 2, label: 'Disabled Option', disabled: true },
      ];
      render(<Combobox value={null} onChange={vi.fn()} options={optionsWithDisabled} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      const disabledOption = screen.getByText('Disabled Option').closest('li');
      expect(disabledOption).toHaveClass('opacity-50');
    });
  });

  describe('accessibility', () => {
    it('should have accessible label', () => {
      render(<Combobox label="Customer" value={null} onChange={vi.fn()} options={mockOptions} />);

      expect(screen.getByText('Customer')).toBeInTheDocument();
    });

    it('should apply error styling when error present', () => {
      const { container } = render(
        <Combobox
          value={null}
          onChange={vi.fn()}
          options={mockOptions}
          error="Selection required"
        />
      );

      const inputWrapper = container.querySelector('.border-red-500\\/50');
      expect(inputWrapper).toBeInTheDocument();
    });

    it('should have list element for dropdown', async () => {
      const user = userEvent.setup();
      render(
        <Combobox value={null} onChange={vi.fn()} options={mockOptions} />
      );

      await user.click(screen.getByRole('textbox'));

      // Dropdown uses ul element (portal renders to document.body)
      const list = document.body.querySelector('ul');
      expect(list).toBeInTheDocument();
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to container div', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Combobox ref={ref} value={null} onChange={vi.fn()} options={mockOptions} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('option description', () => {
    it('should display option description when provided', async () => {
      const user = userEvent.setup();
      render(<Combobox value={null} onChange={vi.fn()} options={mockOptions} />);

      await user.click(screen.getByRole('textbox'));

      expect(screen.getByText('Steel manufacturer')).toBeInTheDocument();
    });
  });
});
